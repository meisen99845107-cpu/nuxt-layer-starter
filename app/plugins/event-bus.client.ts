import mitt from 'mitt'

/**
 * 跨组件事件共享
 * https://www.npmjs.com/package/mitt
 */
export default defineNuxtPlugin((nuxtApp) => {
    const bus = mitt()
    return {
        provide: {bus: bus}
    }
})
