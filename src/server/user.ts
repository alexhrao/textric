import { fingerprint, generateNonce, hashPassword } from '../shared/auth';
import {
    DeviceType,
    NewUserPayload,
    NONCE_LEN,
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

/**
 * Create a Default Device
 * @param id The Device Identifier
 * @param print The fingerprint for this device
 * @returns A device that is suitable for default purposes
 */
export function defaultDevice(id: string, print: string): Device {
    return {
        fingerprint: print,
        id,
        info: {
            name: 'DefaultDevice',
            os: 'DefaultOS',
            type: DeviceType.Unknown,
        },
        verified: false,
    };
}

const adjectives = fs
    .readFile(join(__dirname, 'adjectives.txt'))
    .then((buf) => buf.toString('utf-8'))
    .then((str) => str.split(/\r\n|\n\r|\n|\r/g));

const nouns = fs
    .readFile(join(__dirname, 'nouns.txt'))
    .then((buf) => buf.toString('utf-8'))
    .then((str) => str.split(/\r\n|\n\r|\n|\r/g));

/**
 * Device: A single endpoint for a user
 */
export interface Device {
    /**
     * The unique identifier for this device. This could be something like
     * a MAC address or IMEI number; it should be globally unique, and
     * _must_ be unique for the user.
     */
    id: string;
    /**
     * The unique fingerprint for this device. @see fingerprint for more information.
     */
    fingerprint: string;
    /**
     * True if this device has completed enrollment; false otherwise
     */
    verified: boolean;
    /**
     * Information on this device
     */
    info: {
        /**
         * The human-readable device name (i.e., "J. Doe's iPhone")
         */
        name: string;
        /**
         * The Operating System for this device (i.e., Windows 10)
         */
        os: string;
        /**
         * The type of this device.
         */
        type: DeviceType;
    };
}
/**
 * A User object, as stored in MongoDB
 */
export interface User {
    /**
     * The unique identifier for this user. Always consists of an adjective and noun, followed by a 5 digit number
     * For example, "LonelyBadger#12345".
     */
    handle: string;
    /**
     * The salted + hashed password, using scrypt
     */
    passhash: string;
    /**
     * The salt used by scrypt to hash the password
     */
    salt: string;
    /**
     * The date & time when this user account was created, as a UNIX timestamp
     */
    createdate: number;
    /**
     * The devices this user has already registered
     *
     * The Key is the device ID, the unique identifier used at the enrollment step.
     */
    devices: Map<string, Device>;
}
/**
 * A candidate for a user handle. This is a handle that has been generated,
 * but has yet to be used for a user
 */
export interface HandleCandidate {
    /**
     * The suggested handle
     */
    handle: string;
    /**
     * The time created, as a UNIX timestamp
     */
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
/**
 * Generate a viable handle
 *
 * A handle is an adjective, a noun, and a five-digit number, like
 * `EnigmaticPenguin#12345`. The handle is guaranteed to be viable for
 * five minutes; only handles that were previously generated are allowed
 * to be used for user generation.
 *
 * @returns A promise that resolves to the handle
 */
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
    return handle;
}

async function checkHandle(handle: string): Promise<boolean> {
    const col = await getHandleCol();
    await col.deleteMany({
        timecreated: {
            $lte: Date.now() - HANDLE_TTL,
        },
    });
    const check = await col.findOneAndDelete({ handle });
    return !!check.ok && check.value !== null;
}

/**
 * Create a new user
 *
 * For the given user, this will hash the user's password, then
 * commit it to the backing datastore (i.e., MongoDB)
 *
 * @param user The user to create
 * @returns A promise that resolves when the user is created
 *
 * @throws Will throw an error if the handle is not viable
 */
export async function createUser(user: NewUserPayload): Promise<void> {
    // get a salt
    // check that new user is viable
    if (!(await checkHandle(user.handle))) {
        throw new Error(`Handle ${user.handle} is not viable`);
    }
    let passed = false;
    try {
        await getUser(user.handle);
        // if we made it here... it already exists! bail
        passed = false;
    } catch (e) {
        passed = true;
    }
    if (!passed) {
        throw new Error(`Handle ${user.handle} is not viable`);
    }
    const hash = await hashPassword(user.password);
    const payload: User = {
        handle: user.handle,
        createdate: Date.now(),
        devices: new Map(),
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

/**
 * Retrieve a user from the database
 *
 * @param handle The handle for the requested User
 * @returns A promise that resolves to the specified user
 *
 * @throws Will throw if a user with that handle doesn't exist
 */
export async function getUser(handle: string): Promise<User> {
    const col = await getUserCol();
    const user = await col.findOne({ handle });
    if (user === null) {
        throw new Error(`User with handle ${handle} not found`);
    } else {
        const out = { ...user };
        out.devices = new Map(Object.entries(user.devices));
        return out;
    }
}

/**
 * Delete an authenticated user
 * @param handle The user to delete
 * @param hash The password + salt hash
 * @returns A promise that resolves upon deletion
 *
 * @throws Will throw if the hash does not match
 * @throws Will throw if the user does not exist
 */
export async function deleteUser(handle: string, hash: string): Promise<void> {
    const user = await getUser(handle);
    if (user.passhash !== hash) {
        throw new Error('Invalid hash');
    } else {
        const col = await getUserCol();
        await col.findOneAndDelete({ handle });
    }
}

/**
 * Update the password for a user
 *
 * Note that changing a password necessarily invalidates
 * all previously enrolled devices.
 * @param handle The user whose password should be changed
 * @param oldPass The current password
 * @param newPass The new password to change to
 * @returns A promise that resolves when the password has been changed
 * @throws Will throw if the current password isn't correct
 */
export async function changePassword(
    handle: string,
    oldPass: string,
    newPass: string,
): Promise<void> {
    const user = await getUser(handle);
    // check user password
    if ((await hashPassword(oldPass, user.salt)).hash !== user.passhash) {
        throw new Error('Old password is incorrect');
    } else {
        const pass = await hashPassword(newPass);
        user.devices = new Map();
        user.passhash = pass.hash;
        user.salt = pass.salt;
        await updateUser(user);
    }
}
/**
 * Revoke a previously-authenticated device
 *
 * This revokes a device that was previously enrolled via the
 * Device Enrollment API.
 * If the device was only half-enrolled (i.e., it didin't complete
 * the enrollment process), it will be revoked just the same.
 *
 * @param handle The user for which to revoke this device
 * @param deviceID The ID of the device to revoke
 * @param print The fingerprint of the device to revoke
 * @throws Will throw if the print is incorrect
 */
export async function revokeDevice(
    handle: string,
    deviceID: string,
    print: string,
): Promise<void> {
    const user = await getUser(handle);
    if (
        user.devices.has(deviceID) &&
        user.devices.get(deviceID)?.fingerprint === print
    ) {
        user.devices.delete(deviceID);
        await updateUser(user);
    } else {
        throw new Error('Bad Authentication');
    }
}
/**
 * Add a device to be verified
 *
 * This represents the first half of the Device Enrollment process.
 * This function will add an unverfied device to the user's document;
 * note that it will be unable to receive messages until the enrollment
 * process is complete.
 *
 * @see completeDevice To complete the process
 * @param handle The user trying to register a device
 * @param deviceID The unique identifier of the device to register
 * @param print The fingerprint for this device
 * @returns A promise which resolves when the device has completed registration
 * @throws Will throw if the device already exists
 */
export async function addDevice(
    handle: string,
    deviceID: string,
    print: string,
): Promise<void> {
    const user = await getUser(handle);
    if (user.devices.has(deviceID) && user.devices.get(deviceID)?.verified) {
        // bad!
        throw new Error('Device already exists');
    }
    user.devices.set(deviceID, defaultDevice(deviceID, print));
    await updateUser(user);
}
/**
 * Complete device verification
 *
 * This represents the second half of the Device Enrollment process.
 * This function will verify an already-registered device, and will generate
 * a new fingerprint. This fingerprint will be the same, except using a different
 * nonce - which is generated by this function - to generate this fingerprint.
 * It is expected that this nonce will be sent back to the device, so that it
 * may also generate the correct fingerprint
 *
 * @see addDevice To start the process
 * @param handle The user to complete the device of
 * @param device The device to complete
 * @returns A promise that resolves to the new NONCE to be used for the fingerprint
 * @throws If the device was not previously registered
 */
export async function completeDevice(
    handle: string,
    device: Device,
): Promise<string> {
    // check if prints match
    try {
        const user = await getUser(handle);
        if (user.devices.has(device.id)) {
            // check the prints
            if (
                device.fingerprint !== user.devices.get(device.id)?.fingerprint
            ) {
                throw new Error('Authentication Error');
            } else {
                // ready!
                const info = {
                    name: device.info.name,
                    os: device.info.os,
                    type: device.info.type,
                };
                const nonce = await generateNonce(NONCE_LEN);
                const print = fingerprint({
                    deviceID: device.id,
                    nonce: nonce.toString('base64'),
                    passhash: user.passhash,
                });
                const dev: Device = {
                    id: device.id,
                    verified: true,
                    info,
                    fingerprint: print,
                };
                user.devices.set(device.id, dev);
                await updateUser(user);
                return nonce.toString('base64');
            }
        } else {
            throw new Error('Authentication Error');
        }
    } catch (e) {
        throw new Error('Authentication Error');
    }
}
