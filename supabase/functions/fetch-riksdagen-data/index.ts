import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

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
  local_pdf_url?: string;
  local_html_url?: string;
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
  local_bild_url?: string;
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

// Lägg till fil i nedladdningskö istället för att ladda ner direkt
async function enqueueFileDownload(
  supabaseClient: any,
  fileUrl: string,
  bucket: string,
  path: string,
  tableName: string,
  recordId: string,
  columnName: string
) {
  try {
    await supabaseClient
      .from('file_download_queue')
      .insert({
        file_url: fileUrl,
        bucket,
        storage_path: path,
        table_name: tableName,
        record_id: recordId,
        column_name: columnName,
        status: 'pending'
      });
    console.log(`Fil tillagd i kö: ${path}`);
  } catch (err) {
    console.error('Fel vid tillägg i filkö:', err);
  }
}

// Kontrollera om hämtning ska stoppas
async function shouldStop(supabaseClient: any, dataType: string): Promise<boolean> {
  const { data } = await supabaseClient
    .from('data_fetch_control')
    .select('should_stop')
    .eq('source', 'riksdagen')
    .eq('data_type', dataType)
    .maybeSingle();
  
  return data?.should_stop === true;
}

// Uppdatera progress
async function updateProgress(
  supabaseClient: any,
  dataType: string,
  updates: any
) {
  await supabaseClient
    .from('data_fetch_progress')
    .upsert({
      source: 'riksdagen',
      data_type: dataType,
      ...updates,
      last_fetched_at: new Date().toISOString()
    }, { onConflict: 'source,data_type' });
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

    const { dataType, paginate = true, maxPages = null } = await req.json();

    console.log(`Hämtar ${dataType} data från Riksdagens API (paginering: ${paginate})...`);

    let apiUrl = '';
    let tableName = '';

    if (dataType === 'dokument') {
      apiUrl = `https://data.riksdagen.se/dokumentlista/?sok=&doktyp=&rm=&ts=&bet=&tempbet=&nr=&org=&iid=&webbtv=&talare=&exakt=&planering=&facets=&sort=datum&sortorder=desc&rapport=&utformat=json&a=s&p=1&sz=200`;
      tableName = 'riksdagen_dokument';
    } else if (dataType === 'ledamoter') {
      apiUrl = `https://data.riksdagen.se/personlista/?utformat=json&rdlstatus=samtliga`;
      tableName = 'riksdagen_ledamoter';
    } else if (dataType === 'anforanden') {
      apiUrl = `https://data.riksdagen.se/anforande/?utformat=json&sz=200&sort=c_datum&sortorder=desc&p=1`;
      tableName = 'riksdagen_anforanden';
    } else if (dataType === 'voteringar') {
      apiUrl = `https://data.riksdagen.se/voteringlista/?utformat=json&sz=200&sort=datum&sortorder=desc&p=1`;
      tableName = 'riksdagen_voteringar';
    } else {
      return new Response(
        JSON.stringify({ success: false, message: 'Okänd datatyp' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    let totalInserted = 0;
    let totalErrors = 0;
    let currentPage = 1;
    let nextPageUrl: string | null = apiUrl;
    let totalPages = 0;
    let totalItems = 0;

    // Hämta alla sidor om paginering är aktiverad
    while (nextPageUrl && (maxPages === null || currentPage <= maxPages)) {
      // Kontrollera stoppsignal
      if (await shouldStop(supabaseClient, dataType)) {
        console.log('Stoppsignal mottagen, avbryter hämtning');
        await updateProgress(supabaseClient, dataType, {
          status: 'stopped',
          error_message: 'Manuellt stoppad av användare'
        });
        break;
      }
      
      console.log(`Hämtar sida ${currentPage}...`);
      
      const response: Response = await fetch(nextPageUrl);
      
      if (!response.ok) {
        throw new Error(`Riksdagens API svarade med status: ${response.status}`);
      }

      // Anföranden - parse XML med deno-dom
      let data: any;
      if (dataType === 'anforanden') {
        const xmlText = await response.text();
        console.log('Anföranden-data mottagen (XML format), parsar...');
        
        try {
          const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
          if (!doc) throw new Error('Kunde inte parsa XML');
          
          const anfElements = doc.querySelectorAll('anforande');
          const anforanden = [];
          
          for (const anf of anfElements) {
            const element = anf as any; // Cast to access querySelector
            anforanden.push({
              anforande_id: element.querySelector('anforande_id')?.textContent || '',
              intressent_id: element.querySelector('intressent_id')?.textContent,
              dokument_id: element.querySelector('dokument_id')?.textContent,
              dok_id: element.querySelector('dok_id')?.textContent,
              debatt: element.querySelector('debatt')?.textContent,
              anforandenummer: element.querySelector('anforandenummer')?.textContent,
              anforandetext: element.querySelector('anforandetext')?.textContent,
              datum: element.querySelector('datum')?.textContent,
              rubrik: element.querySelector('rubrik')?.textContent,
              avsnittsrubrik: element.querySelector('avsnittsrubrik')?.textContent,
              parti: element.querySelector('parti')?.textContent,
              namn: element.querySelector('namn')?.textContent,
              talare: element.querySelector('talare')?.textContent,
            });
          }
          
          // Simulera JSON-struktur
          const sidor = doc.querySelector('anforandelista')?.getAttribute('sidor');
          const traffar = doc.querySelector('anforandelista')?.getAttribute('traffar');
          const nastaSida = doc.querySelector('anforandelista')?.getAttribute('nasta_sida');
          
          data = {
            anforandelista: {
              '@sidor': sidor,
              '@traffar': traffar,
              '@nasta_sida': nastaSida,
              anforande: anforanden
            }
          };
          
          console.log(`Parsade ${anforanden.length} anföranden från XML`);
        } catch (err) {
          console.error('XML-parsing fel:', err);
          data = { anforandelista: { anforande: [] } };
          nextPageUrl = null;
        }
      } else {
        data = await response.json();
      }
      
      // Sätt totalt antal sidor och poster från första sidan
      if (currentPage === 1) {
        if (dataType === 'dokument' && data.dokumentlista) {
          totalPages = parseInt(data.dokumentlista['@sidor'] || '0');
          totalItems = parseInt(data.dokumentlista['@traffar'] || '0');
          console.log(`Totalt: ${totalItems} dokument över ${totalPages} sidor`);
        } else if (dataType === 'anforanden' && data.anforandelista) {
          totalPages = parseInt(data.anforandelista['@sidor'] || '0');
          totalItems = parseInt(data.anforandelista['@traffar'] || '0');
          console.log(`Totalt: ${totalItems} anföranden över ${totalPages} sidor`);
        } else if (dataType === 'voteringar' && data.voteringlista) {
          totalPages = parseInt(data.voteringlista['@sidor'] || '0');
          totalItems = parseInt(data.voteringlista['@traffar'] || '0');
          console.log(`Totalt: ${totalItems} voteringar över ${totalPages} sidor`);
        }
        
        await updateProgress(supabaseClient, dataType, {
          current_page: currentPage,
          total_pages: totalPages,
          total_items: totalItems,
          items_fetched: 0,
          status: 'in_progress'
        });
      }

      let insertedThisPage = 0;
      let errorsThisPage = 0;

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

            // Lägg till PDF i nedladdningskö istället för att ladda ner direkt
            const { data: insertedDoc, error: insertError } = await supabaseClient
              .from(tableName)
              .upsert(dokumentData, { onConflict: 'dok_id' })
              .select('id')
              .single();

            if (insertedDoc && dok.dokument_url_text) {
              const pdfPath = `dokument/${dok.dok_id || dok.id}.pdf`;
              await enqueueFileDownload(
                supabaseClient,
                dok.dokument_url_text,
                'riksdagen-images',
                pdfPath,
                tableName,
                insertedDoc.id,
                'local_pdf_url'
              );
            }

            if (insertError) {
              console.error('Fel vid insättning:', insertError);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av dokument:', err);
            errorsThisPage++;
          }
        }
        
        // Hämta nästa sida
        nextPageUrl = paginate ? data.dokumentlista['@nasta_sida'] : null;
        
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

            // Lägg till bild i nedladdningskö istället för att ladda ner direkt
            const { data: insertedLedamot, error: insertError } = await supabaseClient
              .from(tableName)
              .upsert(ledamotData, { onConflict: 'intressent_id' })
              .select('id')
              .single();

            if (insertedLedamot && ledamotData.bild_url) {
              const bildPath = `ledamoter/${person.intressent_id}.jpg`;
              await enqueueFileDownload(
                supabaseClient,
                ledamotData.bild_url,
                'riksdagen-images',
                bildPath,
                tableName,
                insertedLedamot.id,
                'local_bild_url'
              );
            }

            if (insertError) {
              console.error('Fel vid insättning av ledamot:', insertError);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av ledamot:', err);
            errorsThisPage++;
          }
        }
        
        // Ledamöter har ingen paginering
        nextPageUrl = null;
        
      } else if (dataType === 'anforanden' && data.anforandelista?.anforande) {
        const anforanden = Array.isArray(data.anforandelista.anforande) 
          ? data.anforandelista.anforande 
          : [data.anforandelista.anforande];

        for (const anf of anforanden) {
          try {
            const anforandeData: AnforandeData = {
              anforande_id: anf.anforande_id || anf.dokument_id,
              intressent_id: anf.intressent_id,
              dok_id: anf.dokument_id || anf.dok_id,
              debattnamn: anf.debatt || anf.debattnamn,
              debattsekund: anf.anforandenummer ? parseInt(anf.anforandenummer) : undefined,
              anftext: anf.anforandetext,
              anfdatum: anf.datum,
              avsnittsrubrik: anf.rubrik || anf.avsnittsrubrik,
              parti: anf.parti,
              talare: anf.namn || anf.talare,
            };

            const { error } = await supabaseClient
              .from(tableName)
              .upsert(anforandeData, { onConflict: 'anforande_id' });

            if (error) {
              console.error('Fel vid insättning av anförande:', error);
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av anförande:', err);
            errorsThisPage++;
          }
        }
        
        // Hämta nästa sida
        nextPageUrl = paginate ? data.anforandelista['@nasta_sida'] : null;
        
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
              errorsThisPage++;
            } else {
              insertedThisPage++;
            }
          } catch (err) {
            console.error('Fel vid bearbetning av votering:', err);
            errorsThisPage++;
          }
        }
        
        // Hämta nästa sida
        nextPageUrl = paginate ? data.voteringlista['@nasta_sida'] : null;
      }

      totalInserted += insertedThisPage;
      totalErrors += errorsThisPage;

      console.log(`Sida ${currentPage} klar: ${insertedThisPage} infogade, ${errorsThisPage} fel`);
      
      // Uppdatera progress
      await updateProgress(supabaseClient, dataType, {
        current_page: currentPage,
        items_fetched: totalInserted,
        status: nextPageUrl ? 'in_progress' : 'completed'
      });

      currentPage++;

      // Logga var 10:e sida
      if (currentPage % 10 === 0) {
        console.log(`Progress: ${currentPage}/${totalPages} sidor, ${totalInserted}/${totalItems} poster`);
      }

      // Pausa lite mellan requests för att inte överbelasta API:et
      if (nextPageUrl) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Logga API-anropet
    await supabaseClient.from('riksdagen_api_log').insert({
      endpoint: dataType,
      status: 'success',
      antal_poster: totalInserted,
      felmeddelande: totalErrors > 0 ? `${totalErrors} fel uppstod` : null,
    });

    console.log(`Slutfört! Infogade ${totalInserted} poster över ${currentPage - 1} sidor, ${totalErrors} fel.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: totalInserted,
        errors: totalErrors,
        pages: currentPage - 1,
        message: `Hämtade och sparade ${totalInserted} ${dataType} över ${currentPage - 1} sidor` 
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
