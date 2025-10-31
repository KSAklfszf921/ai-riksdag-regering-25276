import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface G0vseDocument {
  document_id: string;
  titel?: string;
  publicerad_datum?: string;
  uppdaterad_datum?: string;
  typ?: string;
  kategorier?: string[];
  avsandare?: string;
  beteckningsnummer?: string;
  url?: string;
  markdown_url?: string;
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

    const { dataType, limit = 0 } = await req.json();

    console.log(`Hämtar ${dataType} data från g0v.se API...`);

    let apiUrl = '';
    let tableName = '';

    // Välj rätt endpoint baserat på datatyp
    if (dataType === 'pressmeddelanden') {
      apiUrl = 'https://g0v.se/pressmeddelanden.json';
      tableName = 'regeringskansliet_pressmeddelanden';
    } else if (dataType === 'propositioner') {
      apiUrl = 'https://g0v.se/rattsliga-dokument/proposition.json';
      tableName = 'regeringskansliet_propositioner';
    } else if (dataType === 'dokument') {
      apiUrl = 'https://g0v.se/api/items.json';
      tableName = 'regeringskansliet_dokument';
    } else if (dataType === 'kategorier') {
      apiUrl = 'https://g0v.se/api/codes.json';
      tableName = 'regeringskansliet_kategorier';
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Okänd datatyp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Anropar: ${apiUrl}`);

    // Hämta data från g0v.se API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`g0v.se API svarade med status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data hämtad från g0v.se API');

    let insertedCount = 0;
    let errors = 0;

    if (dataType === 'pressmeddelanden' && Array.isArray(data)) {
      const items = limit > 0 ? data.slice(0, limit) : data;
      
      for (const item of items) {
        try {
          const pressData = {
            document_id: item.id || item.url,
            titel: item.title,
            publicerad_datum: item.published,
            departement: item.sender,
            url: item.url,
            innehall: item.summary || item.description,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(pressData, { onConflict: 'document_id' });

          if (error) {
            console.error('Fel vid insättning:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning:', err);
          errors++;
        }
      }
    } else if (dataType === 'propositioner' && Array.isArray(data)) {
      const items = limit > 0 ? data.slice(0, limit) : data;
      
      for (const item of items) {
        try {
          const propData = {
            document_id: item.id || item.url,
            titel: item.title,
            publicerad_datum: item.published,
            beteckningsnummer: item.identifier,
            departement: item.sender,
            url: item.url,
            pdf_url: item.attachments?.[0]?.url,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(propData, { onConflict: 'document_id' });

          if (error) {
            console.error('Fel vid insättning:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning:', err);
          errors++;
        }
      }
    } else if (dataType === 'kategorier' && typeof data === 'object') {
      // Kategorier kommer som objekt med koder som nycklar
      for (const [kod, namn] of Object.entries(data)) {
        try {
          const kategoriData = {
            kod: kod,
            namn: namn as string,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(kategoriData, { onConflict: 'kod' });

          if (error) {
            console.error('Fel vid insättning:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning:', err);
          errors++;
        }
      }
    } else if (dataType === 'dokument' && Array.isArray(data)) {
      const items = limit > 0 ? data.slice(0, limit) : data;
      
      for (const item of items) {
        try {
          const docData = {
            document_id: item.id || item.url,
            titel: item.title,
            publicerad_datum: item.published,
            uppdaterad_datum: item.updated,
            typ: item.type,
            kategorier: item.categories,
            avsandare: item.sender,
            beteckningsnummer: item.identifier,
            url: item.url,
            markdown_url: item.url ? item.url.replace('regeringen.se', 'g0v.se').replace(/\/$/, '.md') : null,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(docData, { onConflict: 'document_id' });

          if (error) {
            console.error('Fel vid insättning:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning:', err);
          errors++;
        }
      }
    }

    // Logga API-anropet
    await supabaseClient.from('regeringskansliet_api_log').insert({
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
