// Client-side encryption utilities using Web Crypto API
// Uses PBKDF2 to derive an AES-GCM 256 key from a passphrase.
// Exports: encryptObject, decryptObject

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function deriveKey(password: string, salt: Uint8Array) {
  const passKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      // cast to ArrayBuffer to satisfy TypeScript/WebCrypto types
      salt: (salt as any).buffer as ArrayBuffer,
      iterations: 120000,
      hash: 'SHA-256'
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  return key
}

export async function encryptObject(obj: any, password: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12)) // AES-GCM recommended 12 bytes
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  const plaintext = encoder.encode(JSON.stringify(obj))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    alg: 'AES-GCM',
    kdf: 'PBKDF2',
    iterations: 120000,
    hash: 'SHA-256'
  }
}

export async function decryptObject(encrypted: any, password: string) {
  try {
    const iv = new Uint8Array(base64ToArrayBuffer(encrypted.iv))
    const salt = new Uint8Array(base64ToArrayBuffer(encrypted.salt))
    const key = await deriveKey(password, salt)
    const ciphertext = base64ToArrayBuffer(encrypted.ciphertext)
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    const text = decoder.decode(plainBuf)
    return JSON.parse(text)
  } catch (e) {
    throw new Error('Decryption failed')
  }
}

export default { encryptObject, decryptObject }
