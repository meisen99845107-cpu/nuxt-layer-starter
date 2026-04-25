import fs from 'fs'
import { createRequire } from 'node:module'
import path from 'path'
import type {Nitro} from 'nitropack'

const requireFromConsumer = createRequire(path.resolve(process.cwd(), 'package.json'))
const { obfuscate } = requireFromConsumer('javascript-obfuscator') as typeof import('javascript-obfuscator')

/**
 * 混淆
 * @param nitro
 */
export function obfuscatePublicAssets(nitro: Nitro) {
    const publicDir = path.resolve(nitro.options.output.publicDir, '_nuxt')

    if (!fs.existsSync(publicDir)) {
        console.warn(`⚠️ 未找到输出目录: ${publicDir}`)
        return
    }

    const files = fs.readdirSync(publicDir).filter(file => file.endsWith('.js'))

    const total = files.length
    if (total === 0) {
        console.log('⚠️ 没有需要混淆的 .js 文件')
        return
    }

    console.log(`🔐 开始混淆 ${total} 个 JS 文件...\n`)

    files.forEach((file, index) => {
        const filePath = path.join(publicDir, file)
        const code = fs.readFileSync(filePath, 'utf8')

        const obfuscated = obfuscate(code, {
            // 压缩,无换行
            compact: true,
            // 是否启用控制流扁平化(降低1.5倍的运行速度) 将原始代码中的控制流结构（如 `if`、`switch`、`for`、`while` 等）转换为一个扁平化的 `switch` 结构，使得代码执行流程变得非线性
            controlFlowFlattening: false,
            // 应用概率;在较大的代码库中，建议降低此值，因为大量的控制流转换可能会增加代码的大小并降低代码的速度。
            controlFlowFlatteningThreshold: 0.5,
            // 随机的死代码块(增加了混淆代码的大小)
            deadCodeInjection: false,
            // 死代码块的影响概率
            deadCodeInjectionThreshold: 0.4,
            // 此选项几乎不可能使用开发者工具的控制台选项卡
            debugProtection: false,
            // 如果选中，则会在“控制台”选项卡上使用间隔强制调试模式，从而更难使用“开发人员工具”的其他功能。
            debugProtectionInterval: 1,
            // 通过用空函数替换它们来禁用console.log，console.info，console.error和console.warn。这使得调试器的使用更加困难。
            disableConsoleOutput: true,
            //锁定混淆的源代码，使其仅在特定域和/或子域上运行。这使得某人只需复制并粘贴您的源代码并在其他地方运行就变得非常困难。
            domainLock: [],
            //标识符的混淆方式 hexadecimal(十六进制) mangled(短标识符)
            identifierNamesGenerator: 'mangled',
            //全局标识符添加特定前缀,在混淆同一页面上加载的多个文件时使用此选项。此选项有助于避免这些文件的全局标识符之间发生冲突。为每个文件使用不同的前缀
            identifiersPrefix: '',
            inputFileName: '',
            // 允许将信息记录到控制台。
            log: false,
            // 是否启用全局变量和函数名称的混淆
            renameGlobals: true,
            // 禁用模糊处理和生成标识符
            reservedNames: [],
            // 禁用字符串文字的转换
            reservedStrings: [],
            // 通过固定和随机（在代码混淆时生成）的位置移动数组。这使得将删除的字符串的顺序与其原始位置相匹配变得更加困难。如果原始源代码不小，建议使用此选项，因为辅助函数可以引起注意。
            rotateStringArray: true,
            // 混淆后的代码,不能使用代码美化,同时需要配置 cpmpat:true;
            seed: 0,
            selfDefending: false,
            sourceMap: false,
            sourceMapBaseUrl: '',
            sourceMapFileName: '',
            sourceMapMode: 'separate',
            // 删除字符串文字并将它们放在一个特殊的数组中
            stringArray: true,
            // 编码的所有字符串文字stringArray使用base64或rc4并插入即用其解码回在运行时的特殊代码。true（boolean）：stringArray使用编码值base64;false（boolean）：不编码stringArray值;'base64'（string）：stringArray使用编码值base64;'rc4'（string）：stringArray使用编码值rc4。大约慢30-50％base64，但更难获得初始值。建议禁用unicodeEscapeSequence带rc4编码的选项以防止非常大的混淆代码。
            stringArrayEncoding: ['base64', 'rc4'],
            // 调整字符串文字将插入stringArray的概率
            stringArrayThreshold: 0.5,
            // 您可以将混淆代码的目标环境设置为以下之一：Browser;Browser No Eval;Node
            target: 'browser',
            // 是否启用混淆对象键
            transformObjectKeys: false,
            // 允许启用/禁用字符串转换为unicode转义序列。Unicode转义序列大大增加了代码大小，并且可以轻松地将字符串恢复为原始视图。建议仅对小型源代码启用此选项。
            unicodeEscapeSequence: false
        }).getObfuscatedCode()

        fs.writeFileSync(filePath, obfuscated)

        console.log(`✔ ${index + 1}/${total} 混淆成功: ${file}`)
    })

    console.log('\n✅ 所有 JS 文件混淆完成。')
}
