'use client'

import React, { useState, useMemo } from 'react'
import { useKnowledgeBase, type KnowledgeEntry } from '@/hooks/rag/useKnowledgeBase'
import { useSearchKnowledge } from '@/hooks/rag/useKnowledgeBase'
import Card from '@/components/ui/Card'

interface KnowledgeSuggestionsProps {
  /** Optional category filter */
  category?: string
  /** Optional context for relevance filtering */
  context?: {
    insurance?: string
    state?: string
    substance?: string
    callerType?: string
    isCrisis?: boolean
  }
  /** Max entries to show */
  limit?: number
}

type CategoryGroup = {
  transfer: KnowledgeEntry[]
  script: KnowledgeEntry[]
  sop: KnowledgeEntry[]
  disposition: KnowledgeEntry[]
}

const CATEGORY_LABELS: Record<KnowledgeEntry['category'], string> = {
  transfer: 'Transfers',
  script: 'Scripts',
  sop: 'SOPs',
  disposition: 'Dispositions',
}

const CATEGORY_COLORS: Record<KnowledgeEntry['category'], { bg: string; text: string; border: string }> = {
  transfer: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  script: { bg: 'bg-navy-50', text: 'text-navy-800', border: 'border-navy-200' },
  sop: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  disposition: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
}

function CategoryBadge({ category }: { category: KnowledgeEntry['category'] }) {
  const colors = CATEGORY_COLORS[category]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
      {CATEGORY_LABELS[category]}
    </span>
  )
}

function KnowledgeEntryItem({ entry }: { entry: KnowledgeEntry }) {
  const [expanded, setExpanded] = useState(false)
  const preview = entry.content.length > 120 && !expanded
    ? entry.content.slice(0, 120) + '...'
    : entry.content

  return (
    <div className="border-b border-navy-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2.5 text-left hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="font-semibold text-navy-900 text-sm leading-tight">
            {entry.title}
          </span>
          <CategoryBadge category={entry.category} />
        </div>
        <p className="text-xs text-navy-600 leading-relaxed">
          {preview}
        </p>
        {entry.content.length > 120 && (
          <span className="inline-block mt-1 text-xs text-cyan-600 font-medium">
            {expanded ? 'Show less' : 'Show more'}
          </span>
        )}
      </button>
    </div>
  )
}

function CategorySection({
  title,
  category,
  entries,
}: {
  title: string
  category: KnowledgeEntry['category']
  entries: KnowledgeEntry[]
}) {
  const [expanded, setExpanded] = useState(true)
  const colors = CATEGORY_COLORS[category]

  if (entries.length === 0) return null

  return (
    <div className="border-b border-navy-100 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-3 py-2 flex items-center justify-between ${colors.bg} hover:opacity-80 transition-opacity`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${colors.text}`}>{title}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.text} bg-white/50`}>
            {entries.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 ${colors.text} transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="divide-y divide-navy-100">
          {entries.map((entry) => (
            <KnowledgeEntryItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function KnowledgeSuggestions({
  category,
  context,
  limit,
}: KnowledgeSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [localSearchEnabled, setLocalSearchEnabled] = useState(false)

  const { entries, isLoading, error } = useKnowledgeBase(category)
  const { results, isSearching, search, clearResults } = useSearchKnowledge()

  // Group entries by category
  const groupedEntries = useMemo<CategoryGroup>(() => {
    const groups: CategoryGroup = {
      transfer: [],
      script: [],
      sop: [],
      disposition: [],
    }

    const source = localSearchEnabled && searchQuery.trim() ? results : entries
    const items = limit ? source.slice(0, limit) : source

    for (const entry of items) {
      if (groups[entry.category]) {
        groups[entry.category].push(entry)
      }
    }
    return groups
  }, [entries, results, localSearchEnabled, searchQuery, limit])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      clearResults()
      setLocalSearchEnabled(false)
      return
    }
    setLocalSearchEnabled(true)
    await search(searchQuery)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    clearResults()
    setLocalSearchEnabled(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  const totalEntries = Object.values(groupedEntries).reduce((sum, arr) => sum + arr.length, 0)
  const isEmpty = totalEntries === 0

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-navy-200">
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-5 h-5 text-cyan-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="text-lg font-bold text-navy-900">Knowledge Base</h3>
          {!localSearchEnabled && entries.length > 0 && (
            <span className="px-2 py-0.5 bg-navy-100 text-navy-700 text-xs rounded-full">
              {entries.length}
            </span>
          )}
          {localSearchEnabled && results.length > 0 && (
            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-full">
              {results.length} found
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search knowledge base..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-3 py-2 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 disabled:opacity-50 transition-colors"
          >
            {isSearching ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Search'
            )}
          </button>
          {localSearchEnabled && (
            <button
              onClick={handleClearSearch}
              className="px-3 py-2 text-navy-600 text-sm font-medium hover:text-navy-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-navy-200 border-t-cyan-600 rounded-full animate-spin mx-auto" />
            <p className="text-navy-600 text-sm mt-2">Loading knowledge base...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 text-sm font-medium">Failed to load</p>
            <p className="text-red-500 text-xs mt-1">{error}</p>
          </div>
        ) : isEmpty ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-navy-500 text-sm font-medium">
              {localSearchEnabled ? 'No results found' : 'No knowledge entries'}
            </p>
            <p className="text-navy-400 text-xs mt-1">
              {localSearchEnabled ? 'Try a different search term' : 'Check back later for updates'}
            </p>
          </div>
        ) : (
          <div>
            <CategorySection
              title="Transfers"
              category="transfer"
              entries={groupedEntries.transfer}
            />
            <CategorySection
              title="Scripts"
              category="script"
              entries={groupedEntries.script}
            />
            <CategorySection
              title="SOPs"
              category="sop"
              entries={groupedEntries.sop}
            />
            <CategorySection
              title="Dispositions"
              category="disposition"
              entries={groupedEntries.disposition}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
