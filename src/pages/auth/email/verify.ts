import type {APIRoute} from 'astro';
import {emailValid,envFor,establishSession,findOrCreateUser,hmac,isSameOrigin,messagePage,redirect} from '../../../lib/auth';
export const POST:APIRoute=async(ctx)=>{
 if(!isSameOrigin(ctx))return messagePage('Invalid request','Please use the verification form.',403);
 const form=await ctx.request.formData();const email=String(form.get('email')||'').trim().toLowerCase(),code=String(form.get('code')||'').trim();
 if(!emailValid(email)||!/^[0-9]{6}$/.test(code))return messagePage('Invalid code','Please check your email address and six-digit code.');
 const env=envFor(ctx);if(!env.AUTH_SECRET)return messagePage('Not configured','Authentication is not configured.',503);
 const row=await env.DB.prepare('SELECT code_hash,expires_at,attempts FROM email_login_codes WHERE email=?').bind(email).first() as {code_hash:string;expires_at:number;attempts:number}|null;
 if(!row||row.expires_at<Date.now()||row.attempts>=5)return messagePage('Code expired','Request a new verification code.');
 await env.DB.prepare('UPDATE email_login_codes SET attempts=attempts+1 WHERE email=?').bind(email).run();
 if(await hmac(env.AUTH_SECRET,email+':'+code)!==row.code_hash)return messagePage('Incorrect code','Please try again.');
 const consumed=await env.DB.prepare('DELETE FROM email_login_codes WHERE email=? AND code_hash=?').bind(email,row.code_hash).run();
 if(consumed.meta?.changes!==1)return messagePage('Code already used','Request a new code.');
 const userId=await findOrCreateUser(ctx,email);await establishSession(ctx,userId);return redirect('/app');
};
