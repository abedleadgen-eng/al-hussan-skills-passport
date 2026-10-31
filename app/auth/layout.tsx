import { BrandMark } from '@/components/brand-mark'
import { LanguageSwitcher } from '@/components/language-switcher'
import { getI18n } from '@/lib/i18n/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n()
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="text-lg font-semibold">
            Al Hussan <span className="text-gold">{t.appName}</span>
          </span>
        </div>
        <div className="max-w-md">
          <p className="font-serif text-4xl leading-tight text-balance">{t.passport.cover}</p>
          <p className="mt-4 text-primary-foreground/70 text-pretty">{t.orgTagline}</p>
        </div>
        <div className="flex gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-gold/60 text-[10px] font-semibold uppercase tracking-widest text-gold"
              style={{ transform: `rotate(${(i - 1) * 12}deg)` }}
            >
              {['Learn', 'Grow', 'Lead'][i]}
            </span>
          ))}
        </div>
      </aside>
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <BrandMark className="size-8" />
            <span className="font-semibold">{t.appName}</span>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  )
}
