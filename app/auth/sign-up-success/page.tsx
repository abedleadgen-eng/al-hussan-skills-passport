import { AuthMessage } from '@/components/auth/auth-message'
import { getI18n } from '@/lib/i18n/server'

export default async function SignUpSuccessPage() {
  const { t } = await getI18n()
  return <AuthMessage title={t.auth.checkEmail} body={t.auth.checkEmailSub} cta={t.auth.backToLogin} />
}
