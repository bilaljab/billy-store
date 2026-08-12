import localFont from 'next/font/local';

export const stc = localFont({
  src: [
    { path: '../../public/fonts/stc/STC-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/stc/STC-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-stc',
  display: 'swap',
  fallback: ['Tahoma', 'sans-serif'],
});
