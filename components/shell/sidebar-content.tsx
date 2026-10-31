'use client'

import { LogOut } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { useI18n } from '@/components/i18n-provider'
import { AppNav } from '@/components/shell/app-nav'
import { signOutAction } from '@/app/actions/auth'
import type { AppRole } from '@/lib/types'

export function SidebarContent({
  role,
  orgName,
  userName,
  onNavigate,
}: {
  role: AppRole
  orgName: string
  userName: string
  onNavigate?: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex items-center gap-3 px-1 pt-1">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{orgName}</p>
          <p className="truncate text-xs text-sidebar-primary">{t.appName}</p>
        </div>
      </div>
      <AppNav role={role} onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-3 border-t border-sidebar-border pt-4">
        <div className="px-1">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-sidebar-foreground/60">{t.roles[role]}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4 rtl:rotate-180" aria-hidden="true" />
            {t.nav.signOut}
          </button>
        </form>
      </div>
    </div>
  )
}
