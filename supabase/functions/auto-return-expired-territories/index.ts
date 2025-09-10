
// This function automatically returns territories that have been expired for more than 5 days
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
    console.log("Starting auto-return of expired territories...");

    // Calculate date 5 days ago
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const fiveDaysAgoISO = fiveDaysAgo.toISOString();

    // Find all assigned territories that expired more than 5 days ago
    const { data: expiredTerritories, error: fetchError } = await supabase
      .from('assigned_territories')
      .select('id, territory_id, publisher_id')
      .eq('status', 'assigned')
      .is('returned_at', null)
      .lt('expires_at', fiveDaysAgoISO);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${expiredTerritories?.length || 0} territories to auto-return`);

    if (!expiredTerritories?.length) {
      return new Response(JSON.stringify({ message: "No territories to auto-return" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update each expired territory
    const now = new Date().toISOString();
    const updates = expiredTerritories.map(territory => ({
      id: territory.id,
      status: 'returned',
      returned_at: now
    }));

    const { error: updateError } = await supabase
      .from('assigned_territories')
      .upsert(updates);

    if (updateError) {
      throw updateError;
    }

    console.log(`Successfully auto-returned ${expiredTerritories.length} territories`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully auto-returned ${expiredTerritories.length} territories` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in auto-return function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
