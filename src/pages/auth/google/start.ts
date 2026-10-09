import type {APIRoute} from 'astro';
import {b64,envFor,randomToken,secureCookie,messagePage} from '../../../lib/auth';
export const GET:APIRoute=async(ctx)=>{
 const env=envFor(ctx);if(!env.GOOGLE_CLIENT_ID||!env.GOOGLE_CLIENT_SECRET)return messagePage('Google sign-in not configured','The administrator must configure Google OAuth credentials.',503);
 const state=randomToken(),verifier=randomToken(48);
 const challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 const options={httpOnly:true,secure:secureCookie(ctx),sameSite:'lax' as const,path:'/auth/google',maxAge:600};
 ctx.cookies.set('sv_oauth_state',state,options);ctx.cookies.set('sv_oauth_verifier',verifier,options);
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 url.searchParams.set('client_id',env.GOOGLE_CLIENT_ID);url.searchParams.set('redirect_uri',ctx.url.origin+'/auth/google/callback');
 url.searchParams.set('response_type','code');url.searchParams.set('scope','openid email profile');url.searchParams.set('state',state);url.searchParams.set('code_challenge',challenge);url.searchParams.set('code_challenge_method','S256');url.searchParams.set('prompt','select_account');
 return new Response(null,{status:302,headers:{Location:url.toString(),'Cache-Control':'no-store'}});
};
