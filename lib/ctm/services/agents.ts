import { CTMClient } from '../client'
import type { Agent, UserGroup, CTMAgent, CTMUserGroup } from '@/lib/types'

export class AgentsService extends CTMClient {
  async getAgents(): Promise<Agent[]> {
    try {
      const firstPage = await this.makeRequest<{ agents?: CTMAgent[]; next_page?: string }>(
        `/accounts/${this.accountId}/agents.json`
      )
      
      if (!firstPage.agents?.length) return []
      
      const allAgents: Agent[] = firstPage.agents.map(a => ({
        id: a.id || String(a.uid) || '',
        uid: a.uid || 0,
        name: a.name || a.email || 'Unknown',
        email: a.email || '',
      }))
      
      if (!firstPage.next_page) return allAgents
      
      const totalPages = this.parseTotalPages(firstPage.next_page)
      if (totalPages <= 1) return allAgents
      
      const pagePromises: Promise<Agent[]>[] = []
      for (let page = 2; page <= totalPages; page++) {
        pagePromises.push(
          this.fetchAgentsPage(page).catch(() => [])
        )
      }
      
      const pageResults = await Promise.all(pagePromises)
      for (const pageAgents of pageResults) {
        allAgents.push(...pageAgents)
      }
      
      return allAgents
    } catch {
      return []
    }
  }
  
  private async fetchAgentsPage(page: number): Promise<Agent[]> {
    const data = await this.makeRequest<{ agents?: CTMAgent[] }>(
      `/accounts/${this.accountId}/agents.json?page=${page}`
    )
    return (data.agents || []).map(a => ({
      id: a.id || String(a.uid) || '',
      uid: a.uid || 0,
      name: a.name || a.email || 'Unknown',
      email: a.email || '',
    }))
  }
  
  private parseTotalPages(nextPageUrl: string): number {
    const match = nextPageUrl.match(/page=(\d+)/)
    return match ? parseInt(match[1], 10) : 2
  }

  async getUserGroups(): Promise<UserGroup[]> {
    try {
      const data = await this.makeRequest<{ user_groups?: CTMUserGroup[] }>(
        `/accounts/${this.accountId}/user_groups.json`
      )
      return (data.user_groups || []).map(g => ({
        id: String(g.id),
        name: g.name || 'Unknown',
        userIds: g.user_ids || [],
      }))
    } catch (err) {
      console.error('[CTM] getUserGroups error:', err)
      return []
    }
  }
}

export function createAgentsService(): AgentsService {
  return new AgentsService()
}
