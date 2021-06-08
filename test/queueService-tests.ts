import {
    queue,
    QueuedMessage,
    register,
    deregister,
    InternalSocket,
} from '../server/queueService';
import { isServerMessage, ServerMessage } from '../shared/types/Message';
import { closeMongo, setupMongo } from './mongoUtils';
import rewire from 'rewire';
import {
    addDevice,
    completeDevice,
    createUser,
    generateHandle,
    getUser,
    defaultDevice,
} from '../server/user';
import {
    fingerprint,
    generateNonce,
    socketDecrypt,
    socketEncrypt,
} from '../shared/auth';
import { isEncryptedPayload, NONCE_LEN } from '../shared/types/authentication';
import { expect } from 'chai';
import { getClient } from '../server/mongoConnector';
import WebSocket, { Server } from 'ws';
const queueModule = rewire('../server/queueService');
const queueDB: string = queueModule.__get__('QUEUE_DB');

setupMongo();

async function createUserWithDevice(complete = true) {
    const handle = await generateHandle();
    await createUser({ handle, password: 'password' });
    const user = await getUser(handle);
    const deviceID = '12:34:56:78';
    const nonce = (await generateNonce(NONCE_LEN)).toString('base64');
    const print = fingerprint({
        deviceID,
        nonce,
        passhash: user.passhash,
    });
    await addDevice(handle, deviceID, print);
    const device = defaultDevice(deviceID, print);
    if (complete) {
        const newNonce = await completeDevice(handle, device);
        device.fingerprint = fingerprint({
            deviceID,
            nonce: newNonce,
            passhash: user.passhash,
        });
    }
    return { user, device };
}

describe('Queue Service Unit Tests', function () {
    beforeEach(async function () {
        //await resetMongo();
    });
    after(async function () {
        await closeMongo();
    });
    describe('Message Queueing Unit Tests', function () {
        it('Should not queue message for non-existent destination handle', async function () {
            const { user, device } = await createUserWithDevice();
            const { handle } = user;
            const { id: deviceID } = device;
            const msg: ServerMessage = {
                src: { handle, deviceID },
                dst: 'NonexistentHandle#12345',
                payload: 'NOT MODIFIED',
            };
            await expect(queue(msg)).to.be.rejected;
        });

        it('Should not queue message for non-existent source handle', async function () {
            const { user, device } = await createUserWithDevice();
            const { id: deviceID } = device;
            const msg: ServerMessage = {
                src: { handle: 'NonexistentHandle#12345', deviceID },
                dst: user.handle,
                payload: 'NOT MODIFIED',
            };
            await expect(queue(msg)).to.be.rejected;
        });

        it('Should not queue message for non-existent source device', async function () {
            const { user, device } = await createUserWithDevice();
            const { id: deviceID } = device;
            const msg: ServerMessage = {
                src: { handle: user.handle, deviceID: deviceID + '1' },
                dst: user.handle,
                payload: 'NOT MODIFIED',
            };
            await expect(queue(msg)).to.be.rejected;
        });

        it('Should queue message for valid source and dest', async function () {
            const { user, device } = await createUserWithDevice();
            const { id: deviceID } = device;
            const msg: ServerMessage = {
                src: { handle: user.handle, deviceID: deviceID },
                dst: user.handle,
                payload: 'NOT MODIFIED',
            };
            await expect(queue(msg)).to.be.fulfilled;
            // check that it is in db
            const inDB = await (await getClient())
                .db(queueDB)
                .collection<QueuedMessage>(user.handle)
                .findOne({});

            expect(inDB).not.to.be.null;
            expect(inDB).to.have.deep.property('addrs', [
                { handle: user.handle, deviceID },
            ]);
            expect(inDB).to.have.deep.property('msg', msg);
        });
    });
    describe('Device Registration', function () {
        it('Should not register a closed socket', async function () {
            // create valid user, device, connect but then close before registration
            const { user, device } = await createUserWithDevice();
            const server = new Server({ port: 8080 });
            const killer = new Promise<void>((res, rej) => {
                server.on('connection', async (ws) => {
                    // ws is client
                    // register it... but not before client closes it!
                    ws.close();
                    try {
                        await register({
                            deviceID: device.id,
                            fingerprint: device.fingerprint,
                            handle: user.handle,
                            socket: ws,
                        });
                    } catch (e) {
                        rej(e);
                        return;
                    }
                    res();
                });
            });
            const client = new WebSocket('ws://127.0.0.1:8080');
            client.on('open', async function () {
                // we're closing!
                await killer;
                client.close();
            });
            try {
                await expect(killer).to.be.rejected;
            } finally {
                await new Promise<void>((res) => {
                    server.close(function () {
                        res();
                    });
                });
            }
        });
        it('Should not register a device with an invalid handle', async function () {
            const { user, device } = await createUserWithDevice();
            const server = new Server({ port: 8080 });
            const killer = new Promise<void>((res, rej) => {
                server.on('connection', async (ws) => {
                    // ws is client
                    // register it... but not before client closes it!
                    try {
                        await register({
                            deviceID: device.id,
                            fingerprint: device.fingerprint,
                            handle: user.handle + 'abcd',
                            socket: ws,
                        });
                    } catch (e) {
                        rej(e);
                        return;
                    } finally {
                        ws.close();
                    }
                    res();
                });
            });
            const client = new WebSocket('ws://127.0.0.1:8080');
            client.on('open', async function () {
                // we're closing!
                await killer;
                client.close();
            });
            try {
                await expect(killer).to.be.rejected;
            } finally {
                await new Promise<void>((res) => {
                    server.close(function () {
                        res();
                    });
                });
            }
        });
        it('Should not register an unverified device', async function () {
            const { user, device } = await createUserWithDevice(false);
            const server = new Server({ port: 8080 });
            const killer = new Promise<void>((res, rej) => {
                server.on('connection', async (ws) => {
                    // ws is client
                    // register it... but not before client closes it!
                    try {
                        await register({
                            deviceID: device.id,
                            fingerprint: device.fingerprint,
                            handle: user.handle,
                            socket: ws,
                        });
                    } catch (e) {
                        rej(e);
                        return;
                    } finally {
                        ws.close();
                    }
                    res();
                });
            });
            const client = new WebSocket('ws://127.0.0.1:8080');
            client.on('open', async function () {
                // we're closing!
                await killer;
                client.close();
            });
            try {
                await expect(killer).to.be.rejected;
            } finally {
                await new Promise<void>((res) => {
                    server.close(function () {
                        res();
                    });
                });
            }
        });
        it('Should not register an unknown device', async function () {
            const { user, device } = await createUserWithDevice();
            const server = new Server({ port: 8080 });
            const killer = new Promise<void>((res, rej) => {
                server.on('connection', async (ws) => {
                    // ws is client
                    // register it... but not before client closes it!
                    try {
                        await register({
                            deviceID: device.id + '12:34',
                            fingerprint: device.fingerprint,
                            handle: user.handle,
                            socket: ws,
                        });
                    } catch (e) {
                        rej(e);
                        return;
                    } finally {
                        ws.close();
                    }
                    res();
                });
            });
            const client = new WebSocket('ws://127.0.0.1:8080');
            client.on('open', async function () {
                // we're closing!
                await killer;
                client.close();
            });
            try {
                await expect(killer).to.be.rejected;
            } finally {
                await new Promise<void>((res) => {
                    server.close(function () {
                        res();
                    });
                });
            }
        });
        it('Should not register with an incorrect fingerprint', async function () {
            const { user, device } = await createUserWithDevice();
            const server = new Server({ port: 8080 });
            const killer = new Promise<void>((res, rej) => {
                server.on('connection', async (ws) => {
                    // ws is client
                    // register it... but not before client closes it!
                    try {
                        await register({
                            deviceID: device.id,
                            fingerprint: `1${device.fingerprint.substring(1)}`,
                            handle: user.handle,
                            socket: ws,
                        });
                    } catch (e) {
                        rej(e);
                        return;
                    } finally {
                        ws.close();
                    }
                    res();
                });
            });
            const client = new WebSocket('ws://127.0.0.1:8080');
            client.on('open', async function () {
                // we're closing!
                await killer;
                client.close();
            });
            try {
                await expect(killer).to.be.rejected;
            } finally {
                await new Promise<void>((res) => {
                    server.close(function () {
                        res();
                    });
                });
            }
        });
        it('Should pump down a valid message', async function () {
            const POLL_INT: number = queueModule.__get__('POLL_INT');
            this.timeout(10 * POLL_INT);
            const { user, device } = await createUserWithDevice();
            const server = new Server({ port: 8080 });
            const payload = 'DO NOT MODIFY';

            const handler = new Promise<void>((res, rej) => {
                const client = new WebSocket('ws://127.0.0.1:8080');
                client.on('open', async function () {
                    // send a message
                    const msg: ServerMessage = {
                        dst: user.handle,
                        src: { handle: user.handle, deviceID: device.id },
                        payload,
                    };
                    // now when we receive a message, check the payload. if it matches, good to go!
                    client.on('message', (data) => {
                        const enc = JSON.parse(data.toString('utf8'));
                        if (isEncryptedPayload(enc)) {
                            const plain: ServerMessage = JSON.parse(
                                socketDecrypt(device.fingerprint, enc),
                            );
                            expect(plain).to.have.property('payload', payload);
                            res();
                        }
                    });
                    const enc = await socketEncrypt(
                        device.fingerprint,
                        JSON.stringify(msg),
                    );
                    client.send(JSON.stringify(enc));
                });
                server.on('connection', async (ws) => {
                    // ws is client
                    // register it... but not before client closes it!
                    try {
                        await register({
                            deviceID: device.id,
                            fingerprint: device.fingerprint,
                            handle: user.handle,
                            socket: ws,
                        });
                    } catch (e) {
                        rej(e);
                        return;
                    }
                    // when we get a message, it should be pumped down to the client...
                    // so create the client in this promise!
                    ws.on('message', (data) => {
                        const enc = JSON.parse(data.toString('utf8'));
                        const msg = JSON.parse(
                            socketDecrypt(device.fingerprint, enc),
                        );
                        if (!isServerMessage(msg)) {
                            ws.close();
                            rej();
                        } else {
                            queue(msg);
                            // wait 2*poll_int
                            setTimeout(() => ws.close(), 2 * POLL_INT);
                        }
                    });
                });
            });
            try {
                await expect(handler).to.be.fulfilled;
            } finally {
                await new Promise<void>((res) => {
                    server.close(function () {
                        res();
                    });
                });
            }
        });
        it('Should deregister unknown handle', function () {
            expect(deregister('Unknown#12345', '12:34:56:78')).not.to.throw;
        });
        it('Should deregister unknown device', async function () {
            const { user, device } = await createUserWithDevice();
            expect(deregister(user.handle, device.id + '1')).not.to.throw;
        });
        it('Should remove deregistered device', async function () {
            const handle = 'handle';
            const deviceID = 'deviceID';
            const fingerprint = 'fingerprint';
            const socket: WebSocket = {} as unknown as WebSocket;
            const conns: Map<string, Map<string, InternalSocket>> =
                queueModule.__get__('conns');
            // add fake connection
            const handler = new Promise<void>((res, rej) => {
                const devMap = new Map<string, InternalSocket>();
                const closer = () => res();
                devMap.set('12:34:56:78', {
                    handle,
                    deviceID,
                    fingerprint,
                    closer,
                    socket,
                });
                conns.set('handle', devMap);
                deregister(handle, deviceID);
                rej();
            });
            expect(handler).to.be.fulfilled;
        });
    });
});
