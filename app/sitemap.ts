import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://polish-ai.com'

  const routes = [
    '',
    '/image-ai',
    '/gif-maker',
    '/image-editing',
    '/chat-ai',
    '/pdf-ai',
    '/about',
    '/feedback',
    '/desclaimer',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
