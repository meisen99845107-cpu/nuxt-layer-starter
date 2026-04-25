<script setup lang="ts">
interface NamedItem {
  name: string
  description: string
}

const stack = [
  'Nuxt 4',
  'Vue 3',
  'TypeScript',
  'Pinia',
  'Nuxt i18n',
  'Tailwind CSS v4',
  'Sass / SCSS',
  'Vant',
  'Element Plus',
  'Nuxt Image',
  'nuxt-swiper',
  'ofetch',
  'Web Crypto request encryption',
  'WebSocket',
  'Rollup visualizer',
  'javascript-obfuscator',
]

const commands: NamedItem[] = [
  { name: 'yarn install', description: '安装项目依赖。' },
  { name: 'yarn dev', description: '启动本地开发服务。' },
  { name: 'yarn build', description: '使用默认环境构建。' },
  { name: 'yarn build:dev', description: '读取 .env.dev，生成开发环境构建产物。' },
  { name: 'yarn build:test', description: '读取 .env.test，生成测试环境构建产物。' },
  { name: 'yarn build:prod', description: '读取 .env.prod，生成生产环境构建产物。' },
]

const envFiles: NamedItem[] = [
  { name: '.env.dev', description: '开发环境变量。' },
  { name: '.env.test', description: '测试环境变量。' },
  { name: '.env.prod', description: '生产环境变量。' },
  { name: '.env.example', description: '新项目创建环境文件时的参考模板。' },
]

const directories: NamedItem[] = [
  { name: 'app/plugins', description: 'Nuxt 插件，例如组件库、事件总线、WebSocket、加密预热。' },
  { name: 'app/utils', description: '通用工具，例如请求、缓存、加密、指纹、WebSocket 客户端。' },
  { name: 'app/store', description: 'Pinia 基础状态，当前包含通用 token/session。' },
  { name: 'app/middleware', description: '通用路由中间件，支持通过环境变量配置受保护路径。' },
  { name: 'app/assets/styles', description: 'Tailwind、SCSS 变量、reset、global 等样式基线。' },
  { name: 'app/i18n/locales', description: '基础多语言文件，业务项目可以覆盖。' },
  { name: 'app/api', description: '底座只保留示例 API 约定，业务接口应放在业务项目中。' },
  { name: 'scripts', description: '开发辅助脚本，例如本地 HTTPS 证书生成。' },
]

const capabilities: NamedItem[] = [
  { name: 'HttpUtil / fetch', description: '封装 ofetch、baseURL、请求头、token、fullResponse 和超时。' },
  { name: 'useAuthStore', description: '提供 token、refresh_token、登录态恢复和清理能力。' },
  { name: 'envelopeEncrypt', description: '基于 Web Crypto 的请求 envelope 加密与响应解密。' },
  { name: 'CacheUtil', description: '统一 localStorage、sessionStorage、cookie 的读写封装。' },
  { name: '$ws', description: 'Nuxt 注入的 WebSocket 客户端入口。' },
  { name: '$bus', description: '基于 mitt 的跨组件事件总线。' },
  { name: 'i18n', description: '提供 Nuxt i18n 基础配置和语言文件目录约定。' },
  { name: '样式基线和组件库', description: '内置 Tailwind、SCSS、Vant、Element Plus 的基础集成。' },
]

const notes = [
  '不要把业务接口、业务页面、业务素材放到底座。',
  '业务项目优先通过覆盖配置、增加页面、增加 API module 的方式扩展。',
  '构建混淆通过 VITE_BUILD_OBFUSCATE 控制。',
  'Rollup visualizer 通过 VITE_BUILD_VISUALIZER 控制。',
  '业务项目中如果存在和底座同名的 utils，可能出现 duplicated imports 警告。',
  '新项目继承底座后，应创建自己的 .env.* 文件。',
]
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
      <header class="border-b border-slate-200 pb-8">
        <p class="text-sm font-medium uppercase tracking-wide text-slate-500">
          Nuxt Layer Foundation
        </p>
        <div class="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <h1 class="text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Nuxt Layer Starter
            </h1>
            <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              这是一个可复用的 Nuxt 4 Layer 前端基础架构。业务项目通过
              <code class="rounded bg-slate-200 px-1.5 py-0.5 text-sm text-slate-900">extends: ['../nuxt-layer-starter']</code>
              继承底座能力；底座只放通用工程能力，不放业务页面、业务接口或业务素材。
            </p>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-medium text-slate-500">Layer Usage</p>
            <pre class="mt-3 overflow-x-auto rounded bg-slate-950 p-4 text-sm leading-6 text-slate-100"><code>export default defineNuxtConfig({
  extends: ['../nuxt-layer-starter'],
})</code></pre>
          </div>
        </div>
      </header>

      <section class="grid gap-4">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-xl font-semibold text-slate-950">技术栈</h2>
            <p class="mt-1 text-sm text-slate-600">底座集成的核心框架、工程工具和运行时能力。</p>
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="item in stack"
            :key="item"
            class="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm"
          >
            {{ item }}
          </div>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 class="text-xl font-semibold text-slate-950">快速开始</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            使用 yarn 作为包管理器。分环境构建通过 Nuxt 的
            <code class="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-900">--dotenv</code>
            读取对应环境文件。
          </p>
        </div>
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div
            v-for="command in commands"
            :key="command.name"
            class="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[180px_1fr]"
          >
            <code class="text-sm font-semibold text-slate-950">{{ command.name }}</code>
            <span class="text-sm text-slate-600">{{ command.description }}</span>
          </div>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-semibold text-slate-950">环境文件</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">build:*</code>
            命令会加载对应的环境文件。新业务项目继承底座后，应维护自己的环境变量。
          </p>
          <dl class="mt-5 grid gap-4">
            <div v-for="file in envFiles" :key="file.name">
              <dt class="font-mono text-sm font-semibold text-slate-950">{{ file.name }}</dt>
              <dd class="mt-1 text-sm text-slate-600">{{ file.description }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="text-xl font-semibold text-slate-950">注意事项</h2>
          <ul class="mt-5 grid gap-3 text-sm leading-6 text-slate-600">
            <li v-for="note in notes" :key="note" class="flex gap-3">
              <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{{ note }}</span>
            </li>
          </ul>
        </div>
      </section>

      <section class="grid gap-4">
        <div>
          <h2 class="text-xl font-semibold text-slate-950">目录说明</h2>
          <p class="mt-1 text-sm text-slate-600">底座目录只承载通用工程能力，业务代码应留在消费项目中。</p>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="directory in directories"
            :key="directory.name"
            class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 class="font-mono text-sm font-semibold text-slate-950">{{ directory.name }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-600">{{ directory.description }}</p>
          </div>
        </div>
      </section>

      <section class="grid gap-4">
        <div>
          <h2 class="text-xl font-semibold text-slate-950">通用能力</h2>
          <p class="mt-1 text-sm text-slate-600">业务项目继承 layer 后可直接复用这些基础能力。</p>
        </div>
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div
            v-for="capability in capabilities"
            :key="capability.name"
            class="grid gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-[220px_1fr]"
          >
            <strong class="text-sm text-slate-950">{{ capability.name }}</strong>
            <span class="text-sm leading-6 text-slate-600">{{ capability.description }}</span>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
