export const SALT_LEN = 32;
export const NONCE_LEN = 16;
export const KEY_LEN = 32;
export const ENC_ALG = 'aes-256-ctr';
export const HASH_ALG = 'sha256';
export interface NewUserPayload {
    handle: string;
    password: string;
}
export function isNewUser(user: unknown): user is NewUserPayload {
    const payload = <NewUserPayload>user;
    if (typeof user !== 'object' || user === null || user === undefined) {
        return false;
    } else if (!('handle' in user && 'password' in user)) {
        return false;
    } else if (
        typeof payload.handle !== 'string' ||
        typeof payload.password !== 'string'
    ) {
        return false;
    } else if (payload.password.length === 0) {
        return false;
    } else {
        return true;
    }
}

export enum DeviceType {
    Mobile = 'mobile',
    Tablet = 'tablet',
    Desktop = 'desktop',
    Unknown = 'unknown',
}

// Interfaces for device enrollment
export interface DEInit {
    handle: string;
    deviceID: string;
}
export function isDEInit(init: unknown): init is DEInit {
    const payload = <DEInit>init;
    if (typeof init !== 'object' || init === null || init === undefined) {
        return false;
    } else if (
        !(
            'handle' in init &&
            'deviceID' in init &&
            Object.keys(init).length === 2
        )
    ) {
        return false;
    } else if (
        typeof payload.handle !== 'string' ||
        typeof payload.deviceID !== 'string'
    ) {
        return false;
    } else if (payload.deviceID.length === 0) {
        return false;
    } else {
        return true;
    }
}

export interface DEInitResponse {
    salt: string;
    nonce: string;
}
export function isDEInitResponse(init: unknown): init is DEInitResponse {
    const payload = <DEInitResponse>init;
    if (typeof init !== 'object' || init === null || init === undefined) {
        return false;
    } else if (
        !('salt' in init && 'hashAlgorithm' in init && 'nonce' in init)
    ) {
        return false;
    } else if (
        typeof payload.salt !== 'string' ||
        typeof payload.nonce !== 'string'
    ) {
        return false;
    } else {
        return true;
    }
}

export interface DEComplete {
    handle: string;
    deviceID: string;
    info?: {
        name?: string;
        os?: string;
        type?: DeviceType;
    };
    hash: string;
}
export function isDEComplete(comp: unknown): comp is DEComplete {
    const payload = <DEComplete>comp;
    if (typeof comp !== 'object' || comp === null || comp === undefined) {
        return false;
    } else if (!('handle' in comp && 'deviceID' in comp && 'hash' in comp)) {
        return false;
    } else if (
        typeof payload.handle !== 'string' ||
        typeof payload.deviceID !== 'string' ||
        typeof payload.hash !== 'string'
    ) {
        return false;
    } else {
        return true;
    }
    // No need to check the info payload... if it's there, it's there, otherwise not.
}

export interface EncryptedPayload {
    // Base-64 encoded IV
    iv: string;
    // Base-64 encoded, encrypted with ENC_ALG
    payload: string;
}
export function isEncryptedPayload(p: unknown): p is EncryptedPayload {
    if (typeof p !== 'object' || p === null) {
        return false;
    } else if (!('iv' in p && 'payload' in p)) {
        return false;
    }
    const payload = <EncryptedPayload>p;
    if (typeof payload.iv !== 'string' || typeof payload.payload !== 'string') {
        return false;
    }
    return true;
}

export interface WSOpener {
    handle: string;
    deviceID: string;
    // encrypt
    devNonce: EncryptedPayload;
}
export function isWSOpener(ws: unknown): ws is WSOpener {
    const payload = <WSOpener>ws;
    if (typeof ws !== 'object' || ws === null || ws === undefined) {
        return false;
    } else if (!('handle' in ws && 'deviceID' in ws && 'devNonce' in ws)) {
        return false;
    } else if (
        typeof payload.deviceID !== 'string' ||
        typeof payload.handle !== 'string' ||
        !isEncryptedPayload(payload.devNonce)
    ) {
        return false;
    } else {
        return true;
    }
}

export interface WSOpenResponse {
    devInc: EncryptedPayload;
    srvNonce: EncryptedPayload;
}
export function isWSOpenResponse(ws: unknown): ws is WSOpenResponse {
    const payload = <WSOpenResponse>ws;
    if (typeof ws !== 'object' || ws === null || ws === undefined) {
        return false;
    } else if (!('devInc' in ws && 'srvNonce' in ws)) {
        return false;
    } else if (
        !isEncryptedPayload(payload.devInc) ||
        !isEncryptedPayload(payload.srvNonce)
    ) {
        return false;
    } else {
        return true;
    }
}

// eslint-disable-next-line
interface SocketConfig {}
function isSocketConfig(config: unknown): config is SocketConfig {
    if (typeof config !== 'object' || config === null || config === undefined) {
        return false;
    } else {
        return true;
    }
}
export interface WSComplete {
    srvInc: EncryptedPayload;
    config: SocketConfig;
}
export function isWSComplete(ws: unknown): ws is WSComplete {
    const payload = <WSComplete>ws;
    if (typeof ws !== 'object' || ws === null || ws === undefined) {
        return false;
    } else if (!('srvInc' in ws && 'srvNonce' in ws)) {
        return false;
    } else if (
        !isEncryptedPayload(payload.srvInc) ||
        !isSocketConfig(payload.config)
    ) {
        return false;
    } else {
        return true;
    }
}
export interface WSAuth {
    deviceID: string;
    handle: string;
    fingerprint: string;
}
export function isWSAuth(auth: unknown): auth is WSAuth {
    const payload = <WSAuth>auth;
    if (typeof auth !== 'object' || auth === null || auth === undefined) {
        return false;
    } else if (
        !('handle' in auth && 'deviceID' in auth && 'fingerprint' in auth)
    ) {
        return false;
    } else if (
        typeof payload.deviceID !== 'string' ||
        typeof payload.handle !== 'string' ||
        typeof payload.fingerprint !== 'string'
    ) {
        return false;
    } else {
        return true;
    }
}

export interface DeviceHashPayload {
    deviceID: string;
    nonce: string;
    pass: string;
    salt: string;
}
export interface ServerHashPayload {
    deviceID: string;
    nonce: string;
    passHash: string;
}
export function isServerHash(
    hash: DeviceHashPayload | ServerHashPayload,
): hash is ServerHashPayload {
    if ('passHash' in hash) {
        return true;
    } else {
        return false;
    }
}

export interface NewPasswordPayload {
    handle: string;
    oldPassword: string;
    newPassword: string;
}
export function isNewPassword(pass: unknown): pass is NewPasswordPayload {
    const payload = <NewPasswordPayload>pass;
    if (typeof pass !== 'object' || pass === null || pass === undefined) {
        return false;
    } else if (
        !('handle' in pass && 'oldPassword' in pass && 'newPassword' in pass)
    ) {
        return false;
    } else if (
        typeof payload.handle !== 'string' ||
        typeof payload.oldPassword !== 'string' ||
        typeof payload.newPassword !== 'string'
    ) {
        return false;
    } else if (payload.newPassword.length === 0) {
        return false;
    } else {
        return true;
    }
}

export interface DeletePayload {
    handle: string;
    hash: string;
}
export function isDeletePayload(del: unknown): del is DeletePayload {
    const payload = <DeletePayload>del;
    if (typeof del !== 'object' || del === null || del === undefined) {
        return false;
    } else if (!('handle' in del && 'hash' in del)) {
        return false;
    } else if (
        typeof payload.handle !== 'string' ||
        typeof payload.hash !== 'string'
    ) {
        return false;
    } else {
        return true;
    }
}

export interface PasswordHash {
    hash: string;
    salt: string;
}
