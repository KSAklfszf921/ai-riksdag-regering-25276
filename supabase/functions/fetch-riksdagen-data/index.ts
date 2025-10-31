import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DokumentData {
  dok_id: string;
  rm?: string;
  beteckning?: string;
  doktyp?: string;
  typ?: string;
  subtyp?: string;
  organ?: string;
  nummer?: string;
  datum?: string;
  systemdatum?: string;
  titel?: string;
  subtitel?: string;
  status?: string;
  dokument_url_text?: string;
  dokument_url_html?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { dataType, limit = 50 } = await req.json();

    console.log(`Hämtar ${dataType} data från Riksdagens API...`);

    let apiUrl = '';
    let tableName = '';

    if (dataType === 'dokument') {
      // Hämta senaste dokumenten
      apiUrl = `https://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&facets=&sort=datum&sortorder=desc&rapport=&utformat=json&a=s&p=1&sz=${limit}`;
      tableName = 'riksdagen_dokument';
    } else if (dataType === 'ledamoter') {
      // Riksdagens API har inte ett direkt ledamöter-endpoint, men vi kan hämta från en annan källa
      // För nu returnerar vi ett exempel
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Ledamöter API kommer snart. Använd dokument först.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Okänd datatyp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Hämta data från Riksdagens API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Riksdagens API svarade med status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data hämtad från Riksdagens API:', data);

    let insertedCount = 0;
    let errors = 0;

    if (dataType === 'dokument' && data.dokumentlista?.dokument) {
      const dokument = Array.isArray(data.dokumentlista.dokument) 
        ? data.dokumentlista.dokument 
        : [data.dokumentlista.dokument];

      for (const dok of dokument) {
        try {
          const dokumentData: DokumentData = {
            dok_id: dok.dok_id || dok.id,
            rm: dok.rm,
            beteckning: dok.beteckning,
            doktyp: dok.doktyp,
            typ: dok.typ,
            subtyp: dok.subtyp,
            organ: dok.organ,
            nummer: dok.nummer,
            datum: dok.datum,
            systemdatum: dok.systemdatum,
            titel: dok.titel,
            subtitel: dok.subtitel,
            status: dok.status,
            dokument_url_text: dok.dokument_url_text,
            dokument_url_html: dok.dokument_url_html,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(dokumentData, { onConflict: 'dok_id' });

          if (error) {
            console.error('Fel vid insättning:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning av dokument:', err);
          errors++;
        }
      }
    }

    // Logga API-anropet
    await supabaseClient.from('riksdagen_api_log').insert({
      endpoint: dataType,
      status: 'success',
      antal_poster: insertedCount,
      felmeddelande: errors > 0 ? `${errors} fel uppstod` : null,
    });

    console.log(`Slutfört! Infogade ${insertedCount} poster, ${errors} fel.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: insertedCount,
        errors: errors,
        message: `Hämtade och sparade ${insertedCount} ${dataType}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fel:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Okänt fel uppstod';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
