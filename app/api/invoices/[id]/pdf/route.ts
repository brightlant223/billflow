import { getTenantContext,jsonError } from "@/lib/api/tenant";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const ctx=await getTenantContext();if("error" in ctx)return jsonError(ctx.error,ctx.status);const {id}=await params;
 const {data,error}=await ctx.supabase.from("invoices").select("*,clients(name,email,company,phone),invoice_items(*)").eq("business_id",ctx.businessId).eq("id",id).maybeSingle();
 if(error||!data)return jsonError("Invoice not found",404);
 const bytes=await renderInvoicePdf(data,ctx.business);
 return new Response(bytes as BodyInit,{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=\""+String(data.invoice_number).replace(/[^a-zA-Z0-9_-]/g,"_")+".pdf\"","Cache-Control":"private, no-store"}});
}
