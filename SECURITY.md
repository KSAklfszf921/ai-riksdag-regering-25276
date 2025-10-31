# Säkerhetsdokumentation

## Översikt
Detta dokument beskriver säkerhetsarkitekturen och best practices för applikationen.

## Autentisering & Auktorisering

### Rollbaserad Åtkomstkontroll (RBAC)
Systemet använder en dedikerad `user_roles` tabell med enum-typen `app_role` för att hantera användarroller:
- **admin**: Full systemåtkomst
- **moderator**: Begränsad administrativ åtkomst  
- **user**: Grundläggande användaråtkomst

### Säkerhetsdefinierade Funktioner
Funktionen `has_role(_user_id, _role)` använder `SECURITY DEFINER` för att undvika rekursiva RLS-problem:
```sql
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;
```

## Row Level Security (RLS)

### Aktiverade Tabeller
Alla känsliga tabeller har RLS aktiverat:
- `user_roles` - Användarroller
- `user_favorites` - Användarfavoriter
- `document_analytics` - Dokumentanalys
- `data_fetch_progress` - Data-hämtning progress
- `data_fetch_control` - Data-hämtning kontroll
- `file_download_queue` - Filnedladdningskö
- `api_fetch_logs` - API-loggar

### Policy-typer

#### Admin-Only Policies
Flera tabeller tillåter endast admin-åtkomst:
```sql
create policy "Only admins can [action]"
on table_name for [select|insert|update|delete]
using (public.has_role(auth.uid(), 'admin'));
```

#### User-Specific Policies
Användare kan endast se/ändra sin egen data:
```sql
create policy "Users can manage own favorites"
on user_favorites for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

#### Public Read Policies
Vissa data är publikt läsbara men skyddade för skrivning:
```sql
create policy "Anyone can read documents"
on riksdagen_dokument for select
using (true);
```

## Bootstrap Admin Policy

⚠️ **VIKTIGT: Initial Admin-Skapande**

Policyn "Anyone can insert first admin" tillåter att den första admin-användaren skapas:
```sql
create policy "Anyone can insert first admin"
on user_roles for insert
with check (
  role = 'admin' and
  not exists (select 1 from user_roles where role = 'admin')
);
```

**Säkerhetsöverväganden:**
- Denna policy är nödvändig för initial systemkonfiguration
- Den tillåter endast skapande av EN admin (kontrollerar att ingen admin finns)
- Efter att första admin skapats, blockeras ytterligare admin-skapanden av denna policy
- Överväganden för produktion:
  - Logga när denna policy används
  - Överväg att ta bort policyn efter initial setup
  - Lägg till IP-begränsningar eller tidsbegränsningar vid behov

## Edge Functions Säkerhet

### JWT-Verifiering
Alla edge functions har plattformsnivå JWT-verifiering aktiverad (`verify_jwt = true`):
- `fetch-riksdagen-data`
- `fetch-regeringskansliet-data`  
- `process-file-queue`

### Defense-in-Depth
Funktionerna implementerar flera lager av säkerhet:
1. **Plattformsnivå JWT-verifiering** (supabase/config.toml)
2. **Manuel autentiseringskontroll** (hämtar session)
3. **Admin-rollverifiering** (via `is_admin()` RPC)
4. **Input-validering** (kontrollerar dataType, parametrar)

### CORS-konfiguration
Alla edge functions använder säkra CORS-headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

## Input-validering

### Client-Side Validering
- Zod-schemas används för formulärvalidering
- Type-safety via TypeScript
- UI-feedback för valideringsfel

### Server-Side Validering
- Edge functions validerar alla inputs
- Sanitering av filvägar (`sanitizeStoragePath`)
- Type-kontroll av dataType-parametrar
- Längdbegränsningar på strings

## Storage Security

### Buckets
- `riksdagen-images` (public) - Bilder från Riksdagen
- `regeringskansliet-files` (public) - Filer från Regeringskansliet

### Storage Policies
RLS-policies kontrollerar åtkomst till storage:
```sql
create policy "Authenticated users can upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'bucket-name');
```

## Logging & Monitoring

### API Fetch Logs
Alla API-anrop loggas i `api_fetch_logs`:
- Tidsstämpel
- Endpoint
- Status (success/error)
- Felmeddelanden
- Antal items

### Edge Function Logs
Omfattande logging i edge functions för debugging:
- Autentisering/auktorisering events
- API-anrop och svar
- Fel och exceptions
- Progress-uppdateringar

## Best Practices

### ✅ DOs
- Använd alltid `has_role()` för rollkontroller
- Validera all input både client- och server-side
- Logga säkerhetshändelser
- Använd prepared statements (Supabase client)
- Håll secrets i Supabase Vault
- Implementera rate limiting vid behov

### ❌ DON'Ts
- Lagra roller i localStorage/sessionStorage
- Använd hårdkodade credentials
- Kör raw SQL-queries i edge functions
- Exponera känsliga API-nycklar i client-code
- Lita på client-side validering ensam
- Använd `SECURITY DEFINER` utan `set search_path`

## Incident Response

Vid säkerhetsincident:
1. Logga ut alla användare (revoke sessions via Supabase dashboard)
2. Granska `api_fetch_logs` och edge function logs
3. Kontrollera `user_roles` för oauktoriserade ändringar
4. Updatera secrets vid behov
5. Implementera ytterligare säkerhetsåtgärder

## Kontakt
För säkerhetsfrågor eller rapportering av sårbarheter, kontakta systemadministratören.
