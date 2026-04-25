/**
 * 通用前端请求加密约定
 * 文档: /api/docs/frontend-encryption
 * - 非 bypass 接口：请求体使用 envelope（AES-GCM + RSA-OAEP）
 * - AAD 键顺序: method, path, nonce, ts；path 含 /api 前缀
 */

const enc = new TextEncoder()
const dec = new TextDecoder()

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64')
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] ?? 0)
  return btoa(s)
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'))
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function fromPem(pem: string): ArrayBuffer {
  const b64 = pem
  .replace("-----BEGIN PUBLIC KEY-----", "")
  .replace("-----END PUBLIC KEY-----", "")
  .replace(/\s+/g, "");
const bin = atob(b64);
const out = new Uint8Array(bin.length);
for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
return out.buffer;
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    fromPem(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

function buildAad(method: string, path: string, nonce: string, ts: number): string {
  return `{"method":"${method.toUpperCase()}","path":"${path}","nonce":"${nonce}","ts":${ts}}`;
}

function randomNonce(len = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, len);
}

export interface EnvelopePayload {
  v: number
  ek: string
  iv: string
  ct: string
  nonce: string
  ts: number
}

export interface ResponseEnvelopePayload {
  v: number
  iv: string
  ct: string
  nonce: string
  ts: number
}

export function isResponseEnvelopePayload(value: unknown): value is ResponseEnvelopePayload {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return typeof obj.iv === 'string'
    && typeof obj.ct === 'string'
    && typeof obj.nonce === 'string'
    && typeof obj.ts === 'number'
}

export interface EnvelopeCryptoContext {
  method: string
  path: string
  nonce: string
  ts: number
  aesKeyRaw: Uint8Array
}

export interface EncryptEnvelopeResult {
  envelope: EnvelopePayload
  context: EnvelopeCryptoContext
}

export async function encryptEnvelope(params: {
  method: string
  path: string
  data: unknown
  serverPublicKeyPem: string
}): Promise<EncryptEnvelopeResult> {
  const { method, path, data, serverPublicKeyPem } = params;
  const nonce = randomNonce(32);
  const ts = Math.floor(Date.now() / 1000);
  const aad = buildAad(method, path, nonce, ts);

  const aesKeyRaw = crypto.getRandomValues(new Uint8Array(32)); // AES-256
  const aesKey = await crypto.subtle.importKey("raw", aesKeyRaw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const plaintext = enc.encode(JSON.stringify(data ?? {}));
  const ctBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: enc.encode(aad), tagLength: 128 },
    aesKey,
    plaintext
  );
  const ct = new Uint8Array(ctBuffer);

  const rsaKey = await importRsaPublicKey(serverPublicKeyPem);
  const ekBuffer = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKey, aesKeyRaw);
  const ek = new Uint8Array(ekBuffer);

  return {
    envelope: {
      v: 1,
      ek: toBase64(ek),
      iv: toBase64(iv),
      ct: toBase64(ct),
      nonce,
      ts
    },
    context: {
      method,
      path,
      nonce,
      ts,
      aesKeyRaw,
    },
  };
}

async function tryDecryptWithAad(params: {
  envelope: ResponseEnvelopePayload
  aesKeyRaw: Uint8Array
  aad: string
}): Promise<unknown> {
  const aesKey = await crypto.subtle.importKey('raw', toBufferSource(params.aesKeyRaw), 'AES-GCM', false, ['decrypt'])
  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toBufferSource(fromBase64(params.envelope.iv)),
      additionalData: enc.encode(params.aad),
      tagLength: 128,
    },
    aesKey,
    toBufferSource(fromBase64(params.envelope.ct)),
  )
  return JSON.parse(dec.decode(plainBuffer))
}

export async function decryptResponseEnvelope(params: {
  envelope: ResponseEnvelopePayload
  context: EnvelopeCryptoContext
}): Promise<unknown> {
  const { envelope, context } = params
  const responseAad = buildAad(context.method, context.path, envelope.nonce, envelope.ts)
  try {
    return await tryDecryptWithAad({
      envelope,
      aesKeyRaw: context.aesKeyRaw,
      aad: responseAad,
    })
  } catch {
    const requestAad = buildAad(context.method, context.path, context.nonce, context.ts)
    return await tryDecryptWithAad({
      envelope,
      aesKeyRaw: context.aesKeyRaw,
      aad: requestAad,
    })
  }
}

/** 是否属于不需要加密的路径（与后端 Bypass 规则一致） */
export const BYPASS_PREFIXES = [
  '/api/swagger-ui/',
  '/api/v3/api-docs',
  '/api/tool/createEnvelop',
  '/api/system/requestEncryption',
]

export function shouldBypassEncryption(method: string, path: string): boolean {
  const m = method.toUpperCase()
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return true
  return BYPASS_PREFIXES.some((p) => path.startsWith(p))
}
