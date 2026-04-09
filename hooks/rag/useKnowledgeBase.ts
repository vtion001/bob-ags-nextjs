import { useState, useEffect, useCallback } from 'react'

export interface KnowledgeEntry {
  id: string
  category: 'transfer' | 'script' | 'sop' | 'disposition'
  title: string
  content: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

interface UseKnowledgeBaseReturn {
  entries: KnowledgeEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface UseSearchKnowledgeReturn {
  results: KnowledgeEntry[]
  isSearching: boolean
  error: string | null
  search: (query: string) => Promise<void>
  clearResults: () => void
}

export function useKnowledgeBase(category?: string): UseKnowledgeBaseReturn {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)

      const response = await fetch(`/api/knowledge-base${params.toString() ? `?${params}` : ''}`)
      if (!response.ok) throw new Error('Failed to fetch knowledge base entries')
      const data = await response.json()
      setEntries(data.entries || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [category])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { entries, isLoading, error, refetch }
}

export function useSearchKnowledge(): UseSearchKnowledgeReturn {
  const [results, setResults] = useState<KnowledgeEntry[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    setError(null)
    try {
      const response = await fetch(`/api/knowledge-base?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search knowledge base')
      const data = await response.json()
      setResults(data.entries || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, isSearching, error, search, clearResults }
}
