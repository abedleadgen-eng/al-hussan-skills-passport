'use client'

import { createContext, useContext } from 'react'
import { dictionaries, type Locale } from '@/lib/i18n/dictionaries'

const I18nContext = createContext<Locale>('en')

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={locale}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const locale = useContext(I18nContext)
  return { locale, t: dictionaries[locale] }
}
