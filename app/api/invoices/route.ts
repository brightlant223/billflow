import { getTenantContext, jsonError } from "@/lib/api/tenant";
type InputItem={description?:unknown;quantity?:unknown;unit_price?:unknown;tax_rate?:unknown};
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export async function GET(){const ctx=await getTenantContext();if("error" in ctx)return jsonError(ctx.error,ctx.status);const {data,error}=await ctx.supabase.from("invoices").select("id,invoice_number,client_id,issue_date,due_date,status,notes,subtotal,tax_total,total,created_at,clients(name,email,company),invoice_items(id,description,quantity,unit_price,tax_rate,line_subtotal,line_tax,line_total)").eq("business_id",ctx.businessId).order("created_at",{ascending:false});if(error)return jsonError("Could not load invoices",500);return Response.json({invoices:data});}
export async function POST(request:Request){const ctx=await getTenantContext();if("error" in ctx)return jsonError(ctx.error,ctx.status);let b:any;try{b=await request.json();}catch{return jsonError("Invalid JSON");}
 if(typeof b.client_id!=="string"||!Array.isArray(b.items)||b.items.length<1||b.items.length>100)return jsonError("A client and 1–100 line items are required");
 const issue=typeof b.issue_date==="string"?b.issue_date:new Date().toISOString().slice(0,10);const due=typeof b.due_date==="string"?b.due_date:"";
 if(!/^\d{4}-\d{2}-\d{2}$/.test(issue)||!/^\d{4}-\d{2}-\d{2}$/.test(due))return jsonError("Valid issue_date and due_date are required");
 const status=["draft","pending","paid","overdue"].includes(String(b.status))?String(b.status):"pending";
 const items=(b.items as InputItem[]).map(i=>({description:typeof i.description==="string"?i.description.trim().slice(0,300):"",quantity:Number(i.quantity),unit_price:Number(i.unit_price),tax_rate:Number(i.tax_rate??0)}));
 if(items.some(i=>!i.description||!Number.isFinite(i.quantity)||i.quantity<=0||!Number.isFinite(i.unit_price)||i.unit_price<0||!Number.isFinite(i.tax_rate)||i.tax_rate<0||i.tax_rate>100))return jsonError("Each item needs a description, positive quantity, non-negative price and tax between 0–100");
 const {data:client}=await ctx.supabase.from("clients").select("id").eq("id",b.client_id).eq("business_id",ctx.businessId).maybeSingle();if(!client)return jsonError("Client not found in this workspace",404);
 const subtotal=round(items.reduce((s,i)=>s+i.quantity*i.unit_price,0));const tax=round(items.reduce((s,i)=>s+i.quantity*i.unit_price*i.tax_rate/100,0));const total=round(subtotal+tax);
 const {data:recent,error:listError}=await ctx.supabase.from("invoices").select("invoice_number").eq("business_id",ctx.businessId).order("created_at",{ascending:false}).limit(500);if(listError)return jsonError("Could not allocate invoice number",500);
 const prefix=String(ctx.business?.invoice_prefix||"INV");const year=issue.slice(0,4);const used=(recent??[]).filter((i:any)=>i.invoice_number.startsWith(prefix+"-"+year+"-")).map((i:any)=>Number(i.invoice_number.split("-").at(-1))).filter(Number.isSafeInteger);
 const invoiceNumber=prefix+"-"+year+"-"+String(Math.max(1000,...used)+1).padStart(4,"0");
 const {data:invoice,error}=await ctx.supabase.from("invoices").insert({business_id:ctx.businessId,client_id:b.client_id,invoice_number:invoiceNumber,issue_date:issue,due_date:due,status,notes:typeof b.notes==="string"?b.notes.trim().slice(0,3000):"",subtotal,tax_total:tax,total,created_by:ctx.userId}).select("id,invoice_number,client_id,issue_date,due_date,status,notes,subtotal,tax_total,total").single();
 if(error||!invoice)return jsonError("Could not create invoice",400);
 const rows=items.map(i=>{const st=round(i.quantity*i.unit_price);const tx=round(st*i.tax_rate/100);return {business_id:ctx.businessId,invoice_id:invoice.id,description:i.description,quantity:i.quantity,unit_price:i.unit_price,tax_rate:i.tax_rate,line_subtotal:st,line_tax:tx,line_total:round(st+tx)};});
 const {error:itemError}=await ctx.supabase.from("invoice_items").insert(rows);if(itemError){await ctx.supabase.from("invoices").delete().eq("id",invoice.id).eq("business_id",ctx.businessId);return jsonError("Could not save invoice lines; invoice rolled back",400);}
 return Response.json({invoice:{...invoice,items:rows}},{status:201});
}
