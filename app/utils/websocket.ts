import {AesUtil} from './aes'

export interface WebSocketOptions {
    url: string
    key: string
    reconnectInterval?: number
}

export class WebSocketUtil {
    public options: WebSocketOptions
    private ws: WebSocket | null = null
    private reconnectTimeId: ReturnType<typeof setTimeout> | null = null
    private heartBeatTimer: ReturnType<typeof setInterval> | null = null

    private onOpenListeners: ((event: Event) => void)[] = []
    private onCloseListeners: ((event: CloseEvent) => void)[] = []
    private onErrorListeners: ((event: Event) => void)[] = []
    private onMessageListeners: ((data: string) => void)[] = []
    private isClosed = false;

    constructor(options: WebSocketOptions) {
        this.options = options
        this.connect()
    }

    public send(data: string | Buffer) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data)
        } else {
            console.warn('WebSocket not connected. Message not sent.')
        }
    }

    public close() {
        this.isClosed = true
        if (this.reconnectTimeId) {
            clearTimeout(this.reconnectTimeId)
            this.reconnectTimeId = null
        }
        this.stopHeartBeat()
        this.ws?.close()
    }

    public isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }

    public addOnMessageListener(fn: (data: any) => void) {
        this.onMessageListeners.push(fn)
    }

    public removeOnMessageListener(fn: (data: any) => void) {
        this.onMessageListeners = this.onMessageListeners.filter(cb => cb !== fn)
    }

    public addOnOpenListener(fn: (event: Event) => void) {
        this.onOpenListeners.push(fn)
    }
    public removeOnOpenListener(fn: (event: Event) => void) {
        this.onOpenListeners = this.onOpenListeners.filter(cb => cb !== fn)
    }

    public addOnCloseListener(fn: (event: CloseEvent) => void) {
        this.onCloseListeners.push(fn)
    }

    public removeOnCloseListener(fn: (event: CloseEvent) => void) {
        this.onCloseListeners = this.onCloseListeners.filter(cb => cb !== fn)
    }

    public addOnErrorListener(fn: (event: Event) => void) {
        this.onErrorListeners.push(fn)
    }

    public removeOnErrorListener(fn: (event: Event) => void) {
        this.onErrorListeners = this.onErrorListeners.filter(cb => cb !== fn)
    }

    private connect = () => {
        if ('WebSocket' in window) {
            this.ws = new WebSocket(this.options.url)
        } else {
            console.error('你的浏览器不支持 WebSocket')
            return;
        }

        this.ws.onopen = (event) => {
            this.onOpenListeners.forEach(cb => cb(event))
            this.startHeartBeat()
        }

        this.ws.onclose = (event) => {
            this.onCloseListeners.forEach(cb => cb(event))
            this.stopHeartBeat()
            this.reconnect()
        }

        this.ws.onerror = (event) => {
            this.onErrorListeners.forEach(cb => cb(event))
            this.stopHeartBeat()
            this.reconnect()
        }

        this.ws.onmessage = async (event) => {
            let data: string

            if (event.data instanceof Blob) {
                data = await event.data.text()
                if (data == 'pong') {
                    return;
                }
                data = AesUtil.decryptHex(data, this.options.key);
                console.log('[WebSocket] 收到消息: ', data)
            } else {
                data = event.data
            }
            this.onMessageListeners.forEach(cb => cb(data))
        }
    }

    private reconnect = () => {
        if (this.reconnectTimeId || this.isClosed) return
        const interval = this.options.reconnectInterval || 3000
        this.reconnectTimeId = setTimeout(() => {
            this.connect()
            this.reconnectTimeId = null
        }, interval)
    }

    private startHeartBeat = () => {
        this.stopHeartBeat()
        this.heartBeatTimer = setInterval(() => {
            this.send('ping')
        }, 5 * 1000)
    }

    private stopHeartBeat = () => {
        if (this.heartBeatTimer) {
            clearInterval(this.heartBeatTimer)
            this.heartBeatTimer = null
        }
    }
}
