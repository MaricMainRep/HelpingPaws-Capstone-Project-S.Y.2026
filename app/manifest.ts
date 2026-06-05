import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HelpingPaws - Veterinary Management',
    short_name: 'HelpingPaws',
    description: 'Professional veterinary management system for clinics and pet owners',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3a7d6c',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['medical', 'productivity', 'business'],
    lang: 'en',
    dir: 'ltr',
  }
}
