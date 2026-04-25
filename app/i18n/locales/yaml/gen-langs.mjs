import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const yamlDir = path.join(currentDir, 'yml')
const outputDir = path.join(currentDir, '..')

const LANG_MAP = {
  'zh-cn': 'zh-cn',
  en: 'en',
}

if (!fs.existsSync(yamlDir)) {
  fs.mkdirSync(yamlDir, { recursive: true })
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const langs = Object.fromEntries(
  Object.values(LANG_MAP).map((langCode) => [langCode, {}]),
)

const yamlFiles = fs
  .readdirSync(yamlDir)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort((a, b) => {
    if (a === 'common.yml') return -1
    if (b === 'common.yml') return 1
    return a.localeCompare(b)
  })

for (const file of yamlFiles) {
  const filePath = path.join(yamlDir, file)
  const content = fs.readFileSync(filePath, 'utf8')
  const data = parseLocaleYaml(content, file)

  for (const [key, value] of Object.entries(data)) {
    for (const [yamlLangKey, outputLangCode] of Object.entries(LANG_MAP)) {
      langs[outputLangCode][key] = String(value[yamlLangKey] ?? '')
    }
  }
}

for (const [langCode, translations] of Object.entries(langs)) {
  const filePath = path.join(outputDir, `${langCode}.json`)
  fs.writeFileSync(filePath, `${JSON.stringify(translations, null, 2)}\n`, 'utf8')
  console.log(`Generated ${filePath}`)
}

function parseLocaleYaml(content, filename) {
  const result = {}
  let currentKey = ''

  content.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.replace(/\t/g, '  ')
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) return

    if (!line.startsWith(' ')) {
      const match = line.match(/^(.+):\s*$/)
      if (!match) {
        throw new SyntaxError(`${filename}:${index + 1} top-level keys must use "key:" format.`)
      }

      currentKey = match[1].trim()
      result[currentKey] = {}
      return
    }

    if (!currentKey) {
      throw new SyntaxError(`${filename}:${index + 1} language value found before a key.`)
    }

    const match = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!match) {
      throw new SyntaxError(`${filename}:${index + 1} language values must use "  lang: value" format.`)
    }

    result[currentKey][match[1]] = parseScalar(match[2])
  })

  return result
}

function parseScalar(value) {
  const trimmed = value.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}
