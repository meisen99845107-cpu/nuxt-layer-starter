import fetch from './fetch'

import type { FetchOptions } from './fetch'

export class HttpUtil {
    static async post<T>(
        url: string,
        params: Record<string, any> = {},
        server: boolean = false,
        options?: FetchOptions,
    ): Promise<T | null> {
        return await this.request<T>("POST", url, params, server, options);
    }

    // 封装公共的请求方法
    static async request<T>(
        method: "GET" | "POST",
        url: string,
        params: Record<string, any> = {},
        server: boolean,
        options?: FetchOptions,
    ): Promise<T | null> {
        //定时任务不是在页面上下文、也不是SSR渲染请求上下文,而是 Nitro 插件运行时或定时器触发，没有 Pinia
        // const httpFetch = fetch(url,method,params)
        if (server) {
            /**
             * 参数说明
             * key： 传入一个唯一的键值 ,主要为了防止在多个请求出现交叉时的返回数据错乱的问题。 也可以不传，内部会自动生成一个key。
             * handler： 异步任务处理
             * options： 包括 lazy， default， server，pick...
             *
             * options说明:
             * lazy: 是否在页面加载之后再等待执行异步任务，默认为false，表示在页面加载之前会阻塞，直到异步任务执行完。
             * default: 一个工厂方法, 在异步任务还未执行完时，生成一个默认的返回的数据,
             * server: 默认为true, 表示是会在服务器去执行异步任务获取数据
             * pick: 数组类型，表示只从异步任务返回数据之前，选择指定的数据返回。
             * transform: 解析后可用于更改handler函数结果的函数,对返回的数据进一步处理。
             * watch: 监听数据进行更新。
             * immediate: 设置为false时，将阻止请求立即触发。
             */
            const key = `${url}-${method}-${JSON.stringify(params)}`;
            const {data, error} = await useAsyncData(key, () => {
                    return fetch(url, method, params, options);
                },
                {immediate: true, server: true, deep: false}
            );
            if (error.value) throw error.value
            return data.value as T | null
        } else {
            // 注意：不需要包 Promise，可以直接返回 fetch().catch() 结果
            return await fetch(url, method, params, options) as T
        }
    }
}
