import { AesUtil } from './aes'

const CACHE_PREFIX = import.meta.env.VITE_CACHE_PREFIX || 'nuxt_layer_'
// 未配置时使用默认 key，保证 token 等 cookie 写入/读出一致，刷新后能恢复登录态
const CACHE_AES_KEY = import.meta.env.VITE_CACHE_AES_KEY || 'nuxt_layer_cache_aes'

export class CacheUtil {
    static getLocal = (key: string): any | null => {
        if (import.meta.server) {
            return;
        }
        const data = window.localStorage.getItem(`${CACHE_PREFIX}${key}`);
        return data ? AesUtil.decryptData(data, CACHE_AES_KEY) : null;
    }
    static setLocal = (key: string, value: any): void => {
        if (import.meta.server) {
            return;
        }
        if (value !== undefined && value !== null) {
            window.localStorage.setItem(`${CACHE_PREFIX}${key}`, AesUtil.encryptData(value, CACHE_AES_KEY));
        }
    }
    static removeLocal = (key: string): void => {
        if (import.meta.server) {
            return;
        }
        window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    }
    static clearLocal = (): void => {
        if (import.meta.server) {
            return;
        }
        window.localStorage.clear();
    }


    static getSession = (key: string): any | null => {
        if (import.meta.server) {
            return;
        }
        const data = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
        return data ? AesUtil.decryptData(data, CACHE_AES_KEY) : null;
    }
    static setSession = (key: string, value: any): void => {
        if (import.meta.server) {
            return;
        }
        if (value !== undefined && value !== null) {
            window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, AesUtil.encryptData(value, CACHE_AES_KEY));
        }
    }
    static removeSession = (key: string): void => {
        if (import.meta.server) {
            return;
        }
        window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
    }
    static clearSession = (): void => {
        if (import.meta.server) {
            return;
        }
        window.sessionStorage.clear();
    }


    static getCookie = (key: string): any | null => {
        const data = useCookie(`${CACHE_PREFIX}${key}`).value
        return data ? AesUtil.decryptData(data, CACHE_AES_KEY) : null;
    }
    static setCookie = (key: string, value: any): void => {
        if (value !== undefined && value !== null) {
            useCookie(`${CACHE_PREFIX}${key}`).value = AesUtil.encryptData(value, CACHE_AES_KEY)
        }
    }
    static delCookie = (key: string): void => {
        const cookie = useCookie(`${CACHE_PREFIX}${key}`);
        cookie.value = null;
    }
}
