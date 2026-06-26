import { createDirectus, rest, authentication } from '@directus/sdk';

const directusUrl = import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055';

if (!import.meta.env.VITE_DIRECTUS_URL) {
  console.warn('Using default Directus URL. Set VITE_DIRECTUS_URL in your environment variables.');
}

export const directus = createDirectus(directusUrl)
  .with(authentication('json', { autoRefresh: true }))
  .with(rest());
