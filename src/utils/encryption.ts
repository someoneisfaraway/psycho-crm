import CryptoJS from 'crypto-js'
import { supabase } from '../config/supabase'

// --- Конфигурация KDF ---
const KDF_ITERATIONS = 150000
const KEY_SIZE_WORDS = 256 / 32 // 8 слов (32-бит)

// --- Таблица Supabase для хранения зашифрованного ключа ---
const TABLE_NAME = 'encryption_keys'

// --- Активный ключ данных в памяти (не хранится в localStorage) ---
let DATA_KEY: string | null = null
let UNLOCKED_USER_ID: string | null = null

// --- Глобальное событие для уведомления компонентов об изменении состояния шифрования ---
export const ENCRYPTION_EVENT = 'encryption:state'
const notifyEncryptionState = (unlocked: boolean) => {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(ENCRYPTION_EVENT, { detail: { unlocked } }))
    } catch (_) {
      // Игнорируем если CustomEvent недоступен
    }
  }
}

// --- Вспомогательные функции ---
const deriveKEK = (password: string, saltHex: string): string => {
  const salt = CryptoJS.enc.Hex.parse(saltHex)
  const kek = CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE_WORDS,
    iterations: KDF_ITERATIONS,
  })
  return kek.toString()
}

// Создать ключ данных и сохранить зашифрованным на сервере
const initializeServerKey = async (userId: string, password: string): Promise<string> => {
  const dataKey = CryptoJS.lib.WordArray.random(32).toString()
  const salt = CryptoJS.lib.WordArray.random(16).toString()
  const kek = deriveKEK(password, salt)
  const dekEncrypted = CryptoJS.AES.encrypt(dataKey, kek).toString()

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({
      user_id: userId,
      dek_encrypted: dekEncrypted,
      salt,
      kdf_iterations: KDF_ITERATIONS,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) throw error
  return dataKey
}

// Получить и расшифровать ключ данных с сервера
export const unlockWithPassword = async (userId: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('dek_encrypted, salt, kdf_iterations')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // not found code
      console.error('Failed to fetch encryption key:', error)
      return false
    }

    let dataKey: string
    if (!data) {
      // Нет записи — создаём новую, используя пароль как KEK
      dataKey = await initializeServerKey(userId, password)
    } else {
      const { dek_encrypted, salt } = data
      const kek = deriveKEK(password, salt)
      const decrypted = CryptoJS.AES.decrypt(dek_encrypted, kek)
      dataKey = decrypted.toString(CryptoJS.enc.Utf8)
      if (!dataKey) {
        console.warn('Incorrect password for decryption')
        return false
      }
    }

    DATA_KEY = dataKey
    UNLOCKED_USER_ID = userId
    notifyEncryptionState(true)
    return true
  } catch (e) {
    console.error('unlockWithPassword error:', e)
    return false
  }
}

export const isUnlocked = (userId?: string): boolean => {
  if (!DATA_KEY) return false
  if (userId && UNLOCKED_USER_ID !== userId) return false
  return true
}

export const lockEncryption = (): void => {
  DATA_KEY = null
  UNLOCKED_USER_ID = null
  notifyEncryptionState(false)
}

// Перепаковка ключа данных при смене пароля:
// Проверяет старый пароль, расшифровывает DEK и сохраняет его заново, зашифрованным новым паролем.
export const repackServerKey = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('dek_encrypted, salt, kdf_iterations')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch encryption key for repack:', error)
      return false
    }

    const { dek_encrypted, salt } = data
    const oldKek = deriveKEK(oldPassword, salt)
    const decrypted = CryptoJS.AES.decrypt(dek_encrypted, oldKek)
    const dataKey = decrypted.toString(CryptoJS.enc.Utf8)
    if (!dataKey) {
      console.warn('Incorrect old password; cannot repack')
      return false
    }

    // Генерируем новую соль и шифруем тем же алгоритмом
    const newSalt = CryptoJS.lib.WordArray.random(16).toString()
    const newKek = deriveKEK(newPassword, newSalt)
    const newDekEncrypted = CryptoJS.AES.encrypt(dataKey, newKek).toString()

    const { error: updError } = await supabase
      .from(TABLE_NAME)
      .update({
        dek_encrypted: newDekEncrypted,
        salt: newSalt,
        kdf_iterations: KDF_ITERATIONS,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updError) {
      console.error('Failed to repack encryption key:', updError)
      return false
    }

    // Если ключ был разблокирован, обновим его на устройстве без повторного ввода
    if (UNLOCKED_USER_ID === userId) {
      DATA_KEY = dataKey
    }

    return true
  } catch (e) {
    console.error('repackServerKey error:', e)
    return false
  }
}

/**
 * Encrypt text using AES-256
 */
export const encrypt = (text: string): string => {
  if (!text) return ''
  
  try {
    if (!DATA_KEY) throw new Error('Encryption is locked')
    const encrypted = CryptoJS.AES.encrypt(text, DATA_KEY).toString()
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
    if (!DATA_KEY) throw new Error('Encryption is locked')
    const decrypted = CryptoJS.AES.decrypt(encryptedText, DATA_KEY)
    return decrypted.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Decryption error:', error)
    return '[Ошибка расшифровки]'
  }
}
// Бэкап/импорт через серверный механизм больше не используется
export const exportEncryptionKey = (): string => {
  return DATA_KEY || ''
}
export const importEncryptionKey = (_key: string): void => {
  console.warn('Import via plaintext key is disabled in server-managed mode')
}
export const hasEncryptionKey = (): boolean => {
  return !!DATA_KEY
}
