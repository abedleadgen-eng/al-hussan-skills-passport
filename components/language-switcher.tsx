'use client'

import { useTransition } from 'react'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setLocale } from '@/app/actions/locale'
import { useI18n } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('gap-1.5', className)}
      disabled={pending}
      onClick={() => startTransition(() => setLocale(locale === 'ar' ? 'en' : 'ar'))}
      aria-label={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Languages aria-hidden="true" />
      <span lang={locale === 'ar' ? 'en' : 'ar'}>{t.nav.language}</span>
    </Button>
  )
}
