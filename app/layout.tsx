import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic, Playfair_Display } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/components/i18n-provider'
import { getI18n } from '@/lib/i18n/server'
import './globals.css'

const plex = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: {
    default: 'Al Hussan Skills Passport',
    template: '%s · Al Hussan Skills Passport',
  },
  description:
    'A bilingual digital skills passport for managing employee profiles, skills, courses, achievements, and evaluations.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#1b2a4a',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, dir } = await getI18n()
  return (
    <html lang={locale} dir={dir} className={`${plex.variable} ${playfair.variable} light`}>
      <body className="font-sans antialiased">
        <I18nProvider locale={locale}>
          {children}
          <Toaster position={dir === 'rtl' ? 'bottom-left' : 'bottom-right'} />
        </I18nProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
