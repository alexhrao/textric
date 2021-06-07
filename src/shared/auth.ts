import {
    createCipheriv,
    createDecipheriv,
    createHash,
    scrypt,
    randomBytes,
} from 'crypto';
import bigrandom from 'crypto-random-string';
import {
    DeviceHashPayload,
    ServerHashPayload,
    isServerHash,
    PasswordHash,
    SALT_LEN,
    KEY_LEN,
    HASH_ALG,
    ENC_ALG,
    EncryptedPayload,
} from './types/authentication';

const WS_NONCE_LEN = 32;

export async function hashPassword(
    pass: string,
    salt: string,
): Promise<PasswordHash>;
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

type HashPayload = DeviceHashPayload | ServerHashPayload;

export function fingerprint(payload: DeviceHashPayload): string;
export function fingerprint(payload: ServerHashPayload): string;
export function fingerprint(payload: HashPayload): string {
    const hasher = createHash(HASH_ALG);
    if (isServerHash(payload)) {
        // have server
        hasher.update(payload.passHash);
    } else {
        const passHasher = createHash(HASH_ALG);
        const salt = payload.salt;
        passHasher.update(salt);
        passHasher.update(payload.pass);
        hasher.update(passHasher.digest().toString('base64'));
    }
    hasher.update(payload.deviceID);
    hasher.update(payload.nonce);
    return hasher.digest().toString('base64');
}
export function fakeSalt(handle: string): string {
    const hasher = createHash(HASH_ALG);
    hasher.update(handle);
    return hasher.digest().slice(0, SALT_LEN).toString('base64');
}
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

export function socketDecrypt(
    fingerprint: string,
    ciphertext: EncryptedPayload,
): string {
    const key = extractKey(fingerprint);
    const { iv, payload } = ciphertext;
    const cipher = createDecipheriv(ENC_ALG, key, iv);
    return cipher.update(payload, 'base64', 'utf8') + cipher.final('utf8');
}

export function wsNonce(): bigint {
    return BigInt(bigrandom({ length: WS_NONCE_LEN, type: 'numeric' }));
}
