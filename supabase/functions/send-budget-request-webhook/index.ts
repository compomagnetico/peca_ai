import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()

    // Log the payload for debugging purposes in Supabase logs
    console.log("Received payload for webhook:", JSON.stringify(payload, null, 2));

    // Make the actual call to the external webhook
    const response = await fetch("https://webhook.usoteste.shop/webhook/teste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External webhook failed:", response.status, errorText);
      // We still return a success to the client, as the Edge Function successfully received the request.
      // The client doesn't need to know about the external webhook's failure immediately.
      // Errors will be logged in Supabase.
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Webhook call initiated, but external service returned an error.",
        external_status: response.status,
        external_response: errorText
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Still 200 for the client, as the Edge Function processed it.
      });
    }

    console.log("External webhook called successfully.");

    return new Response(JSON.stringify({ success: true, message: "Webhook call initiated successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in send-budget-request-webhook Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})