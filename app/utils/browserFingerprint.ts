import FingerprintJS from '@fingerprintjs/fingerprintjs'

const DEVICE_TYPE = 'h5'
let cached: string | null = null
let loadPromise: ReturnType<typeof FingerprintJS.load> | null = null

/**
 * 获取 Client-Device 请求头值：h5|{浏览器指纹}。
 * 浏览器端使用 FingerprintJS (https://github.com/fingerprintjs/fingerprintjs) 并缓存；服务端返回 h5|server。
 */
export async function getClientDeviceHeaderValue(): Promise<string> {
  if (import.meta.server) {
    return `${DEVICE_TYPE}|server`
  }
  if (cached) {
    return cached
  }
  if (!loadPromise) {
    loadPromise = FingerprintJS.load()
  }
  const fp = await loadPromise
  const result = await fp.get()
  cached = `${DEVICE_TYPE}|${result.visitorId}`
  return cached
}
