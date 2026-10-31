import 'server-only'
import { cookies } from 'next/headers'
import { dictionaries, LOCALE_COOKIE, type Locale } from './dictionaries'

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return value === 'ar' ? 'ar' : 'en'
}

export async function getI18n() {
  const locale = await getLocale()
  return { locale, t: dictionaries[locale], dir: locale === 'ar' ? 'rtl' : 'ltr' } as const
}

export function formatDate(locale: Locale, value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}
