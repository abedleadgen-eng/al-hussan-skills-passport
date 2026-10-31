'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { LOCALE_COOKIE } from '@/lib/i18n/dictionaries'

export async function setLocale(locale: string) {
  const value = locale === 'ar' ? 'ar' : 'en'
  ;(await cookies()).set(LOCALE_COOKIE, value, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/', 'layout')
}
