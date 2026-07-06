import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Student Enquiry — Triple Tree Enrichment Centre',
  description: 'Register or Enquire about your child for Coding, Chinese, English, Maths, Science, Arts or Calligraphy classes',
  manifest: '/form-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TT Register',
  },
  icons: {
    icon: '/logo.png',
    apple: '/icon-192.png',
  },
}

export default function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Override manifest link so iOS saves /form as the start URL, not /dashboard */}
      <link rel="manifest" href="/form-manifest.json" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="TT Register" />
      <meta name="theme-color" content="#1E8449" />
      {children}
    </>
  )
}
