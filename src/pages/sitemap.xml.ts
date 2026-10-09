import type {APIRoute} from 'astro';

export const prerender = true;

export const GET: APIRoute = ({site}) => {
  const urls = ['/', '/experience/', '/projects/', '/contact/'].map((path) => new URL(path, site).href);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`,
    {headers: {'Content-Type': 'application/xml; charset=utf-8'}},
  );
};
