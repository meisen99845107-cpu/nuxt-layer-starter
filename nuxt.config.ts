import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

const requireFromConsumer = createRequire(resolve(process.cwd(), 'package.json'))
const { visualizer } = requireFromConsumer('rollup-plugin-visualizer') as typeof import('rollup-plugin-visualizer')
const Components = requireFromConsumer('unplugin-vue-components/vite') as typeof import('unplugin-vue-components/vite').default
const { VantResolver } = requireFromConsumer('unplugin-vue-components/resolvers') as typeof import('unplugin-vue-components/resolvers')
const tailwindcss = requireFromConsumer('@tailwindcss/vite').default as typeof import('@tailwindcss/vite').default

const devHost = process.env.NUXT_DEV_HOST || process.env.VITE_DEV_HOST || 'localhost'
const devPort = Number(process.env.NUXT_DEV_PORT || process.env.VITE_DEV_PORT || 3000)
const devHttpsEnabled = ['1', 'true'].includes(String(process.env.NUXT_DEV_HTTPS || process.env.VITE_DEV_HTTPS || '').toLowerCase())
const devHttpsKeyPath = resolve(process.cwd(), process.env.NUXT_DEV_HTTPS_KEY || process.env.VITE_DEV_HTTPS_KEY || '.cert/dev.key')
const devHttpsCertPath = resolve(process.cwd(), process.env.NUXT_DEV_HTTPS_CERT || process.env.VITE_DEV_HTTPS_CERT || '.cert/dev.crt')
const devHttpsConfigured = devHttpsEnabled && existsSync(devHttpsKeyPath) && existsSync(devHttpsCertPath)
const buildVisualizerEnabled = ['1', 'true'].includes(String(process.env.NUXT_BUILD_VISUALIZER || process.env.VITE_BUILD_VISUALIZER || '').toLowerCase())
const buildObfuscateEnabled = ['1', 'true'].includes(String(process.env.NUXT_BUILD_OBFUSCATE || process.env.VITE_BUILD_OBFUSCATE || '').toLowerCase())

const devHttpsOptions = devHttpsConfigured
  ? {
      key: readFileSync(devHttpsKeyPath),
      cert: readFileSync(devHttpsCertPath),
    }
  : undefined

const devServerHttpsOptions = devHttpsConfigured
  ? {
      key: devHttpsKeyPath,
      cert: devHttpsCertPath,
    }
  : undefined

if (devHttpsEnabled && !devHttpsConfigured) {
  console.warn(
    `[dev-server] HTTPS is enabled but certificate files were not found. ` +
    `Expected key=${devHttpsKeyPath}, cert=${devHttpsCertPath}. Falling back to HTTP.`,
  )
}

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  experimental: {
    serverAppConfig: false,
  },
  vite: {
    server: {
      hmr: false,
      host: devHost,
      port: devPort,
      https: devHttpsOptions,
    },
    build: {
      rollupOptions: {
        plugins: buildVisualizerEnabled
          ? [
              visualizer({
                open: false,
                filename: 'stats.html',
                gzipSize: true,
                brotliSize: true,
              }),
            ]
          : [],
      },
      chunkSizeWarningLimit: 1024,
      terserOptions: {
        compress: {
          dead_code: false,
          drop_console: false,
          drop_debugger: true,
          passes: 1,
        },
        format: {
          comments: true,
        },
        mangle: true,
      },
      assetsInlineLimit: 0,
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/config/variable.scss" as *;',
        },
      },
    },
    plugins: [
      tailwindcss(),
      Components({
        dts: true,
        resolvers: [VantResolver({ importStyle: 'css' })],
      }),
    ],
  },
  css: [
    'vant/lib/index.css',
    '@/assets/styles/tailwind.css',
    '@/assets/styles/index.scss',
  ],
  build: {
    transpile: ['vant'],
  },
  hooks: buildObfuscateEnabled
    ? {
        'nitro:build:public-assets': async (nitro) => {
          const { obfuscatePublicAssets } = await import('./app/hooks/obfuscate')
          return obfuscatePublicAssets(nitro)
        },
      }
    : {},
  app: {
    head: {
      htmlAttrs: {
        lang: 'zh',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1,maximum-scale=1.0,user-scalable=0,viewport-fit=cover' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'referrer', content: 'no-referrer' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
      noscript: [],
    },
  },
  modules: ['@nuxt/image', '@nuxtjs/i18n', '@element-plus/nuxt', 'nuxt-swiper', '@pinia/nuxt'],
  components: {
    dirs: ['~/components'],
  },
  nitro: {
    routeRules: {
      '/api/**': {
        proxy: `${process.env.VITE_API_URL || ''}${process.env.VITE_API_PREFIX || '/api'}/**`,
      },
    },
  },
  devServer: {
    host: devHost,
    port: devPort,
    https: devServerHttpsOptions,
  },
  i18n: {
    defaultLocale: 'zh-cn',
    locales: [
      { code: 'zh-cn', name: '简体中文', file: 'zh-cn.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    langDir: '../app/i18n/locales',
    strategy: 'prefix_except_default',
    bundle: {},
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
  },
})
