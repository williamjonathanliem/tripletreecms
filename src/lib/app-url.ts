// Resolves the public app URL in order of preference:
// 1. NEXT_PUBLIC_APP_URL   — explicit override (set this in Vercel dashboard)
// 2. VERCEL_PROJECT_PRODUCTION_URL — Vercel auto-injects this for production deployments
// 3. VERCEL_URL            — Vercel auto-injects this for every deployment (preview + prod)
// 4. localhost fallback    — for local dev
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    'http://localhost:3000'
  return raw.replace(/\/$/, '') // strip trailing slash
}
