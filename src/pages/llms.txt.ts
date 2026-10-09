import type { APIRoute } from 'astro';
export const GET: APIRoute = () => new Response('# SplitVerde\n\nFuture website: https://splitverde.com\n\nSplitVerde is an insurance commission reconciliation platform under development. Pages and product features are not yet publicly launched.\n', {headers:{'Content-Type':'text/plain'}});
