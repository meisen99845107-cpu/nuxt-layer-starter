import CryptoJS from 'crypto-js'

export class AesUtil {
    /**
     * 加密
     * @param data 需要加密的数据
     * @param key 加密密钥
     * @returns 加密后的数据
     */
    static encryptData = (data: object, key: string): string => {
        const ukey = CryptoJS.enc.Utf8.parse(key)
        const dataSTR = JSON.stringify(data)
        const encrypted = CryptoJS.AES.encrypt(dataSTR, ukey, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        })
        return encrypted.toString()
    }

    /**
     * 解密
     * @param data 加密后的数据
     * @param key 加密密钥
     * @returns 解密后的数据
     */
    static decryptData = (data: string, key: string): string => {
        try {
            const ukey = CryptoJS.enc.Utf8.parse(key)
            const decrypted = CryptoJS.AES.decrypt(data, ukey, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            })
            return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
        } catch (error) {
            console.log(error)
            return '';
        }
    }

    /**
     * @param base64
     * @param key
     */
    static decryptBase64 = (base64: string, key: string): string => {
        try {
            const ukey = CryptoJS.enc.Utf8.parse(key);
            const decrypted = CryptoJS.AES.decrypt(base64, ukey, {
                mode: CryptoJS.mode.ECB
            });
            return decrypted.toString(CryptoJS.enc.Base64);
        } catch (error) {
            console.log(error)
            return '';
        }
    }


    /**
     * 解密
     * @param data 加密后的数据
     * @param key 加密密钥
     * @returns 解密后的数据
     */
    static decryptHex = (data: string, key: string): string => {
        try {
            const ukey = CryptoJS.enc.Hex.parse(key)
            const cipherParams = CryptoJS.lib.CipherParams.create({
                ciphertext: CryptoJS.enc.Hex.parse(data)
            })
            const decrypted = CryptoJS.AES.decrypt(cipherParams, ukey, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            })
            return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
        } catch (error) {
            console.log(error)
            return '';
        }
    }
}
