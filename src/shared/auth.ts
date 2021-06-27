import {
    createCipheriv,
    createDecipheriv,
    createHash,
    scrypt,
    randomBytes,
} from 'crypto';
import bigrandom from 'crypto-random-string';
import {
    SALT_LEN,
    KEY_LEN,
    HASH_ALG,
    ENC_ALG,
    EncryptedPayload,
} from './types/authentication';

const WS_NONCE_LEN = 32;

/**
 * Payload for creating a fingerprint
 */
export interface HashPayload {
    /**
     * The ID for the device to fingerprint
     */
    deviceID: string;
    /**
     * The nonce to use for the fingerprint
     */
    nonce: string;
    /**
     * The password + salt hash, from scrypt
     */
    passhash: string;
}
/**
 * Complete Password Hash
 */
export interface PasswordHash {
    /**
     * The hash itself
     */
    hash: string;
    /**
     * The salt that was used during password hashing
     */
    salt: string;
}
/**
 * Hash a password using Scrypt
 *
 * @param pass The password to hash
 * @param salt The salt to use. Note that this salt should be cryptographically random
 * @returns A promise that resolves to the hashed password + salt
 */
export async function hashPassword(
    pass: string,
    salt: string,
): Promise<PasswordHash>;
/** Hash a password using Scrypt
 *
 * The salt is randomly generated using `generateNonce`.
 *
 * @see generateNonce
 * @param pass The password to hash
 * @returns A promise that resolves to the hashed password + salt
 */
export async function hashPassword(pass: string): Promise<PasswordHash>;
export async function hashPassword(
    pass: string,
    s?: string,
): Promise<PasswordHash> {
    const salt = s ?? (await generateNonce(SALT_LEN)).toString('base64');
    return new Promise<PasswordHash>((res, rej) => {
        scrypt(pass, salt, KEY_LEN, (err, key) => {
            if (err) {
                rej(err);
            } else {
                res({
                    salt,
                    hash: key.toString('base64'),
                });
            }
        });
    });
}

/** Generate a fingerprint for the given device
 *
 * @param payload The device information to fingerprint.
 * @returns A string, which is the base64 encoded fingerprint
 */
export function fingerprint(payload: HashPayload): string {
    const hasher = createHash(HASH_ALG);
    hasher.update(payload.passhash);
    hasher.update(payload.deviceID);
    hasher.update(payload.nonce);
    return hasher.digest().toString('base64');
}
/** Generate a fake salt
 *
 * This salt is **not meant** for real consumption; it is meant
 * to be feigned as a real one, to hide the existence of a
 * given user handle
 *
 * @param handle The handle for which to generate the fake salt
 * @returns A fake salt to use for user privacy
 */
export function fakeSalt(handle: string): string {
    const hasher = createHash(HASH_ALG);
    hasher.update(handle);
    return hasher.digest().slice(0, SALT_LEN).toString('base64');
}
/**
 * Generate a NONCE (or any cryptographically random string)
 *
 * @param length The length, in bytes, of the nonce
 * @returns A promise which resolves to the nonce buffer
 */
export async function generateNonce(length = 16): Promise<Buffer> {
    return new Promise<Buffer>((res, rej) => {
        randomBytes(length, (err, buf) => {
            if (err) {
                rej(err);
            } else {
                res(buf);
            }
        });
    });
}

function extractKey(fingerprint: string): Buffer {
    const key = Buffer.from(fingerprint, 'base64');
    if (key.length !== KEY_LEN) {
        throw new Error(`Fingerprint has invalid length ${key.length}`);
    }
    return key;
}
/**
 * Encrypt plaintext for sending down a WebSocket
 *
 * @param fingerprint The device fingerprint, to be used as a key
 * @param plaintext The plaintext to encrypt
 * @returns A promise which resolves to an `EncryptedPayload` that is suitable to be sent in a WebSocket
 * @throws Will throw if the fingerprint is not of a valid length
 */
export async function socketEncrypt(
    fingerprint: string,
    plaintext: string,
): Promise<EncryptedPayload> {
    const key = extractKey(fingerprint);
    // IV is always 16 bytes for AES
    const iv = await generateNonce(16);
    const cipher = createCipheriv(ENC_ALG, key, iv);
    const payload = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
        iv: iv.toString('base64'),
        payload: payload.toString('base64'),
    };
}
/**
 * Decrypt ciphertext
 *
 * @param fingerprint The device fingerprint, to be used as a key
 * @param ciphertext The ciphertext to decrypt
 * @returns The plaintext string
 * @throws Will throw if the fingerprint is not of a valid length
 */
export function socketDecrypt(
    fingerprint: string,
    ciphertext: EncryptedPayload,
): string {
    const key = extractKey(fingerprint);
    const { iv, payload } = ciphertext;
    const cipher = createDecipheriv(ENC_ALG, key, Buffer.from(iv, 'base64'));
    return cipher.update(payload, 'base64', 'utf8') + cipher.final('utf8');
}
/**
 * Get a Nonce for WebSocket handshakes
 * @returns A Big Integer, suitable as a large NONCE
 */
export function wsNonce(): bigint {
    return BigInt(bigrandom({ length: WS_NONCE_LEN, type: 'numeric' }));
}
