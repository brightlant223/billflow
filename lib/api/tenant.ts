import { createClient } from "@/lib/supabase/server";
export async function getTenantContext() {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (claimsError || !userId) return { error: "Unauthorized", status: 401 as const };
  const { data: membership, error } = await supabase.from("business_members")
    .select("business_id,role,businesses(id,name,email,currency,gstin,invoice_prefix)")
    .eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error || !membership) return { error: "Business workspace not found", status: 403 as const };
  return { supabase, userId, businessId: membership.business_id as string, role: membership.role as string, business: membership.businesses as any };
}
export function jsonError(message: string, status = 400) { return Response.json({ error: message }, { status }); }
