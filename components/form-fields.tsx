import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Base = { id: string; label: string; className?: string }

export function TextField({
  id,
  label,
  className,
  ...props
}: Base & Omit<React.ComponentProps<'input'>, 'id'>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={props.name ?? id} {...props} />
    </div>
  )
}

export function TextAreaField({
  id,
  label,
  className,
  ...props
}: Base & Omit<React.ComponentProps<'textarea'>, 'id'>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={props.name ?? id} rows={3} {...props} />
    </div>
  )
}

export function SelectField({
  id,
  label,
  options,
  className,
  placeholder,
  ...props
}: Base & {
  options: { value: string; label: string }[]
  placeholder?: string
} & Omit<React.ComponentProps<'select'>, 'id'>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={props.name ?? id}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}
