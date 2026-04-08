import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const raw = process.env.NOTE_ENCRYPTION_KEY;
  if (!raw) throw new Error("NOTE_ENCRYPTION_KEY env var is not set");

  // Derive a stable 32-byte key from any passphrase using SHA-256
  return createHash("sha256").update(raw).digest();
}

/**
 * Encrypts a plaintext note.
 * Returns a base64 string: iv (12 bytes) + authTag (16 bytes) + ciphertext.
 */
export function encryptNote(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypts a note previously encrypted with encryptNote.
 * Returns null if decryption fails (tampered data / wrong key).
 */
export function decryptNote(ciphertext: string): string | null {
  try {
    const key = getKey();
    const buf = Buffer.from(ciphertext, "base64");

    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Returns true if the value looks like an encrypted note (base64, min length).
 * Used to distinguish legacy plaintext from encrypted blobs during migration.
 */
export function isEncrypted(value: string): boolean {
  const minLength = IV_LENGTH + AUTH_TAG_LENGTH + 1; // at least 1 byte of ciphertext
  return value.length >= minLength * (4 / 3) && /^[A-Za-z0-9+/]+=*$/.test(value);
}
