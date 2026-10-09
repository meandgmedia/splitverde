import type { APIContext } from 'astro';
type Context = Pick<APIContext,'locals'|'url'|'cookies'|'request'>;
type DB = {prepare:(sql:string)=>any;batch:(stmts:any[])=>Promise<unknown>};
export type AuthEnv = {DB:DB;GOOGLE_CLIENT_ID?:string;GOOGLE_CLIENT_SECRET?:string;RESEND_API_KEY?:string;EMAIL_FROM?:string;AUTH_SECRET?:string};
export const envFor=(ctx:Context):AuthEnv=>(ctx.locals as any).runtime.env;
export const originFor=(ctx:Context)=>ctx.url.origin;
export const randomToken=(bytes=32)=>{const a=crypto.getRandomValues(new Uint8Array(bytes));return b64(a);};
export const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export const hash=async(s:string)=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))));
export const hmac=async(secret:string,value:string)=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),'HMAC',false,['sign']);return b64(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));};
export const secureCookie=(ctx:Context)=>ctx.url.protocol==='https:';
export const isSameOrigin=(ctx:Context)=>ctx.request.headers.get('origin')===ctx.url.origin;
export const emailValid=(s:string)=>s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const redirect=(path:string)=>new Response(null,{status:303,headers:{Location:path,'Cache-Control':'no-store'}});
export async function getSession(ctx:Context){
 const raw=ctx.cookies.get('sv_session')?.value;if(!raw)return null;
 const db=envFor(ctx).DB;const digest=await hash(raw);
 const row=await db.prepare('SELECT users.id AS user_id, users.email, memberships.agency_id, memberships.role, agencies.name AS agency_name FROM auth_sessions JOIN users ON users.id=auth_sessions.user_id JOIN memberships ON memberships.user_id=users.id JOIN agencies ON agencies.id=memberships.agency_id WHERE token_hash=? AND expires_at>? ORDER BY memberships.rowid LIMIT 1').bind(digest,Date.now()).first() as {user_id:string;email:string;agency_id:string;role:string;agency_name:string}|null;
 return row;
}
export async function establishSession(ctx:Context,userId:string){
 const token=randomToken();const expires=Date.now()+7*24*60*60*1000;
 await envFor(ctx).DB.prepare('INSERT INTO auth_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)').bind(await hash(token),userId,expires,Date.now()).run();
 ctx.cookies.set('sv_session',token,{httpOnly:true,secure:secureCookie(ctx),sameSite:'lax',path:'/',maxAge:7*24*60*60});
}
export async function findOrCreateUser(ctx:Context,email:string){
 const db=envFor(ctx).DB;let user=await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first() as {id:string}|null;
 if(!user){const id=crypto.randomUUID();await db.prepare('INSERT OR IGNORE INTO users(id,email) VALUES (?,?)').bind(id,email).run();user=await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first() as {id:string};}
 const membership=await db.prepare('SELECT agency_id FROM memberships WHERE user_id=? LIMIT 1').bind(user.id).first();
 if(!membership){const agency=crypto.randomUUID();await db.batch([db.prepare('INSERT INTO agencies(id,name) VALUES (?,?)').bind(agency,email.split('@')[0]+' workspace'),db.prepare("INSERT INTO memberships(agency_id,user_id,role) VALUES (?,?,'owner')").bind(agency,user.id)]);}
 return user.id;
}
export function messagePage(title:string,message:string,status=400){return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>'+title+'</title><main style="font:16px system-ui;max-width:34rem;margin:10vh auto;padding:1rem"><h1>'+title+'</h1><p>'+message+'</p><a href="/login">Return to sign in</a></main>',{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
