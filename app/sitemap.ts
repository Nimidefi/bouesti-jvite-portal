import { MetadataRoute } from 'next';
import { API_URL } from '@/lib/config';

// Replace with your actual domain when deploying
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dovitejournal.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  let routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/issues`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/guidelines`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic routes (Articles)
  try {
    const res = await fetch(`${API_URL}/api/submissions`, { cache: 'no-store' });
    if (res.ok) {
      const submissions = await res.json();
      const articles = submissions.filter((s: any) => s.status === 'published');
      
      const articleRoutes = articles.map((article: any) => ({
        url: `${BASE_URL}/articles/${article.id}`,
        lastModified: new Date(article.submittedAt),
        changeFrequency: 'never' as const,
        priority: 0.6,
      }));
      
      routes = [...routes, ...articleRoutes];
    }
  } catch (e) {
    console.error('Failed to fetch articles for sitemap:', e);
  }

  return routes;
}
