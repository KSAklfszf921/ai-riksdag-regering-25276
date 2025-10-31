import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function downloadAndStoreFile(supabaseClient: any, fileUrl: string, bucket: string, path: string) {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(path, arrayBuffer, { contentType: response.headers.get('content-type'), upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
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
    );

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

    const { data: queueItems } = await supabaseClient
      .from('file_download_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(50);

    let processed = 0;
    let failed = 0;

    for (const item of queueItems || []) {
      await supabaseClient
        .from('file_download_queue')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', item.id);

      const localUrl = await downloadAndStoreFile(supabaseClient, item.file_url, item.bucket, item.storage_path);

      if (localUrl) {
        await supabaseClient
          .from(item.table_name)
          .update({ [item.column_name]: localUrl })
          .eq('id', item.record_id);

        await supabaseClient
          .from('file_download_queue')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', item.id);
        
        processed++;
      } else {
        const newAttempts = item.attempts + 1;
        const newStatus = newAttempts >= item.max_attempts ? 'failed' : 'pending';
        
        await supabaseClient
          .from('file_download_queue')
          .update({ 
            status: newStatus, 
            attempts: newAttempts,
            error_message: 'Failed to download file'
          })
          .eq('id', item.id);
        
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Log detailed error for debugging
    console.error('Edge function error:', {
      error: error?.message || String(error),
      stack: error?.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return generic error to client
    const requestId = crypto.randomUUID();
    return new Response(
      JSON.stringify({ 
        error: 'An error occurred processing your request',
        requestId: requestId
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});