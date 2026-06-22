import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { createHmac } from "https://deno.land/std@0.168.0/hash/sha256.ts"

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
    const webhookSecret = Deno.env.get("CHARGILY_WEBHOOK_SECRET") ?? ""

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.text()
    const signature = req.headers.get("X-Signature") ?? ""

    if (webhookSecret) {
      const hmac = createHmac("sha256", webhookSecret)
      hmac.update(body)
      const expectedSignature = hmac.hex()

      if (signature !== expectedSignature) {
        console.error("Invalid webhook signature")
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }
    }

    const event = JSON.parse(body)

    if (event.status === "paid") {
      const purchaseId = event.metadata?.purchase_id

      if (!purchaseId) {
        console.error("No purchase_id in metadata")
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Update purchase status
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          chargily_checkout_id: event.id,
        })
        .eq("id", purchaseId)
        .select()
        .single()

      if (purchaseError) {
        console.error("Error updating purchase:", purchaseError)
        throw purchaseError
      }

      // Create enrollment if it's a course purchase
      if (purchase.course_id) {
        const { error: enrollmentError } = await supabase
          .from("enrollments")
          .insert({
            student_id: purchase.student_id,
            course_id: purchase.course_id,
            purchase_id: purchase.id,
          })

        if (enrollmentError) {
          console.error("Error creating enrollment:", enrollmentError)
        }
      }

      // Create teacher earnings record
      const { error: earningsError } = await supabase
        .from("teacher_earnings")
        .insert({
          teacher_id: purchase.teacher_id,
          purchase_id: purchase.id,
          amount: purchase.teacher_earnings,
          status: "pending",
        })

      if (earningsError) {
        console.error("Error creating earnings:", earningsError)
      }

      // Send notification to student
      const itemName = purchase.course_id ? "الدورة" : "الحصة"
      await supabase
        .from("notifications")
        .insert({
          user_id: purchase.student_id,
          type: "payment_success",
          title: "تم الدفع بنجاح!",
          body: `تم الدفع بنجاح! يمكنك الآن الوصول إلى ${itemName}.`,
          data: { purchase_id: purchase.id, course_id: purchase.course_id },
        })

      // Send notification to teacher
      await supabase
        .from("notifications")
        .insert({
          user_id: purchase.teacher_id,
          type: "new_sale",
          title: "طالب جديد اشترك!",
          body: `طالب جديد اشترك في ${itemName}.`,
          data: { purchase_id: purchase.id, student_id: purchase.student_id },
        })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
