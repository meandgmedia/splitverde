import type {APIRoute} from 'astro';
import {emailValid,envFor,hmac,isSameOrigin,messagePage,redirect} from '../../../lib/auth';
export const POST:APIRoute=async(ctx)=>{
 if(!isSameOrigin(ctx))return messagePage('Invalid request','Please submit the sign-in form from this website.',403);
 const env=envFor(ctx);if(!env.RESEND_API_KEY||!env.EMAIL_FROM||!env.AUTH_SECRET)return messagePage('Email sign-in not configured','The administrator must configure email delivery and authentication secrets.',503);
 const form=await ctx.request.formData();const email=String(form.get('email')||'').trim().toLowerCase();
 if(!emailValid(email))return messagePage('Invalid email','Enter a valid email address.');
 const now=Date.now();const existing=await env.DB.prepare('SELECT next_request_at FROM email_login_codes WHERE email=?').bind(email).first() as {next_request_at:number}|null;
 if(existing&&existing.next_request_at>now)return redirect('/verify');
 const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1_000_000).padStart(6,'0');
 const digest=await hmac(env.AUTH_SECRET,email+':'+code);
 await env.DB.prepare('INSERT INTO email_login_codes(email,code_hash,expires_at,next_request_at,attempts) VALUES (?,?,?,?,0) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,next_request_at=excluded.next_request_at,attempts=0').bind(email,digest,now+600_000,now+60_000).run();
 const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[email],subject:'Your SplitVerde sign-in code',text:'Your SplitVerde verification code is '+code+'. It expires in 10 minutes. If you did not request it, ignore this email.'})});
 if(!res.ok){await env.DB.prepare('DELETE FROM email_login_codes WHERE email=? AND code_hash=?').bind(email,digest).run();return messagePage('Email delivery unavailable','We could not send your code. Please try again later.',502);}
 return redirect('/verify');
};
