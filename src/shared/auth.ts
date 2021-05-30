import { createHash, Hash, randomBytes } from "crypto";
import { HashAlgorithm, DeviceHashPayload, ServerHashPayload, isServerHash, PasswordHash, SALT_LEN } from "./types/authentication";

function translateHash(alg: HashAlgorithm): Hash {
    switch (alg) {
        case HashAlgorithm.SHA256:
            return createHash('sha256');
        default:
            throw new Error(`Unknown Hash Algorithm with ID ${alg}`);
    }
}

export async function hashPassword(pass: string, alg: HashAlgorithm): Promise<PasswordHash> {
    const salt = (await generateNonce(SALT_LEN)).toString('base64');
    const hasher = translateHash(alg);
    hasher.update(salt);
    hasher.update(pass);
    const hash = hasher.digest().toString('base64');
    return { salt, alg, hash };
}

export function fingerprint(payload: DeviceHashPayload): string;
export function fingerprint(payload: ServerHashPayload): string;
export function fingerprint(payload: DeviceHashPayload|ServerHashPayload): string {
    const hasher = translateHash(payload.hashAlg);
    if (isServerHash(payload)) {
        // have server
        hasher.update(payload.passHash);
    } else {
        const passHasher = translateHash(payload.hashAlg);
        const salt = payload.salt;
        passHasher.update(salt);
        passHasher.update(payload.pass);
        hasher.update(passHasher.digest().toString('base64'));
    }
    hasher.update(payload.deviceID);
    hasher.update(payload.nonce);
    return hasher.digest().toString('base64');
}

export async function generateNonce(length: number = 16): Promise<Buffer> {
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