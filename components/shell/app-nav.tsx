'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, IdCard, LayoutDashboard, Settings, Users } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import type { AppRole } from '@/lib/types'
import { cn } from '@/lib/utils'

export function AppNav({ role, onNavigate }: { role: AppRole; onNavigate?: () => void }) {
  const { t } = useI18n()
  const pathname = usePathname()
  const admin = role === 'super_admin' || role === 'hr_admin'

  const items = [
    { href: '/dashboard', label: t.nav.dashboard, icon: LayoutDashboard, show: true },
    { href: '/passport', label: t.nav.passport, icon: IdCard, show: true },
    {
      href: '/employees',
      label: admin ? t.nav.employees : t.nav.team,
      icon: Users,
      show: admin || role === 'manager',
    },
    { href: '/training', label: t.nav.training, icon: BookOpen, show: true },
    { href: '/reports', label: t.nav.reports, icon: BarChart3, show: admin },
    { href: '/settings', label: t.nav.settings, icon: Settings, show: admin },
  ].filter((i) => i.show)

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              active && 'bg-sidebar-accent text-sidebar-accent-foreground',
            )}
          >
            <item.icon className={cn('size-4', active && 'text-sidebar-primary')} aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
