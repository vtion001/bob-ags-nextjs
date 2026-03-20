export interface KnowledgeEntry {
  category: 'transfer' | 'script' | 'sop' | 'disposition'
  title: string
  content: string
  metadata: Record<string, unknown>
}