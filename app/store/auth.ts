import { defineStore } from 'pinia'
import { CacheUtil } from '../utils/cache'

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'token'

export interface TokenInfo {
  access_token: string
  refresh_token?: string
}

export const useAuthStore = defineStore('base-auth', {
  state: () => ({
    accessToken: '',
    refreshToken: '',
  }),
  actions: {
    setToken(tokenInfo: TokenInfo) {
      this.accessToken = tokenInfo.access_token ?? ''
      this.refreshToken = tokenInfo.refresh_token ?? ''
      if (import.meta.client) {
        CacheUtil.setCookie(TOKEN_KEY, JSON.stringify({
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
        }))
      }
      return true
    },
    getToken(): string {
      if (import.meta.client && !this.accessToken) {
        this.restoreTokenFromCookie()
      }
      return this.accessToken
    },
    getRefreshToken(): string {
      if (import.meta.client && !this.refreshToken) {
        this.restoreTokenFromCookie()
      }
      return this.refreshToken
    },
    restoreTokenFromCookie() {
      try {
        const raw = CacheUtil.getCookie(TOKEN_KEY)
        if (raw === undefined || raw === null || raw === '') return
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (data && typeof data === 'object' && data.access_token) {
          this.accessToken = data.access_token
          this.refreshToken = data.refresh_token ?? ''
        }
      } catch {
        // Ignore invalid persisted token data.
      }
    },
    clearToken() {
      this.accessToken = ''
      this.refreshToken = ''
      if (import.meta.client) {
        CacheUtil.delCookie(TOKEN_KEY)
      }
    },
    hasLogin(): boolean {
      if (import.meta.client && !this.accessToken) {
        this.restoreTokenFromCookie()
      }
      return Boolean(this.accessToken)
    },
  },
})
