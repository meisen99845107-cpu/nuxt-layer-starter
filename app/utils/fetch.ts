import { $fetch } from 'ofetch'
import { useAuthStore } from '../store/auth'
import { getClientDeviceHeaderValue } from './browserFingerprint'
import {
  decryptResponseEnvelope,
  encryptEnvelope,
  isResponseEnvelopePayload,
  shouldBypassEncryption,
  type EnvelopeCryptoContext,
} from './envelopeEncrypt'

interface RequestEncryptionConfig {
  enabled: boolean
  algorithm: string
  publicKeyPem: string
}

interface InternalFetchOptions extends FetchOptions {
  _requestEncrypted?: boolean
  _encryptionContext?: EnvelopeCryptoContext | null
}

export interface FetchOptions {
  headers?: Record<string, string>
  fullResponse?: boolean
}

type ApiErrorHandler = (payload: {
  status: number
  data: unknown
  url: string
}) => void | Promise<void>

let requestEncryptionConfigCache: RequestEncryptionConfig | null = null
let requestEncryptionConfigPromise: Promise<RequestEncryptionConfig> | null = null
let requestEncryptionSupportWarned = false
let unauthorizedHandler: ApiErrorHandler | null = null
let responseErrorHandler: ApiErrorHandler | null = null

const FULL_RESPONSE_HEADER = 'X-Response-Format'
const FULL_RESPONSE_VALUE = 'wrapped'

export function setApiUnauthorizedHandler(handler: ApiErrorHandler | null) {
  unauthorizedHandler = handler
}

export function setApiResponseErrorHandler(handler: ApiErrorHandler | null) {
  responseErrorHandler = handler
}

function isEncryptionEnabled(): boolean {
  const v = import.meta.env.VITE_API_ENCRYPTION_ENABLED as string | undefined
  if (v === undefined || v === '') return true
  const lower = String(v).toLowerCase()
  return lower !== 'false' && lower !== '0'
}

function hasRequestEncryptionSupport(): boolean {
  return Boolean(globalThis.crypto?.subtle)
}

function createRequestEncryptionSupportError(): Error {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'unknown'
  const secure = typeof window !== 'undefined' ? window.isSecureContext : false
  return new Error(
    '[request-encryption] Web Crypto API is unavailable in the current context. ' +
    `origin=${currentOrigin}, isSecureContext=${String(secure)}. ` +
    'Encrypted requests cannot be sent. Open the app with https or http://localhost during development.',
  )
}

function warnRequestEncryptionSupportOnce() {
  if (import.meta.client && !requestEncryptionSupportWarned) {
    requestEncryptionSupportWarned = true
    console.error(createRequestEncryptionSupportError())
  }
}

function getApiBaseUrl(): string {
  return import.meta.server
    ? `${import.meta.env.VITE_API_URL ?? ''}${import.meta.env.VITE_API_PREFIX ?? ''}`
    : import.meta.env.VITE_API_PREFIX ?? ''
}

function getApiVersion(): string {
  return import.meta.env.VITE_API_VERSION ?? ''
}

function normalizeRequestUri(url: string): string {
  const apiPrefix = import.meta.env.VITE_API_PREFIX ?? '/api'
  const requestUriRaw = `${apiPrefix}${url.startsWith('/') ? url : `/${url}`}`
  return requestUriRaw.split('?')[0] ?? requestUriRaw
}

async function buildRequestEncryptionHeaders(apiVersion: string): Promise<Record<string, string>> {
  const clientDevice = await getClientDeviceHeaderValue()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Client-Device': clientDevice,
    deviceType: 'web',
  }
  if (apiVersion) headers.version = apiVersion
  if (import.meta.client && typeof navigator !== 'undefined' && navigator.language) {
    headers['Accept-Language'] = navigator.language
  }
  return headers
}

async function fetchRequestEncryptionConfig(baseUrl: string, apiVersion: string): Promise<RequestEncryptionConfig> {
  const headers = await buildRequestEncryptionHeaders(apiVersion)
  const res = await $fetch(`${baseUrl}/system/requestEncryption`, {
    method: 'GET',
    headers,
    responseType: 'json',
    cache: 'no-store',
    timeout: 1000 * 10,
  }) as Record<string, any>
  const data = (res?.data ?? res) as Record<string, any>
  return {
    enabled: Boolean(data?.enabled),
    algorithm: String(data?.algorithm ?? ''),
    publicKeyPem: String(data?.public_key_pem ?? ''),
  }
}

export async function ensureRequestEncryptionConfig(): Promise<RequestEncryptionConfig> {
  if (!hasRequestEncryptionSupport()) {
    warnRequestEncryptionSupportOnce()
    return Promise.reject(createRequestEncryptionSupportError())
  }
  if (requestEncryptionConfigCache) return requestEncryptionConfigCache
  if (requestEncryptionConfigPromise) return requestEncryptionConfigPromise

  requestEncryptionConfigPromise = fetchRequestEncryptionConfig(getApiBaseUrl(), getApiVersion())
    .then((config) => {
      requestEncryptionConfigCache = config
      return config
    })
    .finally(() => {
      requestEncryptionConfigPromise = null
    })

  return requestEncryptionConfigPromise
}

export function clearRequestEncryptionConfigCache() {
  requestEncryptionConfigCache = null
  requestEncryptionConfigPromise = null
}

async function decryptApiResponseIfNeeded(data: unknown, options: InternalFetchOptions): Promise<unknown> {
  if (!options._requestEncrypted || !options._encryptionContext) return data
  if (!isResponseEnvelopePayload(data)) return data
  return await decryptResponseEnvelope({
    envelope: data,
    context: options._encryptionContext,
  })
}

export const API_NO_TOKEN_PATHS_DEFAULT = [
  '/auth/login',
  '/auth/register',
  '/auth/',
]

function getNoTokenPaths(): string[] {
  const env = import.meta.env.VITE_API_NO_TOKEN_PATHS as string | undefined
  if (env && String(env).trim()) return String(env).split(',').map((s: string) => s.trim()).filter(Boolean)
  return API_NO_TOKEN_PATHS_DEFAULT
}

function needAccessToken(path: string): boolean {
  const noTokenPaths = getNoTokenPaths()
  const normalized = path.replace(/^\s+|\s+$/g, '')
  const isNoToken = noTokenPaths.some((p) => {
    if (p.endsWith('/')) return normalized === p.slice(0, -1) || normalized.startsWith(p)
    return normalized === p || normalized.startsWith(`${p}/`)
  })
  return !isNoToken
}

function usesRequestBody(method: string): boolean {
  const upper = method.toUpperCase()
  return upper !== 'GET' && upper !== 'HEAD' && upper !== 'OPTIONS'
}

export const fetch = async (
  url: string,
  method: string,
  params: Record<string, any> = {},
  options: FetchOptions = {},
) => {
  const baseUrl = getApiBaseUrl()
  const apiVersion = getApiVersion()
  const fullPath = baseUrl + url
  const requestUri = normalizeRequestUri(url)
  const clientDevice = await getClientDeviceHeaderValue()
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    version: apiVersion,
    deviceType: 'web',
    'Client-Device': clientDevice,
    ...options.headers,
  }
  if (options.fullResponse) {
    baseHeaders[FULL_RESPONSE_HEADER] = FULL_RESPONSE_VALUE
  }
  if (needAccessToken(url) && (import.meta.client || import.meta.env.SSR)) {
    const token = useAuthStore().getToken()
    if (token) baseHeaders['Access-Token'] = token
  }

  return $fetch(`${baseUrl}${url}`, {
    method,
    headers: baseHeaders,
    responseType: 'json',
    body: usesRequestBody(method) ? params : undefined,
    params: usesRequestBody(method) ? undefined : params,
    timeout: 1000 * 10,
    async onRequest(ctx) {
      const internalOptions = ctx.options as unknown as InternalFetchOptions
      internalOptions._requestEncrypted = false
      internalOptions._encryptionContext = null
      const reqMethod = (ctx.options.method ?? 'GET').toUpperCase()
      const shouldEncryptRequest = isEncryptionEnabled() && !shouldBypassEncryption(reqMethod, requestUri)
      if (shouldEncryptRequest && !hasRequestEncryptionSupport()) {
        warnRequestEncryptionSupportOnce()
        return Promise.reject(createRequestEncryptionSupportError())
      }
      if (!shouldEncryptRequest) {
        if (usesRequestBody(reqMethod)) ctx.options.body = params
        else ctx.options.params = params
        if (import.meta.client || import.meta.env.SSR) {
          console.log(fullPath.replace(baseUrl, '') || url, ' ==request==> ', ctx.options.body ?? ctx.options.params)
        }
        return
      }

      const encryptionConfig = await ensureRequestEncryptionConfig()
      if (!encryptionConfig.enabled) {
        if (usesRequestBody(reqMethod)) ctx.options.body = params
        else ctx.options.params = params
        if (import.meta.client || import.meta.env.SSR) {
          console.log(fullPath.replace(baseUrl, '') || url, ' ==request==> ', '[plain:encryption-disabled-by-server]', ctx.options.body ?? ctx.options.params)
        }
        return
      }
      if (!encryptionConfig.publicKeyPem) {
        return Promise.reject(new Error('/system/requestEncryption did not return public_key_pem'))
      }
      const { envelope, context } = await encryptEnvelope({
        method: reqMethod,
        path: requestUri,
        data: params,
        serverPublicKeyPem: encryptionConfig.publicKeyPem,
      })
      if (usesRequestBody(reqMethod)) ctx.options.body = envelope
      internalOptions._requestEncrypted = true
      internalOptions._encryptionContext = context
      if (import.meta.client || import.meta.env.SSR) {
        console.log(fullPath.replace(baseUrl, '') || url, ' ==request==> ', '[encrypted-data]', params)
        console.log(fullPath.replace(baseUrl, '') || url, ' ==request==> ', '[envelope]', `${envelope.nonce.slice(0, 8)}...`)
      }
    },
    onRequestError(ctx) {
      console.error(ctx.error)
      return Promise.reject(ctx.error)
    },
    async onResponse(ctx) {
      const status = ctx.response.status
      if (status === 200) {
        const decryptedData = await decryptApiResponseIfNeeded(ctx.response._data, ctx.options as unknown as InternalFetchOptions)
        const obj = decryptedData as Record<string, unknown> | null | undefined
        ctx.response._data = options.fullResponse
          ? obj
          : obj != null && 'data' in obj && obj.data !== undefined ? obj.data : obj
        if (import.meta.client || import.meta.env.SSR) {
          console.log(fullPath.replace(baseUrl, '') || url, ' <==response== ', ctx.response._data)
        }
        return ctx.response._data
      }

      ctx.response._data = await decryptApiResponseIfNeeded(ctx.response._data, ctx.options as unknown as InternalFetchOptions)
      const payload = { status, data: ctx.response._data, url }
      if (status === 401 && import.meta.client) {
        useAuthStore().clearToken()
        await unauthorizedHandler?.(payload)
      } else {
        await responseErrorHandler?.(payload)
      }
      return Promise.reject(ctx.response._data)
    },
  })
}

export default fetch
