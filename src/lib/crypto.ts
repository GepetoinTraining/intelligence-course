import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable not set');
    }
    // Key should be 32 bytes for AES-256
    return Buffer.from(key, 'hex');
}

/**
 * Derive a unique encryption key for a student
 * This ensures that even admins cannot read student chat content without the student's ID
 */
export function deriveStudentKey(studentId: string): Buffer {
    const salt = process.env.ENCRYPTION_SALT || 'intelligence-course-default-salt';
    return crypto.pbkdf2Sync(studentId, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns: iv:authTag:encryptedData (all hex encoded)
 * 
 * @param plaintext - The text to encrypt
 * @param key - Optional custom key (Buffer). If not provided, uses ENCRYPTION_KEY env var
 */
export function encrypt(plaintext: string, key?: Buffer): string {
    const encryptionKey = key || getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with encrypt()
 * 
 * @param encryptedData - The encrypted string in format iv:authTag:data
 * @param key - Optional custom key (Buffer). If not provided, uses ENCRYPTION_KEY env var
 */
export function decrypt(encryptedData: string, key?: Buffer): string {
    const encryptionKey = key || getEncryptionKey();

    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Get just the last 4 characters as a hint
 */
export function getKeyHint(apiKey: string): string {
    return apiKey.slice(-4);
}

/**
 * Hash content for integrity verification
 */
export function hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}


