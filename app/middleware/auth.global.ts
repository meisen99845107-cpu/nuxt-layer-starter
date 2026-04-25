import { useAuthStore } from '../store/auth'

function getProtectedRoutes(): string[] {
  const env = import.meta.env.VITE_PROTECTED_ROUTES as string | undefined
  if (!env || !String(env).trim()) return []
  return String(env).split(',').map((item) => item.trim()).filter(Boolean)
}

export default defineNuxtRouteMiddleware((to) => {
  const protectedRoutes = getProtectedRoutes()
  if (protectedRoutes.length === 0) return

  const shouldProtect = protectedRoutes.some((prefix) => to.path.startsWith(prefix))
  if (!shouldProtect || useAuthStore().hasLogin()) return

  const loginPath = import.meta.env.VITE_LOGIN_PATH || '/login'
  const redirect = `?redirect=${encodeURIComponent(to.fullPath)}`
  return navigateTo(`${loginPath}${redirect}`)
})
