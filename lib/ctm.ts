export interface Call {
  id: string
  phone: string
  direction: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'missed' | 'active'
  timestamp: Date
  name?: string
  callerNumber?: string
  trackingNumber?: string
  trackingLabel?: string
  source?: string
  sourceId?: string
  accountId?: string
  agent?: {
    id: string
    name: string
    email: string
  }
  recordingUrl?: string
  transcript?: string
  city?: string
  state?: string
  postalCode?: string
  notes?: string
  talkTime?: number
  waitTime?: number
  ringTime?: number
  score?: number
  analysis?: {
    sentiment: string
    summary: string
    tags: string[]
    disposition: string
  }
}

interface CTMConfig {
  accessKey: string
  secretKey: string
  accountId: string
}

interface GetCallsParams {
  limit?: number
  hours?: number
  status?: string | null
  sourceId?: string | null
  agentId?: string | null
}

interface CTMCall {
  id: number
  sid?: string
  account_id?: number
  name?: string
  caller_id?: string
  caller_number?: string
  phone_number?: string
  duration?: number
  status?: string
  direction?: string
  started_at?: string
  called_at?: string
  source?: string
  source_id?: string
  source_sid?: string
  tracking_number?: string
  tracking_number_format?: string
  tracking_label?: string
  talk_time?: number
  wait_time?: number
  ring_time?: number
  destination_number?: string
  pool_number?: string
  did_number?: string
  recording_url?: string
  audio?: string
  transcript?: string
  city?: string
  state?: string
  postal_code?: string
  notes?: string
  tag_list?: string[]
  emails?: Array<{ email: string }>
  agent?: {
    id: string
    name: string
    email: string
  }
  agent_id?: string
}

interface CTMAccount {
  id: number
  name: string
  status?: string
  created_at?: string
}

interface CTMNumber {
  id: number
  source: number
  friendly_name: string
  number: string
  phone_number: string
  latitude?: string
  longitude?: string
  region?: string
  postal_code?: string
  iso_country?: string
  ratecenter?: string
  capabilities?: {
    voice: boolean
    SMS: boolean
    MMS: boolean
  }
  number_type?: string
  distance?: number
}

interface CTMSource {
  id: string
  name: string
  account_id: number
  referring_url?: string
  landing_url?: string
  position?: number
  online?: boolean
  geo_mode?: string
}

interface CTMSchedule {
  id: number
  name: string
  times?: Array<{
    start_time: string
    end_time: string
    days: Record<string, boolean>
    position: string
  }>
  timezone?: string
}

interface CTMVoiceMenu {
  id: number
  name: string
  play_message?: string
  input_maxkeys?: string
  input_timeout?: string
  prompt_retries?: string
  items?: Array<{
    keypress: string
    voice_action_type: string
    dial_number_id?: string
    next_voice_menu_id?: string
  }>
}

interface CTMReceivingNumber {
  id: number
  number: string
  name?: string
  account_id?: number
  created_at?: string
}

interface SearchNumbersParams {
  country?: string
  searchby?: 'area' | 'address' | 'zip'
  areacode?: string
  address?: string
  pattern?: string
}

export class CTMClient {
  private accessKey: string
  private secretKey: string
  private accountId: string
  private baseUrl: string

  constructor() {
    this.accessKey = process.env.CTM_ACCESS_KEY || ''
    this.secretKey = process.env.CTM_SECRET_KEY || ''
    this.accountId = process.env.CTM_ACCOUNT_ID || ''
    this.baseUrl = 'https://api.calltrackingmetrics.com/api/v1'
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessKey || !this.secretKey || !this.accountId) {
      throw new Error('CTM credentials not configured')
    }

    const url = `${this.baseUrl}${endpoint}`
    const auth = Buffer.from(`${this.accessKey}:${this.secretKey}`).toString('base64')

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CTM API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async getAccounts(): Promise<{ accounts?: CTMAccount[] }> {
    return this.makeRequest<{ accounts?: CTMAccount[] }>('/accounts')
  }

  async createAccount(name: string, timezoneHint: string = 'America/Los_Angeles'): Promise<{ status: string; id: number; name: string }> {
    return this.makeRequest<{ status: string; id: number; name: string }>('/accounts', {
      method: 'POST',
      body: JSON.stringify({
        account: { name, timezone_hint: timezoneHint },
        billing_type: 'existing'
      }),
    })
  }

  async getCalls(params: GetCallsParams = {}): Promise<Call[]> {
    const { limit = 100, hours = 24, status, sourceId, agentId } = params
    
    const callsPerRequest = 10
    const pagesNeeded = Math.ceil(limit / callsPerRequest)
    
    let allCalls: Call[] = []
    
    for (let page = 1; page <= pagesNeeded && allCalls.length < limit; page++) {
      let endpoint = `/accounts/${this.accountId}/calls.json?limit=${callsPerRequest}&hours=${hours}&page=${page}`
      if (status) endpoint += `&status=${status}`
      if (sourceId) endpoint += `&source_id=${sourceId}`
      if (agentId) endpoint += `&agent_id=${agentId}`

      const data = await this.makeRequest<{ calls?: CTMCall[] }>(endpoint)
      
      if (!data.calls || data.calls.length === 0) break

      const transformedCalls = data.calls.map((call: CTMCall) => this.transformCall(call))
      
      if (agentId) {
        allCalls.push(...transformedCalls.filter(c => c.agent?.id === agentId))
      } else {
        allCalls.push(...transformedCalls)
      }
    }

    return allCalls.slice(0, limit)
  }

  async getCall(callId: string): Promise<Call | null> {
    try {
      const data = await this.makeRequest<CTMCall>(
        `/accounts/${this.accountId}/calls/${callId}.json`
      )
      return data ? this.transformCall(data) : null
    } catch {
      return null
    }
  }

  async getCallTranscript(callId: string): Promise<string> {
    try {
      const data = await this.makeRequest<{ transcript?: string }>(
        `/accounts/${this.accountId}/calls/${callId}/transcript`
      )
      return data.transcript || ''
    } catch {
      return ''
    }
  }

  async getActiveCalls(): Promise<Call[]> {
    return this.getCalls({ status: 'in progress' })
  }

  async getNumbers(): Promise<{ numbers?: CTMNumber[] }> {
    return this.makeRequest<{ numbers?: CTMNumber[] }>(
      `/accounts/${this.accountId}/numbers.json`
    )
  }

  async searchNumbers(params: SearchNumbersParams): Promise<{ numbers?: CTMNumber[] }> {
    const queryParams = new URLSearchParams()
    if (params.country) queryParams.set('country', params.country)
    if (params.searchby) queryParams.set('searchby', params.searchby)
    if (params.areacode) queryParams.set('areacode', params.areacode)
    if (params.address) queryParams.set('address', params.address)
    if (params.pattern) queryParams.set('pattern', params.pattern)

    return this.makeRequest<{ numbers?: CTMNumber[] }>(
      `/accounts/${this.accountId}/numbers/search.json?${queryParams.toString()}`
    )
  }

  async purchaseNumber(phoneNumber: string, test: boolean = true): Promise<{ status: string; number?: CTMNumber }> {
    return this.makeRequest<{ status: string; number?: CTMNumber }>(
      `/accounts/${this.accountId}/numbers`,
      {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneNumber, test }),
      }
    )
  }

  async getNumberDetails(tpnId: string): Promise<{ number?: CTMNumber }> {
    return this.makeRequest<{ number?: CTMNumber }>(
      `/accounts/${this.accountId}/numbers/${tpnId}`
    )
  }

  async updateNumberRoute(tpnId: string, dialRoute: string, numbers?: string[], countryCodes?: string[]): Promise<{ status: string }> {
    const data: Record<string, unknown> = { dial_route: dialRoute }
    if (numbers) data.numbers = numbers
    if (countryCodes) data.country_codes = countryCodes

    return this.makeRequest<{ status: string }>(
      `/accounts/${this.accountId}/numbers/${tpnId}/update_number`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  async getReceivingNumbers(): Promise<{ receiving_numbers?: CTMReceivingNumber[] }> {
    return this.makeRequest<{ receiving_numbers?: CTMReceivingNumber[] }>(
      `/accounts/${this.accountId}/receiving_numbers`
    )
  }

  async createReceivingNumber(number: string, name: string): Promise<{ status: string; receiving_number?: CTMReceivingNumber }> {
    return this.makeRequest<{ status: string; receiving_number?: CTMReceivingNumber }>(
      `/accounts/${this.accountId}/receiving_numbers`,
      {
        method: 'POST',
        body: JSON.stringify({ number, name }),
      }
    )
  }

  async updateReceivingNumber(rpnId: string, name: string): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(
      `/accounts/${this.accountId}/receiving_numbers/${rpnId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }
    )
  }

  async getSources(): Promise<{ sources?: CTMSource[] }> {
    return this.makeRequest<{ sources?: CTMSource[] }>(
      `/accounts/${this.accountId}/sources`
    )
  }

  async createSource(data: {
    name: string
    online?: string
    referring_url?: string
    landing_url?: string
    position?: string
  }): Promise<{ status: string; source?: CTMSource }> {
    return this.makeRequest<{ status: string; source?: CTMSource }>(
      `/accounts/${this.accountId}/sources`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  }

  async assignNumberToSource(tsoId: string, tpnId: string): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(
      `/accounts/${this.accountId}/sources/${tsoId}/numbers/${tpnId}/add`,
      { method: 'POST' }
    )
  }

  async getSchedules(): Promise<{ schedules?: CTMSchedule[] }> {
    return this.makeRequest<{ schedules?: CTMSchedule[] }>(
      `/accounts/${this.accountId}/schedules`
    )
  }

  async createSchedule(schedule: {
    name: string
    times?: Array<{
      start_time: string
      days: Record<string, boolean>
      end_time: string
      position: string
    }>
    timezone?: string
  }): Promise<{ status: string; schedule?: CTMSchedule }> {
    return this.makeRequest<{ status: string; schedule?: CTMSchedule }>(
      `/accounts/${this.accountId}/schedules`,
      {
        method: 'POST',
        body: JSON.stringify({ schedule }),
      }
    )
  }

  async updateSchedule(schId: string, schedule: { name?: string }): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(
      `/accounts/${this.accountId}/schedules/${schId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ schedule }),
      }
    )
  }

  async getVoiceMenus(): Promise<{ voice_menus?: CTMVoiceMenu[] }> {
    return this.makeRequest<{ voice_menus?: CTMVoiceMenu[] }>(
      `/accounts/${this.accountId}/voice_menus`
    )
  }

  async createVoiceMenu(voiceMenu: {
    name: string
    play_message?: string
    input_maxkeys?: string
    input_timeout?: string
    prompt_retries?: string
    items?: Array<{
      keypress: string
      voice_action_type: string
      dial_number_id?: string
      next_voice_menu_id?: string
    }>
  }): Promise<{ status: string; voice_menu?: CTMVoiceMenu }> {
    return this.makeRequest<{ status: string; voice_menu?: CTMVoiceMenu }>(
      `/accounts/${this.accountId}/voice_menus`,
      {
        method: 'POST',
        body: JSON.stringify({ voice_menu: voiceMenu }),
      }
    )
  }

  async updateVoiceMenu(vomId: string, voiceMenu: { name?: string }): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(
      `/accounts/${this.accountId}/voice_menus/${vomId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ voice_menu: voiceMenu }),
      }
    )
  }

  async setNumberDialRoute(tpnId: string, dialRoute: string, voiceMenuId?: string): Promise<{ status: string }> {
    const data: Record<string, unknown> = {
      virtual_phone_number: { dial_route: dialRoute }
    }
    if (voiceMenuId) {
      (data.virtual_phone_number as Record<string, unknown>).voice_menu_id = voiceMenuId
    }

    return this.makeRequest<{ status: string }>(
      `/accounts/${this.accountId}/numbers/${tpnId}/dial_routes`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    )
  }

  private transformCall(ctmCall: CTMCall): Call {
    const sale = (ctmCall as unknown as Record<string, unknown>).sale as { score?: number; name?: string } | undefined
    const activityAnalysis = (ctmCall as unknown as Record<string, unknown>).activity_analysis as Record<string, string> | undefined

    return {
      id: String(ctmCall.id),
      phone: ctmCall.phone_number || ctmCall.caller_number || ctmCall.caller_id || ctmCall.did_number || '',
      direction: (ctmCall.direction as 'inbound' | 'outbound') || 'inbound',
      duration: ctmCall.duration || ctmCall.talk_time || 0,
      status: this.mapStatus(ctmCall.status),
      timestamp: ctmCall.started_at ? new Date(ctmCall.started_at) : new Date(),
      name: ctmCall.name,
      callerNumber: ctmCall.caller_number || ctmCall.caller_id,
      trackingNumber: ctmCall.tracking_number,
      trackingLabel: ctmCall.tracking_label,
      source: ctmCall.source,
      sourceId: ctmCall.source_id ? String(ctmCall.source_id) : undefined,
      accountId: ctmCall.account_id ? String(ctmCall.account_id) : undefined,
      agent: ctmCall.agent,
      recordingUrl: ctmCall.audio || ctmCall.recording_url,
      transcript: ctmCall.transcript,
      city: ctmCall.city,
      state: ctmCall.state,
      postalCode: ctmCall.postal_code,
      notes: ctmCall.notes,
      talkTime: ctmCall.talk_time,
      waitTime: ctmCall.wait_time,
      ringTime: ctmCall.ring_time,
      score: sale?.score,
      analysis: activityAnalysis ? {
        sentiment: sale?.score && sale.score >= 75 ? 'positive' : sale?.score && sale.score >= 50 ? 'neutral' : 'negative',
        summary: activityAnalysis.general || activityAnalysis.sales || '',
        tags: ctmCall.tag_list || [],
        disposition: sale?.name || '',
      } : undefined,
    }
  }

  private mapStatus(ctmStatus?: string): 'completed' | 'missed' | 'active' {
    if (!ctmStatus) return 'completed'
    const statusMap: Record<string, 'completed' | 'missed' | 'active'> = {
      'completed': 'completed',
      'missed': 'missed',
      'active': 'active',
      'in progress': 'active',
      'voicemail': 'completed',
    }
    return statusMap[ctmStatus.toLowerCase()] || 'completed'
  }

  getStats(calls: Call[]) {
    const totalCalls = calls.length
    const answered = calls.filter(c => c.status === 'completed' || c.status === 'active').length
    const missed = calls.filter(c => c.status === 'missed').length
    const withRecordings = calls.filter(c => c.recordingUrl).length

    return {
      totalCalls,
      answered,
      missed,
      withRecordings,
      avgDuration: totalCalls > 0 
        ? Math.round(calls.reduce((sum, c) => sum + (c.duration || 0), 0) / totalCalls)
        : 0,
    }
  }
}

export function createCTMClient(): CTMClient {
  return new CTMClient()
}
