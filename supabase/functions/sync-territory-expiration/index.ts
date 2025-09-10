// This function synchronizes the is_expired status for all territories based on their expiration dates
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://otqllxpscbiugpfhbbbt.supabase.co';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseKey) {
    return new Response(JSON.stringify({ error: "Service role key is required" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Starting territory expiration synchronization...");

    const now = new Date().toISOString();

    // Update all territories that should be marked as expired
    const { data: expiredUpdates, error: expiredError } = await supabase
      .from('public_territory_access')
      .update({ is_expired: true })
      .lt('expires_at', now)
      .eq('is_expired', false);

    if (expiredError) {
      throw expiredError;
    }

    // Update all territories that should be marked as not expired
    const { data: activeUpdates, error: activeError } = await supabase
      .from('public_territory_access')
      .update({ is_expired: false })
      .gte('expires_at', now)
      .eq('is_expired', true);

    if (activeError) {
      throw activeError;
    }

    console.log("Territory expiration synchronization completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Territory expiration synchronization completed successfully"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in territory expiration sync:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});