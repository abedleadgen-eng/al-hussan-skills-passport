import { BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 items-center justify-center rounded-lg border border-gold/60 bg-primary text-gold',
        className,
      )}
      aria-hidden="true"
    >
      <BookMarked className="size-5" />
    </span>
  )
}
