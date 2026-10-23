import { Resend } from "resend";
import { getTenantContext,jsonError } from "@/lib/api/tenant";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
export const runtime="nodejs";
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}){
 const ctx=await getTenantContext();if("error" in ctx)return jsonError(ctx.error,ctx.status);
 if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)return jsonError("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.",503);
 const {id}=await params;const {data:invoice,error}=await ctx.supabase.from("invoices").select("*,clients(name,email,company),invoice_items(*)").eq("business_id",ctx.businessId).eq("id",id).maybeSingle();
 if(error||!invoice)return jsonError("Invoice not found",404);const to=String(invoice.clients?.email||"").trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))return jsonError("Add a valid email address to this invoice's client first");
 const pdf=await renderInvoicePdf(invoice,ctx.business);const resend=new Resend(process.env.RESEND_API_KEY);
 const {data,error:sendError}=await resend.emails.send({from:process.env.EMAIL_FROM,to:[to],subject:"Invoice "+invoice.invoice_number+" from "+ctx.business.name,text:"Hello "+String(invoice.clients?.name||"")+",\n\nPlease find invoice "+invoice.invoice_number+" attached.\nTotal: "+String(ctx.business.currency||"INR")+" "+Number(invoice.total).toFixed(2)+"\nDue date: "+invoice.due_date+"\n\nThank you,\n"+ctx.business.name,attachments:[{filename:invoice.invoice_number+".pdf",content:Buffer.from(pdf).toString("base64")}]});
 if(sendError){console.error("Invoice email delivery failed",sendError);return jsonError("Email provider could not send this invoice",502);}
 return Response.json({sent:true,email_id:data?.id});
}
