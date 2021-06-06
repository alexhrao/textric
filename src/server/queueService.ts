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

const QUEUE_DB = 'messagequeues';
const POLL_INT = 5000;

interface QueuedMessage {
    _id: ObjectId;
    addrs: Address[];
    msg: ServerMessage;
}

export interface DeviceSocket {
    handle: string;
    deviceID: string;
    fingerprint: string;
    socket: WebSocket;
}
interface ConnectionLibrary {
    [handle: string]: {
        [deviceID: string]: DeviceSocket;
    };
}
// Index with handle, then with deviceID
const conns: ConnectionLibrary = {};

async function getMessageCol(
    handle: string,
): Promise<Collection<QueuedMessage>> {
    const client = await getClient();
    return client.db(QUEUE_DB).collection<QueuedMessage>(handle);
}

export async function queue(msgs: ServerMessage[]): Promise<void>;
export async function queue(msg: ServerMessage): Promise<void>;
export async function queue(
    msg: ServerMessage | ServerMessage[],
): Promise<void> {
    let testDst: Address | string;
    if (Array.isArray(msg)) {
        if (msg.length === 0) {
            return;
        }
        testDst = msg[0].dst;
    } else {
        testDst = msg.dst;
    }
    const dst = typeof testDst === 'string' ? testDst : testDst.handle;
    const queue = await getMessageCol(dst);
    const addrs: Address[] = [];
    if (typeof testDst === 'string') {
        const user = await getUser(dst);
        addrs.push(
            ...Object.keys(user.devices).map((d) => {
                return {
                    handle: dst,
                    deviceID: d,
                };
            }),
        );
    } else {
        addrs.push(testDst);
    }
    if (Array.isArray(msg)) {
        queue.insertMany(
            msg.map((msg) => {
                return { msg, addrs };
            }),
        );
    } else {
        queue.insertOne({ msg, addrs });
    }
}

export function register(ds: DeviceSocket): void {
    const { handle, deviceID, socket } = ds;
    if (!(handle in conns)) {
        conns[ds.handle] = {};
    }
    if (deviceID in conns[handle]) {
        // we're already listening...?
        throw new Error('Device already listening...');
    }
    conns[handle][deviceID] = ds;

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
                socket.send(JSON.stringify(qm.msg), async (err) => {
                    if (err !== undefined) {
                        // close the socket...
                        delete conns[handle][deviceID];
                        if (Object.keys(conns[handle]).length === 0) {
                            delete conns[handle];
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
