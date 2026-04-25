// utils/hash-util.ts
import CryptoJS from 'crypto-js'

export class HashUtil {
    /**
     * 计算字符串的 MD5 哈希值（返回十六进制小写字符串）
     */
    static hash(input: string): string {
        return CryptoJS.MD5(input).toString()
    }

    /**
     * 计算字节数组的 MD5 哈希值（返回十六进制小写字符串）
     */
    static hashBytes(bytes: Uint8Array | ArrayBuffer): string {
        // 如果是 ArrayBuffer，需要转为 WordArray
        const wordArray = CryptoJS.lib.WordArray.create(bytes as any)
        return CryptoJS.MD5(wordArray).toString()
    }

    /**
     * 计算浏览器上传的文件的 MD5 哈希值（返回十六进制小写字符串）
     */
    static async hashFile(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer()
        return this.hashBytes(arrayBuffer)
    }

    /**
     * 基于文件头 + 文件大小 生成快速 hash
     */
    static async hashFileQuick(file: File, headSize = 512 * 1024): Promise<string> {
        const blobSlice = File.prototype.slice
        const headBlob = blobSlice.call(file, 0, Math.min(file.size, headSize))
        const headBuffer = await headBlob.arrayBuffer()
        return this.hashBytes(headBuffer)
    }
}
