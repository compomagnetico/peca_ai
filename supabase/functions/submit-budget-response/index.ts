import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()

    // Basic validation for required fields
    const requiredFields = ['shop_name', 'shop_whatsapp', 'car_model', 'car_year', 'parts_and_prices', 'total_price'];
    for (const field of requiredFields) {
      if (!(field in body)) {
        return new Response(JSON.stringify({ error: `Missing required field: ${field}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Insert the new budget response into the database
    const { data, error } = await supabaseAdmin
      .from('budget_responses')
      .insert([
        {
          shop_name: body.shop_name,
          shop_whatsapp: body.shop_whatsapp,
          car_model: body.car_model,
          car_year: body.car_year,
          parts_and_prices: body.parts_and_prices,
          total_price: body.total_price,
          notes: body.notes, // Optional field
        },
      ])
      .select()

    if (error) {
      throw error
    }

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