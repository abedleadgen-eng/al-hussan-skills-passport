import { requireSession } from '@/lib/auth'
import { getI18n } from '@/lib/i18n/server'
import { pick } from '@/lib/i18n/dictionaries'
import { SidebarContent } from '@/components/shell/sidebar-content'
import { MobileNav } from '@/components/shell/mobile-nav'
import { LanguageSwitcher } from '@/components/language-switcher'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireSession()
  const { locale } = await getI18n()
  const { data: org } = await supabase.from('organization_settings').select('name_en, name_ar').eq('id', 1).single()
  const orgName = pick(locale, org?.name_en ?? 'Al Hussan', org?.name_ar)
  const userName = pick(locale, profile.full_name || profile.email, profile.full_name_ar)

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 lg:block">
        <SidebarContent role={profile.role} orgName={orgName} userName={userName} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-8">
          <MobileNav role={profile.role} orgName={orgName} userName={userName} />
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
