import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
export async function renderInvoicePdf(invoice:any,business:any){
 const pdf=await PDFDocument.create();const page=pdf.addPage([595.28,841.89]);const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const ink=rgb(.12,.10,.09),muted=rgb(.42,.38,.35),accent=rgb(.96,.43,.18);
 const draw=(value:string,x:number,y:number,size=10,font=regular,color=ink)=>page.drawText(value.replace(/[^\x20-\x7E]/g,"?").slice(0,100),{x,y,size,font,color});
 const money=(n:number)=>String(business.currency||"INR")+" "+Number(n).toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
 draw(String(business.name||"Business"),44,790,22,bold);draw("INVOICE",425,790,18,bold,accent);draw(String(invoice.invoice_number),425,768,10,regular,muted);
 if(business.email)draw(String(business.email),44,765,10,regular,muted);if(business.gstin)draw("GSTIN: "+String(business.gstin),44,748,10,regular,muted);
 draw("BILL TO",44,705,9,bold,muted);draw(String(invoice.clients?.name||"Client"),44,685,13,bold);draw(String(invoice.clients?.company||""),44,668,10,regular,muted);draw(String(invoice.clients?.email||""),44,652,10,regular,muted);
 draw("Issue date: "+invoice.issue_date+"     Due date: "+invoice.due_date,44,615,10,regular,muted);page.drawLine({start:{x:44,y:590},end:{x:551,y:590},thickness:1,color:accent});
 draw("DESCRIPTION",44,570,9,bold,muted);draw("QTY",330,570,9,bold,muted);draw("UNIT PRICE",385,570,9,bold,muted);draw("TOTAL",490,570,9,bold,muted);
 let y=545;for(const item of (invoice.invoice_items||[]).slice(0,22)){draw(String(item.description),44,y,9);draw(String(item.quantity),330,y,9);draw(money(Number(item.unit_price)),385,y,9);draw(money(Number(item.line_total)),490,y,9);y-=24;}
 page.drawLine({start:{x:350,y:y-5},end:{x:551,y:y-5},thickness:.6,color:muted});draw("Subtotal: "+money(Number(invoice.subtotal)),390,y-28,10);draw("Tax: "+money(Number(invoice.tax_total)),390,y-47,10);draw("TOTAL: "+money(Number(invoice.total)),390,y-73,14,bold,accent);
 if(invoice.notes){draw("NOTES",44,Math.max(70,y-35),9,bold,muted);draw(String(invoice.notes),44,Math.max(52,y-54),9);}draw("Thank you for your business.",44,35,9,regular,muted);
 return pdf.save();
}
