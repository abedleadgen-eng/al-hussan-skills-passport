import { AuthMessage } from '@/components/auth/auth-message'
import { getI18n } from '@/lib/i18n/server'

export default async function AuthErrorPage() {
  const { t } = await getI18n()
  return <AuthMessage title={t.auth.errorTitle} body={t.auth.errorSub} cta={t.auth.backToLogin} />
}
