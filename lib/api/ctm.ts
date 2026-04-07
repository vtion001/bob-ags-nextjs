import { CTMClient } from '@/lib/ctm'
import { fetchWithCache } from './cache'

let ctmClientInstance: CTMClient | null = null

export function getCTMClient(): CTMClient {
  if (!ctmClientInstance) {
    ctmClientInstance = new CTMClient()
  }
  return ctmClientInstance
}

export async function fetchAllCTMData<T>(
  fetchFns: Array<() => Promise<T>>,
  ttlMs: number = 30000
): Promise<T[]> {
  const promises = fetchFns.map((fetchFn, index) =>
    fetchWithCache(
      `ctm:parallel:${index}`,
      fetchFn,
      ttlMs
    )
  )

  return Promise.all(promises)
}
