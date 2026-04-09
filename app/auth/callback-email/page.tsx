import EmailCallbackClient from './EmailCallbackClient'

// Force dynamic rendering - this page requires browser environment and Supabase client
// The dynamic export MUST be in a Server Component, not a Client Component
export const dynamic = 'force-dynamic'

export default function EmailCallback() {
  return <EmailCallbackClient />
}
