import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dovitejournal.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/issues', '/articles/*'],
      disallow: ['/editor', '/reviewer', '/dashboard', '/api/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
