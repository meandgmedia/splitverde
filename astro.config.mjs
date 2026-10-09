import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://splitverde.com',
  output: 'server',
  adapter: cloudflare(),
  integrations: [react(), tailwind()],
});
