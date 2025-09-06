import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    const requiredFields = ['short_id', 'shop_id', 'parts_and_prices', 'total_price'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 1. Find the shop id, name, and whatsapp using the provided shop_id
    const { data: shopData, error: shopError } = await supabaseAdmin
      .from('autopecas')
      .select('id, nome, whatsapp')
      .eq('id', body.shop_id)
      .single()

    if (shopError || !shopData) {
      throw new Error(`Shop with ID ${body.shop_id} not found.`);
    }
    const { id: shopId, nome: shopName, whatsapp: shopWhatsapp } = shopData;

    // 2. Find the original request to get its ID and list of selected shops
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('budget_requests')
      .select('id, selected_shops_ids')
      .eq('short_id', body.short_id)
      .single()

    if (requestError || !requestData) {
        throw new Error(`Request with short_id ${body.short_id} not found.`);
    }
    const requestId = requestData.id;
    const selectedShopsIds = requestData.selected_shops_ids || [];

    // 3. Insert the new budget response
    const { data: responseInsertData, error: responseInsertError } = await supabaseAdmin
      .from('budget_responses')
      .insert([
        {
          request_id: requestId,
          shop_id: shopId,
          shop_name: shopName,
          shop_whatsapp: shopWhatsapp,
          parts_and_prices: body.parts_and_prices,
          total_price: body.total_price,
          notes: body.notes,
        },
      ])
      .select()
      .single()

    if (responseInsertError) {
      throw responseInsertError
    }

    // 4. Check if all shops have responded
    const { count: responseCount, error: countError } = await supabaseAdmin
      .from('budget_responses')
      .select('*', { count: 'exact', head: true })
      .eq('request_id', requestId)

    if (countError) {
      throw countError;
    }

    let newStatus = 'answered';
    if (responseCount >= selectedShopsIds.length) {
      newStatus = 'completed';
    }

    // 5. Update the status of the original request
    const { error: updateRequestError } = await supabaseAdmin
      .from('budget_requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (updateRequestError) {
      throw updateRequestError;
    }

    return new Response(JSON.stringify({ success: true, data: responseInsertData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in submit-budget-response function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})