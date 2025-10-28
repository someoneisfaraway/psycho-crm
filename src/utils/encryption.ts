import CryptoJS from 'crypto-js';

/**
 * Encrypts plain text using AES-256
 * @param text The plain text to encrypt
 * @param key The encryption key
 * @returns The encrypted text in Base64 format
 */
export const encryptText = (text: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, key);
    return encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt text');
  }
};

/**
 * Decrypts encrypted text using AES-256
 * @param encryptedText The encrypted text to decrypt
 * @param key The encryption key
 * @returns The decrypted plain text
 */
export const decryptText = (encryptedText: string, key: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt text');
  }
};

/**
 * Generates a hash for a given text using SHA-256
 * @param text The text to hash
 * @returns The hashed text
 */
export const hashText = (text: string): string => {
  try {
    return CryptoJS.SHA256(text).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash text');
  }
};

/**
 * Generates a secure encryption key from a password and salt
 * @param password The user's password
 * @param salt The salt value
 * @returns The derived encryption key
 */
export const deriveKey = (password: string, salt: string): string => {
 try {
    // Using PBKDF2 to derive a key from the password
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000
    });
    return key.toString();
  } catch (error) {
    console.error('Key derivation error:', error);
    throw new Error('Failed to derive encryption key');
  }
};