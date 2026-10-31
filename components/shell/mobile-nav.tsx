'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useI18n } from '@/components/i18n-provider'
import { SidebarContent } from '@/components/shell/sidebar-content'
import type { AppRole } from '@/lib/types'

export function MobileNav(props: { role: AppRole; orgName: string; userName: string }) {
  const [open, setOpen] = useState(false)
  const { locale } = useI18n()
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="Menu" />}>
        <Menu />
      </SheetTrigger>
      <SheetContent side={locale === 'ar' ? 'right' : 'left'} className="w-72 border-0 p-0" showCloseButton={false}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SidebarContent {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
