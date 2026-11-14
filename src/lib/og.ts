import type { Metadata } from 'next';

/**
 * Full Open Graph block for a page. Next.js replaces the parent's `openGraph` wholesale
 * (no deep merge), so a page that sets only title/url loses siteName, locale and image,
 * and a page that sets nothing shows the home page's title when shared. Use this everywhere.
 */
export function og(path: string, title: string, description: string, image = '/logos/billy-store-logo.png'): Metadata['openGraph'] {
  return { type: 'website', locale: 'ar_SA', siteName: 'Billy Store', url: path, title, description, images: [{ url: image }] };
}
