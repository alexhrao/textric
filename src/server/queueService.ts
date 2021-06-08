import { getClient } from './mongoConnector';
import {
    ServerMessage,
    Address,
    AuthMessage,
    MessageType,
} from '../shared/types/Message';
import { Collection, ObjectId } from 'mongodb';
import WebSocket from 'ws';
import { getUser } from './user';
import { socketEncrypt } from '../shared/auth';

const QUEUE_DB = 'messagequeues';
const POLL_INT = 5000;
/**
 * Interface for a Queued Message
 */
export interface QueuedMessage {
    /**
     * The ID assigned by MongoDB
     */
    _id: ObjectId;
    /**
     * List of addresses to send this message to
     */
    addrs: Address[];
    /**
     * The server message to send
     */
    msg: ServerMessage;
}
/**
 * Interface for a connected device
 */
export interface DeviceSocket {
    /**
     * Handle of the user that owns this device
     */
    handle: string;
    /**
     * ID of the connected device
     */
    deviceID: string;
    /**
     * Fingerprint of the connected device
     */
    fingerprint: string;
    /**
     * Socket through which device communication happens
     */
    socket: WebSocket;
}

// Index with handle, then with deviceID
const conns = new Map<string, Map<string, DeviceSocket>>();

async function getMessageCol(
    handle: string,
): Promise<Collection<QueuedMessage>> {
    const client = await getClient();
    return client.db(QUEUE_DB).collection<QueuedMessage>(handle);
}

/**
 * Queue many messages for sending
 *
 * Use this method for increased performance when queueing large numbers
 * of messages
 * @param msgs Messages to queue
 * @returns A promise that resolves when the messages have been queued
 * @throws Will throw if the source or destination does not exist
 */
export async function queue(msgs: ServerMessage[]): Promise<void>;
/**
 * Queue a message to be sent
 *
 * If the destination is a handle, then all the devices tied to that
 * handle will be queued.
 *
 * @param msg Single message to queue
 * @returns A promise that resolves when the message has been queued
 * @throws Will throw if the source or destination does not exist
 */
export async function queue(msg: ServerMessage): Promise<void>;
export async function queue(
    msg: ServerMessage | ServerMessage[],
): Promise<void> {
    let src: Address;
    let testDst: Address | string;
    if (Array.isArray(msg)) {
        if (msg.length === 0) {
            return;
        }
        testDst = msg[0].dst;
        src = msg[0].src;
    } else {
        testDst = msg.dst;
        src = msg.src;
    }
    // check that the source exists...?
    try {
        const srcUser = await getUser(src.handle);
        if (!(src.deviceID in srcUser.devices)) {
            throw new Error('Source does not exist');
        }
    } catch (e) {
        throw new Error('Queue Error');
    }
    const dst = typeof testDst === 'string' ? testDst : testDst.handle;
    const queue = await getMessageCol(dst);
    const addrs: Address[] = [];
    try {
        const user = await getUser(dst);
        if (typeof testDst === 'string') {
            addrs.push(
                ...Object.keys(user.devices).map((d) => {
                    return {
                        handle: dst,
                        deviceID: d,
                    };
                }),
            );
        } else {
            if (testDst.deviceID in user.devices) {
                addrs.push(testDst);
            } else {
                throw new Error('Destination Device does not exist');
            }
        }
    } catch (e) {
        throw new Error('Queue Error');
    }
    if (Array.isArray(msg)) {
        await queue.insertMany(
            msg.map((msg) => {
                return { msg, addrs };
            }),
        );
    } else {
        await queue.insertOne({ msg, addrs });
    }
}
/**
 * Register a device for notifications
 *
 * This will register a device to be sent messages as they arrive
 * in the queue. Message order is guaranteed on a best-effort basis;
 * the client should still ensure total ordering is maintained.
 *
 * @param ds Device Socket to register
 */
export function register(ds: DeviceSocket): void {
    const { handle, deviceID, socket } = ds;
    if (!conns.has(handle)) {
        conns.set(handle, new Map<string, DeviceSocket>());
    }
    // we just added it
    const devs = conns.get(handle);
    if (devs === undefined) {
        throw new Error('Impossible State');
    }
    if (devs.has(deviceID)) {
        throw new Error('Device already listening...');
    }
    devs.set(deviceID, ds);

    const closer = () => {
        socket.close();
        clearInterval(runner);
    };

    // add pumper... when the device dies, kill the pumper
    async function pumpdown(): Promise<void> {
        // ask the server if there are any messages...
        //  if there are, see if our address is in the list. if it is,
        //  send it down and remove ourselves from the list
        const queue = await getMessageCol(ds.handle);
        queue.find().forEach(async (qm) => {
            const ind = qm.addrs.findIndex(
                (a) => a.handle === handle && a.deviceID === deviceID,
            );
            if (ind !== -1) {
                // pump it down... if there's an error, do NOT mutate!
                const payload = await socketEncrypt(
                    ds.fingerprint,
                    JSON.stringify(qm.msg),
                );
                socket.send(JSON.stringify(payload), async (err) => {
                    if (err !== undefined) {
                        // close the socket...
                        conns.get(handle)?.delete(deviceID);
                        if (!(conns.get(handle)?.size)) {
                            conns.delete(handle);
                        }
                        closer();
                    } else {
                        // get rid of ours
                        await queue.updateOne(
                            { _id: qm._id },
                            {
                                $pull: {
                                    addrs: { handle, deviceID },
                                },
                            },
                        );
                        await queue.deleteOne({
                            _id: qm._id,
                            addrs: {
                                $size: 0,
                            },
                        });
                    }
                });
            }
        });
    }
    // schedule it!
    const runner = setInterval(() => pumpdown(), POLL_INT);
    socket.on('error', () => closer());
    socket.on('close', () => closer());

    const success: AuthMessage = {
        type: MessageType.AACK,
    };
    socket.send(JSON.stringify(success));
}
