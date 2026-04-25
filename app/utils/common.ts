/**
 * 获取url参数,基于url
 * @param url
 */
export const parseURL = (url?: string) => {
    // SSR 环境下没有 window；默认取当前请求 URL
    const finalUrl =
        url ??
        (import.meta.client ? window.location.href : useRequestURL().href)
    let args: Record<string, string> = {}
    const query = finalUrl.split('?')[1]
    if (query) {
        query.split('&').forEach(item => {
            const [k, v] = item.split('=')
            args[k] = v
        })
    }
    return args
}

/**
 * 获取url参数,基于框架
 * @param key
 */
export const useQueryParams = <T = string | object>(key?: string): T => {
    const route = useRoute()

    if (!key) {
        return route.query as T
    }

    // 处理数组参数（如 ?ids=1,2,3 或 ?ids[]=1&ids[]=2）
    const value = route.query[key]
    if (Array.isArray(value)) {
        return value as T
    }

    if (typeof value === 'string' && value.includes(',')) {
        return value.split(',') as T
    }

    return value as T
}

export const isEmpty = (value: any) => {
    // 处理 null 或 undefined
    if (value == null) return true;

    // 处理空字符串
    if (typeof value === "string") return value === "";

    // // 处理空数组 //LIST一般是循环使用,所以无需判断
    // if (Array.isArray(value)) return value.length === 0;

    // 处理空对象
    if (typeof value === "object") {
        return Object.keys(value).length === 0;
    }

    // 其他类型（数字、布尔值等视为非空）
    return false;
}

export const reverseYn = (value: string) => {
    if (value === 'y') {
        return 'n'
    } else {
        return 'y'
    }
}

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 * @param arrayBuffer - ArrayBuffer 对象
 * @returns {string} 转换后的 Base64 字符串
 */
export const arraybufferToBase64 = (arrayBuffer: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (import.meta.client) {
            const reader = new FileReader();
            const blob = new Blob([arrayBuffer]);
            reader.readAsDataURL(blob);
            reader.onload = (event: ProgressEvent<FileReader>) => {
                const dataUrl = event.target?.result;
                if (typeof dataUrl === "string") {
                    const base64 = dataUrl.split(",")[1];
                    resolve(base64);
                } else {
                    reject(new Error("Failed to convert ArrayBuffer to Base64"));
                }
            };
            reader.onerror = (error) => {
                reject(error);
            };
        } else {
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString("base64");
            resolve(base64);
        }
    });
};

/**
 * 获取域名
 */
export const getServerHost = () => {
    ///https://nuxt.com.cn/docs/api/composables/use-head
    const url = useRequestURL()
    const headers = useRequestHeaders()

    // console.log(url);
    // console.log(headers);

    const cloudflareProto = headers['x-forwarded-proto']
    const awsProto = headers['cloudfront-forwarded-proto']

    let protocol = url.protocol;
    if (cloudflareProto === 'https' || awsProto === 'https' || headers['x-forwarded-ssl'] === 'on') {
        protocol = 'https:'
    }
    return protocol + '//' + url.host;
}

export interface ParsedScript {
    src?: string
    async?: boolean
    defer?: boolean
    code?: string
}
export function parseScriptsFromHtml(html: string): ParsedScript[] {
    const scripts: ParsedScript[] = []

    // 提取所有 <script ...>...</script>
    const reScript = /<script([^>]*)>([\s\S]*?)<\/script>/gi
    let m
    while ((m = reScript.exec(html))) {
        const attr = m[1] || ''
        const code = (m[2] || '').trim()

        const srcMatch = /src=["']([^"']+)["']/i.exec(attr)
        const hasAsync = /\basync\b/i.test(attr)
        const hasDefer = /\bdefer\b/i.test(attr)

        if (srcMatch) {
            scripts.push({
                src: srcMatch[1],
                async: hasAsync,
                defer: hasDefer
            })
        } else if (code) {
            scripts.push({
                code: code
                    .replace(/\uFEFF/g, '')
                    .replace(/\u2028|\u2029/g, '\n')
                    .replace(/<\/script>/gi, '<\\/script>')
            })
        }
    }

    return scripts
}


export function sleep(time:number = 800) {
    return new Promise(resolve => setTimeout(resolve, time))
}