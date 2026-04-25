import { setApiUnauthorizedHandler } from '../utils/fetch'

export default defineNuxtPlugin(() => {
  setApiUnauthorizedHandler(({ status, url }) => {
    console.warn(`[api] unauthorized response: ${status} ${url}`)
  })
})
