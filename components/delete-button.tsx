'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useI18n } from '@/components/i18n-provider'
import type { ActionResult } from '@/lib/types'

export function DeleteButton({
  action,
  label,
  redirectTo,
  withText = false,
}: {
  action: () => Promise<ActionResult>
  label: string
  redirectTo?: string
  withText?: boolean
}) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        toast.success(t.common.deleted)
        setOpen(false)
        if (redirectTo) router.push(redirectTo)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={withText ? 'outline' : 'ghost'}
          size={withText ? 'sm' : 'icon'}
          className="text-destructive hover:text-destructive"
          aria-label={label}
        >
          <Trash2 aria-hidden="true" />
          {withText && label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{t.common.confirmDelete}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
