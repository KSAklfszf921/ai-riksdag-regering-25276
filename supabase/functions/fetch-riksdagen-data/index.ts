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

interface LedamotData {
  intressent_id: string;
  fornamn?: string;
  efternamn?: string;
  tilltalsnamn?: string;
  parti?: string;
  valkrets?: string;
  status?: string;
  bild_url?: string;
}

interface AnforandeData {
  anforande_id: string;
  intressent_id?: string;
  dok_id?: string;
  debattnamn?: string;
  debattsekund?: number;
  anftext?: string;
  anfdatum?: string;
  avsnittsrubrik?: string;
  parti?: string;
  talare?: string;
}

interface VoteringData {
  votering_id: string;
  rm?: string;
  beteckning?: string;
  punkt?: number;
  titel?: string;
  votering_datum?: string;
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

    const { dataType, limit = 50, filters = {} } = await req.json();

    console.log(`Hämtar ${dataType} data från Riksdagens API...`);

    let apiUrl = '';
    let tableName = '';

    if (dataType === 'dokument') {
      apiUrl = `https://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&facets=&sort=datum&sortorder=desc&rapport=&utformat=json&a=s&p=1&sz=${limit}`;
      tableName = 'riksdagen_dokument';
    } else if (dataType === 'ledamoter') {
      apiUrl = `https://data.riksdagen.se/personlista/?utformat=json&rdlstatus=samtliga`;
      tableName = 'riksdagen_ledamoter';
    } else if (dataType === 'anforanden') {
      apiUrl = `https://data.riksdagen.se/anforandelist/?utformat=json&sz=${limit}&sort=datum&sortorder=desc`;
      tableName = 'riksdagen_anforanden';
    } else if (dataType === 'voteringar') {
      apiUrl = `https://data.riksdagen.se/voteringlista/?utformat=json&sz=${limit}&sort=datum&sortorder=desc`;
      tableName = 'riksdagen_voteringar';
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
    } else if (dataType === 'ledamoter' && data.personlista?.person) {
      const personer = Array.isArray(data.personlista.person) 
        ? data.personlista.person 
        : [data.personlista.person];

      for (const person of personer) {
        try {
          const ledamotData: LedamotData = {
            intressent_id: person.intressent_id,
            fornamn: person.fornamn,
            efternamn: person.efternamn,
            tilltalsnamn: person.tilltalsnamn,
            parti: person.parti,
            valkrets: person.valkrets,
            status: person.status,
            bild_url: person.bild_url_192 || person.bild_url_80,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(ledamotData, { onConflict: 'intressent_id' });

          if (error) {
            console.error('Fel vid insättning av ledamot:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning av ledamot:', err);
          errors++;
        }
      }
    } else if (dataType === 'anforanden' && data.anforandelist?.anforande) {
      const anforanden = Array.isArray(data.anforandelist.anforande) 
        ? data.anforandelist.anforande 
        : [data.anforandelist.anforande];

      for (const anf of anforanden) {
        try {
          const anforandeData: AnforandeData = {
            anforande_id: anf.anforande_id,
            intressent_id: anf.intressent_id,
            dok_id: anf.dok_id,
            debattnamn: anf.debattnamn,
            debattsekund: anf.debattsekund ? parseInt(anf.debattsekund) : undefined,
            anftext: anf.anforandetext,
            anfdatum: anf.datum,
            avsnittsrubrik: anf.avsnittsrubrik,
            parti: anf.parti,
            talare: anf.talare,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(anforandeData, { onConflict: 'anforande_id' });

          if (error) {
            console.error('Fel vid insättning av anförande:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning av anförande:', err);
          errors++;
        }
      }
    } else if (dataType === 'voteringar' && data.voteringlista?.votering) {
      const voteringar = Array.isArray(data.voteringlista.votering) 
        ? data.voteringlista.votering 
        : [data.voteringlista.votering];

      for (const vot of voteringar) {
        try {
          const voteringData: VoteringData = {
            votering_id: vot.votering_id,
            rm: vot.rm,
            beteckning: vot.beteckning,
            punkt: vot.punkt ? parseInt(vot.punkt) : undefined,
            titel: vot.titel,
            votering_datum: vot.datum,
          };

          const { error } = await supabaseClient
            .from(tableName)
            .upsert(voteringData, { onConflict: 'votering_id' });

          if (error) {
            console.error('Fel vid insättning av votering:', error);
            errors++;
          } else {
            insertedCount++;
          }
        } catch (err) {
          console.error('Fel vid bearbetning av votering:', err);
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
