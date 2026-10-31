export function str(fd: FormData, key: string, max = 500) {
  return String(fd.get(key) ?? '').trim().slice(0, max)
}

export function optStr(fd: FormData, key: string, max = 500) {
  const v = str(fd, key, max)
  return v === '' ? null : v
}

export function isUuid(v: string | null | undefined): v is string {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

export function optUuid(fd: FormData, key: string) {
  const v = str(fd, key, 64)
  return isUuid(v) ? v : null
}

export function isDate(v: string | null | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
}

export function int(fd: FormData, key: string, min: number, max: number) {
  const raw = str(fd, key, 10)
  if (raw === '') return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n < min || n > max) return NaN
  return n
}
