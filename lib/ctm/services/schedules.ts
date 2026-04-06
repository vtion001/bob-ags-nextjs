import { CTMClient } from '../client'
import type { CTMSchedule, ScheduleTime } from '@/lib/types'

export class SchedulesService extends CTMClient {
  async getSchedules(): Promise<{ schedules?: CTMSchedule[] }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ schedules?: CTMSchedule[] }>(
      `/accounts/${accountId}/schedules`
    )
  }

  async createSchedule(schedule: {
    name: string
    times?: ScheduleTime[]
    timezone?: string
  }): Promise<{ status: string; schedule?: CTMSchedule }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string; schedule?: CTMSchedule }>(
      `/accounts/${accountId}/schedules`,
      {
        method: 'POST',
        body: JSON.stringify({ schedule }),
      }
    )
  }

  async updateSchedule(schId: string, schedule: { name?: string }): Promise<{ status: string }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string }>(
      `/accounts/${accountId}/schedules/${schId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ schedule }),
      }
    )
  }
}

export function createSchedulesService(): SchedulesService {
  return new SchedulesService()
}
