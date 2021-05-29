import { hashPassword } from "@shared/auth";
import { DeviceType, HashAlgorithm, NewUserPayload } from "@shared/types/authentication";

export interface Device {
    id: string;
    fingerprint: string;
    verified: boolean;
    info: {
        name: string;
        os: string;
        type: DeviceType;
    };
}
// This is only at server, so... no need to make this shared
export interface User {
    handle: string;
    passhash: string;
    salt: string;
    hashalg: HashAlgorithm;
    createdate: number; // Unix timestamp in UTC?
    devices: {
        [deviceID: string]: Device;
    };
}


export async function createUser(user: NewUserPayload): Promise<void> {
    // get a salt
    const hash = await hashPassword(user.password, HashAlgorithm.SHA256);
    const payload: User = {
        handle: user.handle,
        createdate: Date.now(),
        devices: {},
        hashalg: hash.alg,
        passhash: hash.hash,
        salt: hash.salt,
    }
    // TODO: Save somewhere...?
}

async function updateUser(user: User): Promise<void> {
    // TODO: Save to DB!
}

export async function getUser(handle: string): Promise<User> {
    throw new Error("Not Implemented");
}

export async function revokeDevice(handle: string, deviceID: string, print: string): Promise<void> {
    try {
        const user = await getUser(handle);
        if (deviceID in user.devices && user.devices[deviceID].fingerprint === print) {
            delete user.devices[deviceID];
            await updateUser(user);
        }
    } catch (e) {
        // swallow errors!
    }
}

export async function addDevice(handle: string, deviceID: string, print: string): Promise<void> {
    const user = await getUser(handle);
    if (deviceID in user.devices && user.devices[deviceID].verified) {
        // bad!
        throw new Error("Device already exists");
    }
    user.devices[deviceID] = {
        verified: false,
        fingerprint: print,
        id: deviceID,
        info: {
            name: 'Unverified',
            os: 'Unverified',
            type: DeviceType.Unknown,
        }
    };
    await updateUser(user);
}

export async function completeDevice(handle: string, device: Device): Promise<void> {
    // check if prints match
    try {
        const user = await getUser(handle);
        if (device.id in user.devices) {
            // check the prints
            if (device.fingerprint !== user.devices[device.id].fingerprint) {
                throw new Error("Authentication Error");
            } else {
                // ready!
                user.devices[device.id] = device;
                await updateUser(user);
            }
        } else {
            throw new Error("Authentication Error");
        }
    } catch (e) {
        throw new Error("Authentication Error");
    }
}