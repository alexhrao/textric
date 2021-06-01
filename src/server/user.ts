import { hashPassword } from '../shared/auth';
import {
  DeviceType,
  HashAlgorithm,
  NewUserPayload
} from '../shared/types/authentication';
import { promises as fs } from 'fs';
import { randomInt } from 'crypto';
import { join } from 'path';

const NUM_LEN = 5;
const HANDLE_TTL = 5 * 60 * 1000;

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

function properNoun(str: string): string {
  return str.charAt(0).toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();
}

export async function generateHandle(): Promise<string> {
  const adj = await adjectives;
  const noun = await nouns;

  const accountNum = randomInt(0, 10 ** NUM_LEN);
  const first = properNoun(adj[randomInt(0, adj.length)]);
  const second = properNoun(noun[randomInt(0, noun.length)]);

  const handle = `${first}${second}#${accountNum}`;

  // store it in db...

  // Check it doesn't already exist... if it does, do this again?
  /*
  if (false) {
    return generateHandle();
  }
  */
  // in 5 minutes, kill it!
  setTimeout(() => {
    // remove it...
    console.log(`@${handle} was removed`);
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
    salt: hash.salt
  };
  // TODO: Save somewhere...?
}

async function updateUser(user: User): Promise<void> {
  // TODO: Save to DB!
}

export async function getUser(handle: string): Promise<User> {
  throw new Error('Not Implemented');
}

export async function revokeDevice(
  handle: string,
  deviceID: string,
  print: string
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
  print: string
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
      type: DeviceType.Unknown
    }
  };
  await updateUser(user);
}

export async function completeDevice(
  handle: string,
  device: Device
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
