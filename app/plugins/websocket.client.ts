import { WebSocketUtil } from '../utils/websocket'

let wsClient: WebSocketUtil | null = null

/**
 * websocket
 * 使用示例
 * const {$ws} = useNuxtApp()
 * onMounted(() => {
 *     $ws.init("","")
 * })
 */
export default defineNuxtPlugin(() => {
    if (import.meta.server) return

    const ws = {
        init(url: string, key: string) {
            if (wsClient) {
                const same = wsClient.options.url === url && wsClient.options.key === key
                if (same) return wsClient
                wsClient.close()
            }
            wsClient = new WebSocketUtil({url, key, reconnectInterval: 5000})
            return wsClient
        },
        close() {
            wsClient?.close()
            wsClient = null
        },
        client() {
            return wsClient
        }
    }
    return {
        provide: {ws: ws}
    }
})
