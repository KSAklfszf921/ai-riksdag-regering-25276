import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Fixa relativa URLs från regeringen.se
    let fullUrl = fileUrl;
    if (fileUrl.startsWith('/')) {
      fullUrl = `https://www.regeringen.se${fileUrl}`;
    }
    
    await supabaseClient
      .from('file_download_queue')
      .insert({
        file_url: fullUrl,
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
    .eq('source', 'regeringskansliet')
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
      source: 'regeringskansliet',
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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role (using service role to bypass RLS)
    const { data: adminRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    const requestBody = await req.json();
    if (!requestBody || typeof requestBody.dataType !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request: dataType required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawDataType = requestBody.dataType.trim();
    if (rawDataType.length === 0 || rawDataType.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid dataType length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalisera dataType - konvertera understreck till bindestreck för konsistens
    const dataType = rawDataType.replace(/_/g, "-");
    console.log(`Hämtar ${dataType} data från g0v.se API... (original: ${rawDataType})`);

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
      const availableTypes = Object.keys(endpointMap).join(', ');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Okänd datatyp: "${dataType}". Tillgängliga: ${availableTypes}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const apiUrl = endpoint.url;
    const tableName = endpoint.table;

    console.log(`Anropar: ${apiUrl}`);
    
    await updateProgress(supabaseClient, dataType, {
      current_page: 1,
      total_pages: 1,
      items_fetched: 0,
      status: 'in_progress'
    });

    // Hämta data från g0v.se API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`g0v.se API svarade med status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data hämtad från g0v.se API');

    let insertedCount = 0;
    let errors = 0;
    let totalItems = 0;

    if (dataType === 'pressmeddelanden' && Array.isArray(data)) {
      const items = data;
      totalItems = items.length;
      
      await updateProgress(supabaseClient, dataType, { total_items: totalItems });
      
      for (const item of items) {
        // Kontrollera stoppsignal
        if (await shouldStop(supabaseClient, dataType)) {
          console.log('Stoppsignal mottagen, avbryter hämtning');
          await updateProgress(supabaseClient, dataType, {
            status: 'stopped',
            error_message: 'Manuellt stoppad av användare'
          });
          break;
        }
        
        try {
          const pressData: any = {
            document_id: item.id || item.url,
            titel: item.title,
            publicerad_datum: item.published,
            departement: item.sender,
            url: item.url,
            innehall: item.summary || item.description,
          };

          // Lägg till bilagor i nedladdningskö istället för direkt nedladdning
          const { data: insertedPress, error: insertError } = await supabaseClient
            .from(tableName)
            .upsert(pressData, { onConflict: 'document_id' })
            .select('id')
            .single();

          if (insertedPress && item.attachments && Array.isArray(item.attachments)) {
            for (const attachment of item.attachments) {
              // Fixa relativa URLs
              let attachmentUrl = attachment.url;
              if (attachmentUrl.startsWith('/')) {
                attachmentUrl = `https://www.regeringen.se${attachmentUrl}`;
              }
              
              const fileName = attachmentUrl.split('/').pop() || `bilaga_${Date.now()}.pdf`;
              const filePath = `pressmeddelanden/${item.id || Date.now()}/${fileName}`;
              await enqueueFileDownload(
                supabaseClient,
                attachmentUrl,
                'regeringskansliet-files',
                filePath,
                tableName,
                insertedPress.id,
                'local_bilagor'
              );
            }
          }

          if (insertError) {
            console.error('Fel vid insättning:', insertError);
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
      totalItems = items.length;
      
      await updateProgress(supabaseClient, dataType, { total_items: totalItems });
      
      for (const item of items) {
        // Kontrollera stoppsignal
        if (await shouldStop(supabaseClient, dataType)) {
          console.log('Stoppsignal mottagen, avbryter hämtning');
          await updateProgress(supabaseClient, dataType, {
            status: 'stopped',
            error_message: 'Manuellt stoppad av användare'
          });
          break;
        }
        
        try {
          const propData: any = {
            document_id: item.id || item.url,
            titel: item.title,
            publicerad_datum: item.published,
            beteckningsnummer: item.identifier,
            departement: item.sender,
            url: item.url,
            pdf_url: item.attachments?.[0]?.url,
          };

          // Lägg till PDF i nedladdningskö istället för direkt nedladdning
          const { data: insertedProp, error: insertError } = await supabaseClient
            .from(tableName)
            .upsert(propData, { onConflict: 'document_id' })
            .select('id')
            .single();

          if (insertedProp && propData.pdf_url) {
            // Fixa relativa URLs
            let pdfUrl = propData.pdf_url;
            if (pdfUrl.startsWith('/')) {
              pdfUrl = `https://www.regeringen.se${pdfUrl}`;
            }
            
            const fileName = `${item.identifier || item.id || Date.now()}.pdf`;
            const filePath = `propositioner/${fileName}`;
            await enqueueFileDownload(
              supabaseClient,
              pdfUrl,
              'regeringskansliet-files',
              filePath,
              tableName,
              insertedProp.id,
              'local_pdf_url'
            );
          }

          if (insertError) {
            console.error('Fel vid insättning:', insertError);
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
      const entries = Object.entries(data);
      totalItems = entries.length;
      
      await updateProgress(supabaseClient, dataType, { total_items: totalItems });
      
      for (const [kod, namn] of entries) {
        // Kontrollera stoppsignal
        if (await shouldStop(supabaseClient, dataType)) {
          console.log('Stoppsignal mottagen, avbryter hämtning');
          await updateProgress(supabaseClient, dataType, {
            status: 'stopped',
            error_message: 'Manuellt stoppad av användare'
          });
          break;
        }
        
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
    } else if (Array.isArray(data)) {
      // Hantera alla andra dokumenttyper med standardformat
      const items = data;
      totalItems = items.length;
      
      await updateProgress(supabaseClient, dataType, { total_items: totalItems });
      
      for (const item of items) {
        // Kontrollera stoppsignal
        if (await shouldStop(supabaseClient, dataType)) {
          console.log('Stoppsignal mottagen, avbryter hämtning');
          await updateProgress(supabaseClient, dataType, {
            status: 'stopped',
            error_message: 'Manuellt stoppad av användare'
          });
          break;
        }
        
        try {
          const docData: any = {
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

          // Lägg till bilagor i nedladdningskö istället för direkt nedladdning
          const { data: insertedDoc, error: insertError } = await supabaseClient
            .from(tableName)
            .upsert(docData, { onConflict: 'document_id' })
            .select('id')
            .single();

          if (insertedDoc && item.attachments && Array.isArray(item.attachments)) {
            for (const attachment of item.attachments) {
              // Fixa relativa URLs
              let attachmentUrl = attachment.url;
              if (attachmentUrl.startsWith('/')) {
                attachmentUrl = `https://www.regeringen.se${attachmentUrl}`;
              }
              
              const fileName = attachmentUrl.split('/').pop() || `file_${Date.now()}`;
              const filePath = `${dataType}/${item.id || Date.now()}/${fileName}`;
              await enqueueFileDownload(
                supabaseClient,
                attachmentUrl,
                'regeringskansliet-files',
                filePath,
                tableName,
                insertedDoc.id,
                'local_files'
              );
            }
          }

          if (insertError) {
            console.error('Fel vid insättning:', insertError);
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

    // Uppdatera progress till completed
    await updateProgress(supabaseClient, dataType, {
      items_fetched: insertedCount,
      status: 'completed'
    });

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
    // Log detailed error for debugging
    console.error('Edge function error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    const requestId = crypto.randomUUID();
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'An error occurred processing your request',
        requestId: requestId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
