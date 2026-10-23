"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export default function LoginPage() {
 const router=useRouter(); const [mode,setMode]=useState<"login"|"signup">("login");
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [business,setBusiness]=useState("");
 const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");try{
  const supabase=createClient();
  if(mode==="signup"){
   const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{business_name:business.trim()||undefined},emailRedirectTo:window.location.origin+"/auth/callback"}});
   if(error)throw error;
   if(!data.session){setMessage("Account created. Check your email to confirm your address, then sign in.");return;}
  }else{const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;}
  router.replace("/");router.refresh();
 }catch(err){setMessage(err instanceof Error?err.message:"Authentication failed.");}finally{setBusy(false);}}
 return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#100e0d",color:"#f7f2ee"}}>
 <section style={{width:"min(100%,430px)",padding:36,border:"1px solid #38302a",borderRadius:22,background:"#191614"}}>
 <div style={{fontSize:22,fontWeight:800}}>🟠 Billflow <small style={{display:"block",fontSize:12,color:"#a69a91",fontWeight:500}}>by BrightLant</small></div>
 <p style={{marginTop:34,color:"#ffad77",fontSize:11,letterSpacing:2,fontWeight:800}}>YOUR BUSINESS, IN CONTROL</p>
 <h1 style={{fontSize:30,margin:"8px 0"}}>{mode==="login"?"Welcome back":"Create your workspace"}</h1>
 <p style={{color:"#a69a91",fontSize:14,lineHeight:1.6}}>{mode==="login"?"Sign in to manage invoices and clients.":"Create an account and get a private business workspace."}</p>
 <form onSubmit={submit} style={{display:"grid",gap:15,marginTop:22}}>
 {mode==="signup"&&<label style={{display:"grid",gap:7,fontSize:13}}>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} placeholder="Your company" style={field}/></label>}
 <label style={{display:"grid",gap:7,fontSize:13}}>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" style={field}/></label>
 <label style={{display:"grid",gap:7,fontSize:13}}>Password<input type="password" required minLength={8} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" style={field}/></label>
 {message&&<p role="status" style={{fontSize:13,color:"#ffc29a"}}>{message}</p>}
 <button disabled={busy} style={{minHeight:47,border:0,borderRadius:10,background:"#ff9148",fontWeight:800,cursor:"pointer"}}>{busy?"Please wait…":mode==="login"?"Sign in":"Create account"}</button>
 </form>
 <p style={{textAlign:"center",fontSize:13,color:"#a69a91",marginTop:22}}>{mode==="login"?"New to Billflow?":"Already have an account?"} <button onClick={()=>{setMode(mode==="login"?"signup":"login");setMessage("");}} style={{background:"none",border:0,color:"#ffad77",fontWeight:800,cursor:"pointer"}}>{mode==="login"?"Create an account":"Sign in"}</button></p>
 </section></main>;
}
const field={width:"100%",boxSizing:"border-box" as const,minHeight:45,padding:"0 12px",border:"1px solid #40362e",borderRadius:9,background:"#100e0d",color:"#f7f2ee",fontSize:14};
