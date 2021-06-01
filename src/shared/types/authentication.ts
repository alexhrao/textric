export const SALT_LEN = 32;
export const NONCE_LEN = 16;

export interface NewUserPayload {
  handle: string;
  password: string;
}
export function isNewUser(user: unknown): user is NewUserPayload {
  if (typeof user !== 'object' || user === null || user === undefined) {
    return false;
  } else if ('handle' in user && 'password' in user) {
    return true;
  } else {
    return false;
  }
}

export enum HashAlgorithm {
  SHA256 = 1
}

export enum DeviceType {
  Mobile = 'mobile',
  Tablet = 'tablet',
  Desktop = 'desktop',
  Unknown = 'unknown'
}

// Interfaces for device enrollment
export interface DEInit {
  userID: string;
  deviceID: string;
}
export function isDEInit(init: unknown): init is DEInit {
  if (typeof init !== 'object' || init === null || init === undefined) {
    return false;
  } else if (
    'userID' in init &&
    'deviceID' in init &&
    Object.keys(init).length === 2
  ) {
    return true;
  } else {
    return false;
  }
}

export interface DEInitResponse {
  salt: string;
  hashAlgorithm: HashAlgorithm;
  nonce: string;
}
export function isDEInitResponse(init: unknown): init is DEInitResponse {
  if (typeof init !== 'object' || init === null || init === undefined) {
    return false;
  } else if ('salt' in init && 'hashAlgorithm' in init && 'nonce' in init) {
    return true;
  } else {
    return false;
  }
}

export interface DEComplete {
  userID: string;
  deviceID: string;
  info?: {
    name?: string;
    os?: string;
    type?: DeviceType;
  };
  hash: string;
}
export function isDEComplete(comp: unknown): comp is DEComplete {
  if (typeof comp !== 'object' || comp === null || comp === undefined) {
    return false;
  } else if ('userID' in comp && 'deviceID' in comp && 'hash' in comp) {
    return true;
  } else {
    return false;
  }
}

export interface WSAuth {
  deviceID: string;
  userID: string;
  fingerprint: string;
}
export function isWSAuth(auth: unknown): auth is WSAuth {
  if (typeof auth !== 'object' || auth === null || auth === undefined) {
    return false;
  } else if ('userID' in auth && 'deviceID' in auth && 'fingerprint' in auth) {
    return true;
  } else {
    return false;
  }
}

export interface DeviceHashPayload {
  deviceID: string;
  nonce: string;
  hashAlg: HashAlgorithm;
  pass: string;
  salt: string;
}
export interface ServerHashPayload {
  deviceID: string;
  nonce: string;
  hashAlg: HashAlgorithm;
  passHash: string;
}
export function isServerHash(
  hash: DeviceHashPayload | ServerHashPayload
): hash is ServerHashPayload {
  if ('passHash' in hash) {
    return true;
  } else {
    return false;
  }
}

export interface PasswordHash {
  hash: string;
  salt: string;
  alg: HashAlgorithm;
}
