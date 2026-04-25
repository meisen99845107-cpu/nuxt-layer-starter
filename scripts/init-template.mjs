import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const rawName = process.argv[2]

if (!rawName) {
  console.error('Usage: yarn init:template <project-name>')
  process.exit(1)
}

const packageName = toPackageName(rawName)
const displayName = toDisplayName(rawName)

if (!packageName) {
  console.error('Invalid project name.')
  process.exit(1)
}

const root = process.cwd()
const packageJsonPath = resolve(root, 'package.json')
const manifestPath = resolve(root, 'public/manifest.json')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
packageJson.name = packageName
writeJson(packageJsonPath, packageJson)

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.name = displayName
  manifest.short_name = displayName.slice(0, 12)
  writeJson(manifestPath, manifest)
}

console.log(`Initialized template as ${packageName}`)

function toPackageName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toDisplayName(value) {
  return value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}
