import { CmsLangProvider } from '@/lib/context/cms-lang-context'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <CmsLangProvider>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </CmsLangProvider>
  )
}
