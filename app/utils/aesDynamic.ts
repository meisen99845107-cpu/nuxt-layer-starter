import CryptoJS from "crypto-js";
import pako from 'pako';

export class AesDynamicUtil {
    /**
     * AES 加密（与 PHP 服务端兼容）
     * @param data 数据
     * @param requestId 请求ID
     * @param key 主密钥（hex 格式）
     * @param zip
     */
    public static encryptData = (data: object, requestId: string, key: string, zip: boolean) => {

        const plaintext = JSON.stringify(data)

        // const compressed = plaintext;
        // 1. 压缩数据（兼容 PHP 的 gzcompress）
        const compressed = zip ? pako.gzip(plaintext) : plaintext;

        // 2. 生成密钥和 IV
        const ukey = this.generateKey(requestId, key);

        const iv = CryptoJS.lib.WordArray.random(16); // 16字节随机IV

        // 3. AES-CBC 加密
        const encrypted = CryptoJS.AES.encrypt(
            zip ? CryptoJS.lib.WordArray.create(compressed as Uint8Array) : plaintext,
            ukey,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );
        // 4. 拼接 IV 和密文 //IV 在前，密文在后
        const ivCiphertext = iv.concat(encrypted.ciphertext);
        return ivCiphertext.toString(CryptoJS.enc.Base64);
    }

    public static decryptData = (data: string, requestId: string, key: string, zip: boolean) => {
        // 1. Base64 解码
        const encryptedData = CryptoJS.enc.Base64.parse(data);

        // 2. 提取 IV (16字节)
        const iv = CryptoJS.lib.WordArray.create(encryptedData.words.slice(0, 4)); // 前16字节
        const ciphertext = CryptoJS.enc.Base64.stringify(  // 剩余部分
            CryptoJS.lib.WordArray.create(encryptedData.words.slice(4))
        );

        // 3. 生成密钥
        const ukey = this.generateKey(requestId, key);

        // console.log("requestId", requestId.toString());
        // console.log("ukey", ukey.toString());
        // 4. AES解密
        const decrypted = CryptoJS.AES.decrypt(
            ciphertext,
            ukey,
            {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            }
        );

        if (zip) {
            // 5. 解压数据（使用pako解压）
            // const uncompressed = pako.ungzip(decryptedArray, { to: 'string' });
            const decryptedBytes = this.wordArrayToUint8Array(decrypted);

            // 6. 使用 pako 解压缩
            const decodeData = pako.ungzip(decryptedBytes, {to: 'string'});
            return JSON.parse(decodeData)
        } else {
            // 6. 转换为 UTF-8 字符串
            const decodeData = decrypted.toString(CryptoJS.enc.Utf8);
            return JSON.parse(decodeData)
        }
    }

    public static generateRequestId = (): string => {
        const bytes: any = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        // 设置版本位 (4)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // 设置变体位 (8, 9, a, b)
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        return this.formatUUID(bytes);
    }

    /**
     * 动态密钥生成
     * @param requestId 请求ID
     * @param key 主密钥（hex 格式）
     */
    private static generateKey = (requestId: string, key: string) => {
        // 移除连字符并转换为二进制
        const cleanId = requestId.replace(/-/g, '');
        const hexWords = CryptoJS.enc.Hex.parse(cleanId);
        const ukey = CryptoJS.enc.Utf8.parse(key)

        // console.log("RequestID: " + requestId);
        // console.log("CleanID: " + cleanId);
        // console.log("hex2bin(CleanID): " + hexWords.toString()); // 应为原 CleanID
        // console.log("MasterKey: " + ukey); // 验证主密钥是否一致

        // 使用 HMAC-SHA256 派生密钥
        return CryptoJS.HmacSHA256(hexWords, ukey);
    }

    private static formatUUID = (bytes: Uint8Array): string => {
        const hex: string[] = [];
        bytes.forEach((byte) => {
            hex.push(byte.toString(16).padStart(2, '0'));
        });

        return [
            hex.slice(0, 4).join(''),
            hex.slice(4, 6).join(''),
            hex.slice(6, 8).join(''),
            hex.slice(8, 10).join(''),
            hex.slice(10, 16).join('')
        ].join('-');
    }

    /* Converts a cryptjs WordArray to native Uint8Array */
    private static wordArrayToUint8Array = (wordArray: CryptoJS.lib.WordArray) => {
        const l = wordArray.sigBytes;
        const words = wordArray.words;
        const result = new Uint8Array(l);
        var i = 0 /*dst*/, j = 0 /*src*/;
        while (true) {
            // here i is a multiple of 4
            if (i == l)
                break;
            var w: any = words[j++];
            result[i++] = (w & 0xff000000) >>> 24;
            if (i == l)
                break;
            result[i++] = (w & 0x00ff0000) >>> 16;
            if (i == l)
                break;
            result[i++] = (w & 0x0000ff00) >>> 8;
            if (i == l)
                break;
            result[i++] = (w & 0x000000ff);
        }
        return result;
    }
}
