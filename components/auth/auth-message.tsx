import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export function AuthMessage({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-3xl font-semibold text-primary">{title}</h1>
      <p className="text-sm text-muted-foreground text-pretty">{body}</p>
      <Link href="/auth/login" className={buttonVariants({ size: 'lg', className: 'h-10' })}>
        {cta}
      </Link>
    </div>
  )
}
