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

    const { dataType } = await req.json();

    console.log(`Hämtar ${dataType} data från g0v.se API...`);

    const endpointMap: Record<string, { url: string, table: string }> = {
      'pressmeddelanden': { url: 'https://g0v.se/pressmeddelanden.json', table: 'regeringskansliet_pressmeddelanden' },
      'propositioner': { url: 'https://g0v.se/rattsliga-dokument/proposition.json', table: 'regeringskansliet_propositioner' },
      'dokument': { url: 'https://g0v.se/api/items.json', table: 'regeringskansliet_dokument' },
      'kategorier': { url: 'https://g0v.se/api/codes.json', table: 'regeringskansliet_kategorier' },
      'departementsserien': { url: 'https://g0v.se/rattsliga-dokument/departementsserien-och-promemorior.json', table: 'regeringskansliet_departementsserien' },
      'forordningsmotiv': { url: 'https://g0v.se/rattsliga-dokument/forordningsmotiv.json', table: 'regeringskansliet_forordningsmotiv' },
      'kommittedirektiv': { url: 'https://g0v.se/rattsliga-dokument/kommittedirektiv.json', table: 'regeringskansliet_kommittedirektiv' },
      'lagradsremiss': { url: 'https://g0v.se/rattsliga-dokument/lagradsremiss.json', table: 'regeringskansliet_lagradsremiss' },
      'skrivelse': { url: 'https://g0v.se/rattsliga-dokument/skrivelse.json', table: 'regeringskansliet_skrivelse' },
      'sou': { url: 'https://g0v.se/rattsliga-dokument/statens-offentliga-utredningar.json', table: 'regeringskansliet_sou' },
      'internationella-overenskommelser': { url: 'https://g0v.se/rattsliga-dokument/sveriges-internationella-overenskommelser.json', table: 'regeringskansliet_internationella_overenskommelser' },
      'faktapromemoria': { url: 'https://g0v.se/faktapromemoria.json', table: 'regeringskansliet_faktapromemoria' },
      'informationsmaterial': { url: 'https://g0v.se/informationsmaterial.json', table: 'regeringskansliet_informationsmaterial' },
      'mr-granskningar': { url: 'https://g0v.se/internationella-mr-granskningar-av-sverige.json', table: 'regeringskansliet_mr_granskningar' },
      'dagordningar': { url: 'https://g0v.se/kommenterade-dagordningar.json', table: 'regeringskansliet_dagordningar' },
      'rapporter': { url: 'https://g0v.se/rapporter.json', table: 'regeringskansliet_rapporter' },
      'remisser': { url: 'https://g0v.se/remisser.json', table: 'regeringskansliet_remisser' },
      'regeringsuppdrag': { url: 'https://g0v.se/regeringsuppdrag.json', table: 'regeringskansliet_regeringsuppdrag' },
      'regeringsarenden': { url: 'https://g0v.se/regeringsarenden.json', table: 'regeringskansliet_regeringsarenden' },
      'sakrad': { url: 'https://g0v.se/sakrad.json', table: 'regeringskansliet_sakrad' },
      'bistands-strategier': { url: 'https://g0v.se/strategier-for-internationellt-bistand.json', table: 'regeringskansliet_bistands_strategier' },
      'overenskommelser-avtal': { url: 'https://g0v.se/overenskommelser-och-avtal.json', table: 'regeringskansliet_overenskommelser_avtal' },
      'arendeforteckningar': { url: 'https://g0v.se/arendeforteckningar.json', table: 'regeringskansliet_arendeforteckningar' },
      'artiklar': { url: 'https://g0v.se/artiklar.json', table: 'regeringskansliet_artiklar' },
      'debattartiklar': { url: 'https://g0v.se/debattartiklar.json', table: 'regeringskansliet_debattartiklar' },
      'tal': { url: 'https://g0v.se/tal.json', table: 'regeringskansliet_tal' },
      'ud-avrader': { url: 'https://g0v.se/ud-avrader.json', table: 'regeringskansliet_ud_avrader' },
      'uttalanden': { url: 'https://g0v.se/uttalanden.json', table: 'regeringskansliet_uttalanden' },
    };

    const endpoint = endpointMap[dataType];
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ success: false, message: 'Okänd datatyp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiUrl = endpoint.url;
    const tableName = endpoint.table;

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
      const items = data;
      
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
      const items = data;
      
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
      const items = data;
      
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
    } else if (Array.isArray(data)) {
      // Hantera alla andra dokumenttyper med standardformat
      for (const item of data) {
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
