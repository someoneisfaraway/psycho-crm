import CryptoJS from 'crypto-js'

/**
 * Get or generate encryption key
 * Key is stored in localStorage
 */
const getEncryptionKey = (): string => {
  const KEY_STORAGE = 'psycho_crm_encryption_key'
  
  let key = localStorage.getItem(KEY_STORAGE)
  
  if (!key) {
    // Generate new key on first use
    key = CryptoJS.lib.WordArray.random(32).toString()
    localStorage.setItem(KEY_STORAGE, key)
    
    console.warn('New encryption key generated. If you clear localStorage, encrypted data will be lost.')
  }
  
  return key
}

/**
 * Encrypt text using AES-256
 */
export const encrypt = (text: string): string => {
  if (!text) return ''
  
  try {
    const key = getEncryptionKey()
    const encrypted = CryptoJS.AES.encrypt(text, key).toString()
    return encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt text using AES-256
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return ''
  
  try {
    const key = getEncryptionKey()
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Decryption error:', error)
    return '[Ошибка расшифровки]'
  }
}

/**
 * Export encryption key for backup
 */
export const exportEncryptionKey = (): string => {
  return getEncryptionKey()
}

/**
 * Import encryption key from backup
 */
export const importEncryptionKey = (key: string): void => {
  const KEY_STORAGE = 'psycho_crm_encryption_key'
  localStorage.setItem(KEY_STORAGE, key)
}

/**
 * Check if encryption key exists
 */
export const hasEncryptionKey = (): boolean => {
  const KEY_STORAGE = 'psycho_crm_encryption_key'
  return !!localStorage.getItem(KEY_STORAGE)
}