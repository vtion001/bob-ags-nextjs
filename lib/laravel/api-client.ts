// Laravel API client for frontend
// Replaces Supabase calls with Laravel Sanctum auth

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

interface ApiResponse<T = unknown> {
  success?: boolean
  error?: string
  message?: string
  data?: T
  [key: string]: unknown
}

class LaravelApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message)
    this.name = 'LaravelApiError'
  }
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${LARAVEL_API_URL}/api${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for Sanctum
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new LaravelApiError(
      body.error || body.message || `Request failed with status ${response.status}`,
      response.status,
      body
    )
  }

  return response.json()
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{
      success: boolean
      user: { id: string; email: string }
      role: string
      permissions: Record<string, boolean>
    }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ success: boolean; message: string }>('/logout', {
      method: 'POST',
    }),

  getUser: () =>
    request<{
      success: boolean
      user: { id: string; email: string }
      role: string
      permissions: Record<string, boolean>
    }>('/user'),

  register: (name: string, email: string, password: string, password_confirmation: string) =>
    request<{ success: boolean; message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation }),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
}

// User API
export const userApi = {
  getPermissions: () =>
    request<{ role: string; permissions: Record<string, boolean> }>('/users/permissions'),

  getSettings: () =>
    request<{ settings: { ctm_agent_id: string | null; theme: string; notifications_enabled: boolean } }>('/users/settings'),

  updateSettings: (data: { ctm_agent_id?: string; theme?: string; notifications_enabled?: boolean }) =>
    request<{ success: boolean; settings: Record<string, unknown> }>('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getCtmAssignments: () =>
    request<{ assignments: unknown[] }>('/users/ctm-assignments'),
}

// CTM API
export const ctmApi = {
  getCalls: (params?: { limit?: number; hours?: number; status?: string; source_id?: string; agent_id?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.hours) searchParams.set('hours', String(params.hours))
    if (params?.status) searchParams.set('status', params.status)
    if (params?.source_id) searchParams.set('source_id', params.source_id)
    if (params?.agent_id) searchParams.set('agent_id', params.agent_id)
    const query = searchParams.toString()
    return request<{ calls: unknown[]; success: boolean }>(`/ctm/calls${query ? `?${query}` : ''}`)
  },

  getCall: (id: string) =>
    request<{ call: unknown }>(`/ctm/calls/${id}`),

  getAgents: () =>
    request<{ agents: unknown[]; userGroups?: unknown[] }>('/ctm/agents'),

  getAgentGroups: () =>
    request<{ userGroups: unknown[] }>('/ctm/agents/groups'),

  getNumbers: () =>
    request<{ numbers: unknown[] }>('/ctm/numbers'),

  getSchedules: () =>
    request<{ schedules: unknown[] }>('/ctm/schedules'),

  getSources: () =>
    request<{ sources: unknown[] }>('/ctm/sources'),

  getVoiceMenus: () =>
    request<{ voice_menus: unknown[] }>('/ctm/voice_menus'),

  getReceivingNumbers: () =>
    request<{ receiving_numbers: unknown[] }>('/ctm/receiving_numbers'),

  getAccounts: () =>
    request<{ accounts: unknown[] }>('/ctm/accounts'),

  getDashboardStats: () =>
    request<{ stats: unknown }>('/ctm/dashboard/stats'),

  getLiveCalls: () =>
    request<{ calls: unknown[] }>('/ctm/live-calls'),

  getActiveCalls: () =>
    request<{ calls: unknown[] }>('/ctm/active-calls'),

  getCallsHistory: (params?: { hours?: number; limit?: number; page?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.hours) searchParams.set('hours', String(params.hours))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.page) searchParams.set('page', String(params.page))
    const query = searchParams.toString()
    return request<{ calls: unknown[]; total?: number; page?: number }>(`/ctm/calls/history${query ? `?${query}` : ''}`)
  },

  searchCalls: (phone: string, hours?: number) => {
    const params = new URLSearchParams({ phone })
    if (hours) params.set('hours', String(hours))
    return request<{ calls: unknown[] }>(`/ctm/calls/search?${params}`)
  },
}

// Calls API (local DB)
export const callsApi = {
  getCalls: (params?: { limit?: number; hours?: number; status?: string; ctm_call_id?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.hours) searchParams.set('hours', String(params.hours))
    if (params?.status) searchParams.set('status', params.status)
    if (params?.ctm_call_id) searchParams.set('ctm_call_id', params.ctm_call_id)
    const query = searchParams.toString()
    return request<{ calls: unknown[]; success: boolean }>(`/calls${query ? `?${query}` : ''}`)
  },

  search: (phone: string, hours?: number) => {
    const params = new URLSearchParams({ phone })
    if (hours) params.set('hours', String(hours))
    return request<{ calls: unknown[]; success: boolean }>(`/calls/search?${params}`)
  },

  bulkAnalyze: (limit?: number, offset?: number) =>
    request<{ success: boolean; processed: number; successCount: number; failCount: number }>('/calls/bulk-analyze', {
      method: 'POST',
      body: JSON.stringify({ limit, offset }),
    }),
}

// AI API
export const aiApi = {
  analyze: (transcript: string, phone?: string, client?: string, ctmStarRating?: number) =>
    request<{ success: boolean; analysis: unknown }>('/openrouter', {
      method: 'POST',
      body: JSON.stringify({ transcript, phone, client, ctmStarRating }),
    }),

  transcribe: (audioUrl: string, callId: string) =>
    request<{ success: boolean; transcript: string; id: string }>('/assemblyai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioUrl, callId }),
    }),

  getToken: () =>
    request<{ success: boolean; token: string }>('/assemblyai/token'),
}

// Agent Profiles API
export const agentProfileApi = {
  getProfiles: () =>
    request<{ profiles: unknown[] }>('/agents/profiles'),

  createProfile: (data: { name: string; agent_id: string; email?: string; phone?: string }) =>
    request<{ success: boolean; profile: unknown }>('/agents/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProfile: (id: string, data: Partial<{ name: string; agent_id: string; email: string; phone: string; notes: string }>) =>
    request<{ success: boolean; profile: unknown }>(`/agents/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProfile: (id: string) =>
    request<{ success: boolean }>(`/agents/profiles/${id}`, {
      method: 'DELETE',
    }),
}

// QA Overrides API
export const qaOverrideApi = {
  getOverrides: () =>
    request<{ overrides: unknown[] }>('/qa-overrides'),

  createOverride: (data: { call_id: string; score: number; notes?: string }) =>
    request<{ success: boolean; override: unknown }>('/qa-overrides', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Knowledge Base API
export const knowledgeBaseApi = {
  getEntries: () =>
    request<{ entries: unknown[] }>('/knowledge-base'),

  createEntry: (data: { question: string; answer: string; category?: string }) =>
    request<{ success: boolean; entry: unknown }>('/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEntry: (id: string, data: { question?: string; answer?: string; category?: string }) =>
    request<{ success: boolean; entry: unknown }>(`/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEntry: (id: string) =>
    request<{ success: boolean }>(`/knowledge-base/${id}`, {
      method: 'DELETE',
    }),
}

// Live Analysis Logs API
export const liveAnalysisApi = {
  getLogs: () =>
    request<{ logs: unknown[] }>('/live-analysis-logs'),

  createLog: (data: { call_id: string; analysis: unknown }) =>
    request<{ success: boolean; log: unknown }>('/live-analysis-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteLog: (id: string) =>
    request<{ success: boolean }>(`/live-analysis-logs/${id}`, {
      method: 'DELETE',
    }),
}

export { LARAVEL_API_URL, LaravelApiError }
export type { ApiResponse }
