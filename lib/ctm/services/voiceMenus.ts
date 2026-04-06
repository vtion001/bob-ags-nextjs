import { CTMClient } from '../client'
import type { CTMVoiceMenu, VoiceMenuItem } from '@/lib/types'

export class VoiceMenusService extends CTMClient {
  async getVoiceMenus(): Promise<{ voice_menus?: CTMVoiceMenu[] }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ voice_menus?: CTMVoiceMenu[] }>(
      `/accounts/${accountId}/voice_menus`
    )
  }

  async createVoiceMenu(voiceMenu: {
    name: string
    play_message?: string
    input_maxkeys?: string
    input_timeout?: string
    prompt_retries?: string
    items?: VoiceMenuItem[]
  }): Promise<{ status: string; voice_menu?: CTMVoiceMenu }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string; voice_menu?: CTMVoiceMenu }>(
      `/accounts/${accountId}/voice_menus`,
      {
        method: 'POST',
        body: JSON.stringify({ voice_menu: voiceMenu }),
      }
    )
  }

  async updateVoiceMenu(vomId: string, voiceMenu: { name?: string }): Promise<{ status: string }> {
    const accountId = this.getAccountId()
    return this.makeRequest<{ status: string }>(
      `/accounts/${accountId}/voice_menus/${vomId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ voice_menu: voiceMenu }),
      }
    )
  }
}

export function createVoiceMenusService(): VoiceMenusService {
  return new VoiceMenusService()
}
