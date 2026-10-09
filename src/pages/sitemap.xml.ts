import type { APIRoute } from 'astro';
export const GET: APIRoute = ({url}) => {
 const prod = import.meta.env.PUBLIC_ENABLE_INDEXING === 'true' && url.hostname === 'splitverde.com';
 const paths=['/','/features','/pricing','/how-it-works'];
 const body=prod ? '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+paths.map(p=>'<url><loc>https://splitverde.com'+p+'</loc></url>').join('')+'</urlset>' : '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';
 return new Response(body,{headers:{'Content-Type':'application/xml','X-Robots-Tag':prod?'index':'noindex'}});
};