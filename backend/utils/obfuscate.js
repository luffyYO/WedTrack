import crypto from 'crypto';

// The key must be exactly 32 bytes for aes-256-gcm
// We use a fallback key for development if APP_SECRET is not set
const getSecretKey = () => {
    const secret = process.env.APP_SECRET || 'wedtrack-fallback-secret-2024';
    // Hash it to ensure it's exactly 32 bytes
    return crypto.createHash('sha256').update(secret).digest();
};

const algorithm = 'aes-256-gcm';

/**
 * Encrypts a standard UUID into a URL-safe Base64 token.
 * If the input is not a standard UUID, it is returned unchanged.
 */
export const encryptId = (uuid) => {
    if (!uuid) return uuid;
    
    // Strict check: only encrypt actual UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        return uuid;
    }

    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(algorithm, getSecretKey(), iv);
        
        let encrypted = cipher.update(uuid, 'utf8', 'base64url');
        encrypted += cipher.final('base64url');
        
        const authTag = cipher.getAuthTag().toString('base64url');
        const ivStr = iv.toString('base64url');
        
        // Format: iv.authTag.encrypted
        return `${ivStr}.${authTag}.${encrypted}`;
    } catch (e) {
        console.error('Error encrypting ID:', e);
        return uuid; 
    }
};

/**
 * Decrypts a previously generated URL-safe token back into the original UUID.
 * Returns null if decryption fails (e.g., token was tampered with).
 * If the input is already a UUID (unencrypted), it is returned natively.
 */
export const decryptId = (token) => {
    if (!token) return token;
    
    // If it's already a UUID, just return it (backwards compatibility / safety)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(token)) {
        return token;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
        return token; 
    }

    try {
        const [ivStr, authTagStr, encrypted] = parts;
        const iv = Buffer.from(ivStr, 'base64url');
        const authTag = Buffer.from(authTagStr, 'base64url');
        
        const decipher = crypto.createDecipheriv(algorithm, getSecretKey(), iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'base64url', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (e) {
        console.error('Error decrypting ID (possible tamper):', e.message);
        return null; 
    }
};
