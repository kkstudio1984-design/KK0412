/** @type {import('next').NextConfig} */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_HOST = SUPABASE_URL.replace(/^https?:\/\//, '')

// Content Security Policy
// - default-src 'self': only our own domain
// - script-src: self + vercel analytics + supabase (needs unsafe-inline for Next.js inline scripts)
// - connect-src: self + Supabase (REST + Realtime) + Vercel + Google OAuth
// - frame-src: Google OAuth popups
// - img-src: self + data + blob + Supabase storage + Google user avatars
// - font-src: self + Google Fonts
// - style-src: self + unsafe-inline (Tailwind + inline styles)
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com https://*.vercel-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com https://lh3.googleusercontent.com;
  connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com https://*.vercel-analytics.com https://accounts.google.com;
  frame-src 'self' https://accounts.google.com https://vercel.live;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspHeader },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
