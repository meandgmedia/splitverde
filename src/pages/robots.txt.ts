import type { APIRoute } from 'astro';
export const GET: APIRoute = ({url}) => {
 const prod = import.meta.env.PUBLIC_ENABLE_INDEXING === 'true' && url.hostname === 'splitverde.com';
 return new Response(prod ? 'User-agent: *\nDisallow: /app/\nSitemap: https://splitverde.com/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n', {headers:{'Content-Type':'text/plain'}});
};