import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const chargilySecret = Deno.env.get("CHARGILY_SECRET_KEY") ?? ""

    if (!chargilySecret) {
      throw new Error("CHARGILY_SECRET_KEY is not configured")
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const jwt = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { amount, purchaseId, itemName, successUrl, failureUrl } = await req.json()

    if (!amount || !purchaseId || !itemName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const response = await fetch("https://pay.chargily.net/api/v2/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${chargilySecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        currency: "dzd",
        success_url: successUrl || `${req.headers.get("origin")}/purchase/success?purchase_id=${purchaseId}`,
        failure_url: failureUrl || `${req.headers.get("origin")}/purchase/failed?purchase_id=${purchaseId}`,
        payment_method: "edahabia",
        description: itemName,
        metadata: { purchase_id: purchaseId },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Chargily API error:", errorData)
      throw new Error("Payment gateway error")
    }

    const checkout = await response.json()

    return new Response(JSON.stringify({
      checkout_url: checkout.checkout_url,
      checkout_id: checkout.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
