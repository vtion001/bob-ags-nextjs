'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthMessageHandler({ onError, onPending }: { onError: (msg: string) => void; onPending: (msg: string) => void }) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    const pending = searchParams.get('signup')

    if (error === 'auth_failed') {
      onError('Authentication failed. Please try again.')
    } else if (pending === 'pending') {
      onPending('Your account is pending approval. An administrator will review your access and link your CTM agent.')
    }
  }, [searchParams, onError, onPending])

  return null
}
