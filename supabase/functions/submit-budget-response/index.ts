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

    // Validate required fields, now using short_id
    const requiredFields = ['short_id', 'shop_name', 'shop_whatsapp', 'car_model', 'car_year', 'parts_and_prices', 'total_price'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 1. Find the original request using the short_id
    const { data: requestData, error: requestError } = await supabaseAdmin
      .from('budget_requests')
      .select('id')
      .eq('short_id', body.short_id)
      .single()

    if (requestError) throw new Error(`Request with short_id ${body.short_id} not found.`);
    const requestId = requestData.id;

    // 2. Insert the new budget response with the correct UUID request_id
    const { data, error } = await supabaseAdmin
      .from('budget_responses')
      .insert([
        {
          request_id: requestId,
          shop_name: body.shop_name,
          shop_whatsapp: body.shop_whatsapp,
          car_model: body.car_model,
          car_year: body.car_year,
          parts_and_prices: body.parts_and_prices,
          total_price: body.total_price,
          notes: body.notes,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    // 3. Optionally, update the status of the original request
    await supabaseAdmin
      .from('budget_requests')
      .update({ status: 'answered' })
      .eq('id', requestId)

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})