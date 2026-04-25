# AI Quick Start

This repository is designed so a developer can ask any coding AI to create a project from this Nuxt 4 Layer starter.

## One Sentence Prompt

Chinese:

```text
快速开始 https://github.com/meisen99845107-cpu/nuxt-layer-starter.git，项目名叫 my-app，使用 yarn。
```

English:

```text
Start a new project from https://github.com/meisen99845107-cpu/nuxt-layer-starter.git named my-app. Use yarn.
```

## Commands For AI Agents

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

## Build Commands

```bash
yarn build
yarn build:dev
yarn build:test
yarn build:prod
```

The environment-specific build commands use Nuxt `--dotenv`:

- `build:dev` loads `.env.dev`
- `build:test` loads `.env.test`
- `build:prod` loads `.env.prod`

## Rules

- Use `yarn`.
- Do not commit `.env`, `.env.dev`, `.env.test`, or `.env.prod`.
- Do not commit `node_modules`, `.nuxt`, or `.output`.
- Keep business pages, business API modules, business assets, and business copy outside this layer.
- Put project-specific runtime values in the consuming project's `.env.*` files.

## Using It As A Layer

In another Nuxt project:

```ts
export default defineNuxtConfig({
  extends: ['../nuxt-layer-starter'],
})
```

The consuming project can add its own pages, API modules, components, assets, and runtime config on top of the layer.
