import { supabase } from "./supabase";

const CHARGILY_API_BASE = "https://pay.chargily.net/api/v2";

interface CreateCheckoutParams {
  amount: number;
  purchaseId: string;
  itemName: string;
  successUrl?: string;
  failureUrl?: string;
}

interface CheckoutResponse {
  checkout_url: string;
  checkout_id: string;
}

export async function createCheckout({
  amount,
  purchaseId,
  itemName,
  successUrl,
  failureUrl,
}: CreateCheckoutParams): Promise<CheckoutResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await supabase.functions.invoke("create-checkout", {
    body: {
      amount,
      purchaseId,
      itemName,
      successUrl,
      failureUrl,
    },
  });

  if (response.error) {
    throw new Error(response.error.message || "Failed to create checkout");
  }

  return response.data;
}

export async function createCoursePurchase({
  courseId,
  teacherId,
  amount,
}: {
  courseId: string;
  teacherId: string;
  amount: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const platformFee = Math.round(amount * 0.1);
  const teacherEarnings = amount - platformFee;

  // Create purchase record
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      student_id: user.id,
      course_id: courseId,
      teacher_id: teacherId,
      amount,
      platform_fee: platformFee,
      teacher_earnings: teacherEarnings,
      status: "pending",
    })
    .select()
    .single();

  if (purchaseError) {
    throw purchaseError;
  }

  return purchase;
}

export async function createSessionPurchase({
  sessionSlotId,
  teacherId,
  amount,
}: {
  sessionSlotId: string;
  teacherId: string;
  amount: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const platformFee = Math.round(amount * 0.1);
  const teacherEarnings = amount - platformFee;

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      student_id: user.id,
      session_slot_id: sessionSlotId,
      teacher_id: teacherId,
      amount,
      platform_fee: platformFee,
      teacher_earnings: teacherEarnings,
      status: "pending",
    })
    .select()
    .single();

  if (purchaseError) {
    throw purchaseError;
  }

  return purchase;
}
