import { hashPassword } from '../shared/auth';
import {
    DeviceType,
    HashAlgorithm,
    NewUserPayload,
} from '../shared/types/authentication';
import { promises as fs } from 'fs';
import { randomInt } from 'crypto';
import { join } from 'path';
import { Collection } from 'mongodb';
import { getClient, DB } from './mongoConnector';

const NUM_LEN = 5;
const HANDLE_TTL = 5 * 60 * 1000;
const USER_COL = 'users';
const HANDLE_COL = 'handles';

const adjectives = fs
    .readFile(join(__dirname, 'adjectives.txt'))
    .then((buf) => buf.toString('utf-8'))
    .then((str) => str.split(/\r\n|\n\r|\n|\r/g));

const nouns = fs
    .readFile(join(__dirname, 'nouns.txt'))
    .then((buf) => buf.toString('utf-8'))
    .then((str) => str.split(/\r\n|\n\r|\n|\r/g));

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

interface HandleCandidate {
    handle: string;
    timecreated: number;
}

function properNoun(str: string): string {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();
}

async function getUserCol(): Promise<Collection<User>> {
    const client = await getClient();
    return client.db(DB).collection<User>(USER_COL);
}

async function getHandleCol(): Promise<Collection<HandleCandidate>> {
    const client = await getClient();
    return client.db(DB).collection<HandleCandidate>(HANDLE_COL);
}

export async function generateHandle(): Promise<string> {
    const adj = await adjectives;
    const noun = await nouns;

    const col = await getHandleCol();
    let handle = '';

    do {
        const accountNum = randomInt(0, 10 ** NUM_LEN)
            .toString(10)
            .padStart(5, '0');
        const first = properNoun(adj[randomInt(0, adj.length)]);
        const second = properNoun(noun[randomInt(0, noun.length)]);
        handle = `${first}${second}#${accountNum}`;
    } while ((await col.findOne({ handle })) !== null);
    await col.insertOne({
        handle,
        timecreated: Date.now(),
    });
    // store it in db...
    // in 5 minutes, kill it!
    setTimeout(async () => {
        // remove it...
        await col.deleteOne({ handle });
    }, HANDLE_TTL);
    return handle;
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
    };
    const col = await getUserCol();
    await col.insertOne(payload);
}

async function updateUser(user: User): Promise<void> {
    const col = await getUserCol();
    await col.findOneAndReplace({ handle: user.handle }, user);
}

export async function getUser(handle: string): Promise<User> {
    const col = await getUserCol();
    const user = await col.findOne({ handle });
    if (user === null) {
        throw new Error(`User with handle ${handle} not found`);
    } else {
        return user;
    }
}

export async function revokeDevice(
    handle: string,
    deviceID: string,
    print: string,
): Promise<void> {
    try {
        const user = await getUser(handle);
        if (
            deviceID in user.devices &&
            user.devices[deviceID].fingerprint === print
        ) {
            delete user.devices[deviceID];
            await updateUser(user);
        }
    } catch (e) {
        // swallow errors!
    }
}

export async function addDevice(
    handle: string,
    deviceID: string,
    print: string,
): Promise<void> {
    const user = await getUser(handle);
    if (deviceID in user.devices && user.devices[deviceID].verified) {
        // bad!
        throw new Error('Device already exists');
    }
    user.devices[deviceID] = {
        verified: false,
        fingerprint: print,
        id: deviceID,
        info: {
            name: 'Unverified',
            os: 'Unverified',
            type: DeviceType.Unknown,
        },
    };
    console.log(user.devices[deviceID]);
    await updateUser(user);
}

export async function completeDevice(
    handle: string,
    device: Device,
): Promise<void> {
    // check if prints match
    try {
        const user = await getUser(handle);
        if (device.id in user.devices) {
            // check the prints
            if (device.fingerprint !== user.devices[device.id].fingerprint) {
                throw new Error('Authentication Error');
            } else {
                // ready!
                user.devices[device.id] = device;
                await updateUser(user);
            }
        } else {
            throw new Error('Authentication Error');
        }
    } catch (e) {
        throw new Error('Authentication Error');
    }
}
