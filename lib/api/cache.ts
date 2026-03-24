interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  
  const isExpired = Date.now() - entry.timestamp > ttlMs
  if (isExpired) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  })
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear()
    return
  }
  
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  }
}

const pendingRequests = new Map<string, Promise<unknown>>()

export async function getWithDeduplication<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const existing = pendingRequests.get(key)
  if (existing) {
    return existing as Promise<T>
  }
  
  const promise = fetchFn().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, promise)
  return promise
}

export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = 30000
): Promise<T> {
  const cached = getCached<T>(key, ttlMs)
  if (cached) {
    return cached
  }
  
  const data = await getWithDeduplication(key, fetchFn)
  setCache(key, data)
  
  return data
}