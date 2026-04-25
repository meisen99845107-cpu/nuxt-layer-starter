# Nuxt Layer Starter

Reusable Nuxt 4 Layer starter for Vue/Nuxt applications.

## AI Quick Start

Tell any coding AI this sentence:

```text
快速开始 https://github.com/meisen99845107-cpu/nuxt-layer-starter.git，项目名叫 my-app，使用 yarn。
```

The AI can run:

```bash
git clone https://github.com/meisen99845107-cpu/nuxt-layer-starter.git my-app
cd my-app
yarn install
cp .env.example .env
cp .env.dev.example .env.dev
cp .env.test.example .env.test
cp .env.prod.example .env.prod
yarn init:template my-app
yarn dev
```

## Use As A Nuxt Layer

In a consuming Nuxt project:

```ts
export default defineNuxtConfig({
  extends: ['../nuxt-layer-starter'],
})
```

The layer should contain only shared infrastructure. Business projects should keep their own pages, API modules, assets, copywriting, and runtime values.

## What Is Included

- Nuxt 4 base config, Vite config, Nitro API proxy, dev server HTTPS support.
- Tailwind v4, Sass global variables, reset/global/font styles.
- Vant auto import, Element Plus, Pinia, i18n, Nuxt Image, Swiper.
- YAML-driven i18n generation with Chinese copy as translation keys.
- Generic auth/session store.
- `ofetch` request wrapper with base URL, token header, full response mode, encryption support.
- Cache utilities, browser fingerprint header, event bus, websocket plugin.
- Optional visualizer and JS obfuscation build hooks.

## Quick Start

```bash
yarn install
yarn dev
```

## Environment

Copy example environment files and adjust values:

```bash
cp .env.example .env
cp .env.dev.example .env.dev
cp .env.test.example .env.test
cp .env.prod.example .env.prod
```

Layered build commands:

```bash
yarn build:dev
yarn build:test
yarn build:prod
```

These commands load `.env.dev`, `.env.test`, and `.env.prod` respectively via Nuxt `--dotenv`.

Build enhancement switches:

- `VITE_BUILD_VISUALIZER=true`
- `VITE_BUILD_OBFUSCATE=true`

Both are disabled by default.

## I18n YAML

Locale JSON files can be generated from YAML files:

```bash
yarn i18n:generate
```

Put shared translation source files in `app/i18n/locales/yaml/yml/*.yml`.
The default format uses Chinese copy as keys:

```yaml
确定:
  zh-cn: 确定
  en: OK
```

Then use it in components:

```ts
const { t } = useI18n()
t('确定')
```

## Template Initialization

After cloning, rename package metadata:

```bash
yarn init:template my-app
```

This updates `package.json` and `public/manifest.json` with the new project name.

## Documentation

- [AI_QUICKSTART.md](./AI_QUICKSTART.md): prompts and commands for AI-assisted project creation.
- [TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md): clone, template, and layer usage notes.
