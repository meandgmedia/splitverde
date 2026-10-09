import type {APIRoute} from 'astro';
import {envFor,hash,isSameOrigin,redirect} from '../../lib/auth';
export const POST:APIRoute=async(ctx)=>{
 if(!isSameOrigin(ctx))return new Response('Forbidden',{status:403});
 const token=ctx.cookies.get('sv_session')?.value;
 if(token)await envFor(ctx).DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await hash(token)).run();
 ctx.cookies.delete('sv_session',{path:'/'});return redirect('/login');
};
