# Template Usage

## Clone As A New Project

```bash
git clone https://github.com/meisen99845107-cpu/nuxt-layer-starter.git my-app
cd my-app
yarn install
yarn init:template my-app
cp .env.example .env
cp .env.dev.example .env.dev
cp .env.test.example .env.test
cp .env.prod.example .env.prod
yarn dev
```

## Use As A GitHub Template

If this repository is marked as a GitHub template repository, developers can create a new repository from it in the GitHub UI, then run:

```bash
yarn install
yarn init:template my-app
cp .env.example .env
cp .env.dev.example .env.dev
cp .env.test.example .env.test
cp .env.prod.example .env.prod
yarn dev
```

## Use As A Local Nuxt Layer

Place this repository next to a business project:

```text
workspace/
  nuxt-layer-starter/
  business-app/
```

In `business-app/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['../nuxt-layer-starter'],
})
```

## Project Boundaries

Keep this layer focused on shared infrastructure:

- Nuxt configuration
- Tailwind, Sass, reset, global, and font styles
- Pinia auth/session store
- i18n base configuration
- YAML-driven i18n generation with Chinese copy as keys
- request utilities
- request encryption utilities
- browser cache, fingerprint, event bus, and websocket utilities
- build enhancement switches

Keep business-specific code in the consuming project:

- pages
- API modules
- assets
- copywriting
- route rules
- domain names
- business stores
