'use client'

import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/components/i18n-provider'
import { signInAction, signUpAction } from '@/app/actions/auth'

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useI18n()
  const [state, action, pending] = useActionState(mode === 'login' ? signInAction : signUpAction, undefined)
  const [redirectTo, setRedirectTo] = useState('')

  useEffect(() => {
    setRedirectTo(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-primary">
          {mode === 'login' ? t.auth.welcome : t.auth.signUp}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'login' ? t.auth.welcomeSub : t.auth.createSub}
        </p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">{t.auth.fullName}</Label>
            <Input id="full_name" name="full_name" autoComplete="name" required className="h-10" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input id="email" name="email" type="email" autoComplete="email" dir="ltr" required className="h-10" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={mode === 'signup' ? 8 : undefined}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            dir="ltr"
            required
            className="h-10"
          />
        </div>
        <input type="hidden" name="redirect_to" value={redirectTo} />
        {state?.error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t.auth[state.error]}
          </p>
        )}
        <Button type="submit" size="lg" className="h-10" disabled={pending}>
          {pending
            ? mode === 'login'
              ? t.auth.signingIn
              : t.auth.creating
            : mode === 'login'
              ? t.auth.signIn
              : t.auth.signUp}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? t.auth.noAccount : t.auth.haveAccount}{' '}
        <Link
          href={mode === 'login' ? '/auth/sign-up' : '/auth/login'}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {mode === 'login' ? t.auth.signUp : t.auth.signIn}
        </Link>
      </p>
    </div>
  )
}
