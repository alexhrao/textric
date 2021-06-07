import express from 'express';
import { Server } from 'ws';
import { Arguments } from 'yargs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import {
    addDevice,
    changePassword,
    completeDevice,
    createUser,
    deleteUser,
    Device,
    generateHandle,
    getUser,
} from './user';
import {
    DEInitResponse,
    isDEInit,
    NONCE_LEN,
    isDEComplete,
    DeviceType,
    isNewUser,
    isNewPassword,
    isDeletePayload,
    isWSOpener,
    WSOpenResponse,
    isWSComplete,
    isEncryptedPayload,
} from '../shared/types/authentication';
import {
    fakeSalt,
    fingerprint,
    generateNonce,
    socketDecrypt,
    socketEncrypt,
    wsNonce,
} from '../shared/auth';
import {
    ErrorMessage,
    isServerMessage,
    MessageType,
} from '../shared/types/Message';
import { setClient } from './mongoConnector';
import { queue, register } from './queueService';

const enum WSAuthStep {
    Unauthed,
    Opened,
    Complete,
}
export interface ServerOptions {
    'server-port'?: number;
    'socket-port'?: number;
    'mongo-user'?: string;
    'mongo-pass'?: string;
    'mongo-url'?: string;
}

// express!
export async function setupHttpServer(argv: ServerOptions): Promise<void> {
    const httpPort =
        argv['server-port'] ?? parseInt(process.env['SERVER_PORT'] ?? '3000');
    const httpServer = express();
    httpServer.use(express.json());

    /// User Account API
    httpServer.get('/api/users', async (req, res) => {
        generateHandle().then((handle) => {
            res.contentType('text/plain').send(handle).end();
        });
    });

    httpServer.post('/api/users', async (req, res) => {
        if (!isNewUser(req.body)) {
            res.sendStatus(400);
            return;
        }
        try {
            await createUser(req.body);
            res.sendStatus(204);
        } catch (e) {
            res.sendStatus(404);
        }
    });

    httpServer.patch('/api/users', async (req, res) => {
        if (!isNewPassword(req.body)) {
            res.sendStatus(400);
            return;
        }
        try {
            const { handle, oldPassword, newPassword } = req.body;
            await changePassword(handle, oldPassword, newPassword);
            res.sendStatus(204);
        } catch (e) {
            res.sendStatus(404);
        }
    });

    httpServer.put('/api/users', async (req, res) => {
        if (!isDeletePayload(req.body)) {
            res.sendStatus(400);
            return;
        }
        try {
            await deleteUser(req.body.handle, req.body.hash);
            res.sendStatus(204);
        } catch (e) {
            res.sendStatus(404);
        }
    });

    /// Device API
    httpServer.post('/api/devices', async (req, res) => {
        // verify req.body
        if (isDEInit(req.body)) {
            const payload = req.body;
            const resp: DEInitResponse = {
                nonce: (await generateNonce(NONCE_LEN)).toString('base64'),
                salt: '',
            };
            try {
                const user = await getUser(payload.handle);
                // success! fill in the salt, attach our hash (for checking later...)
                resp.salt = user.salt;
                const print = fingerprint({
                    deviceID: payload.deviceID,
                    nonce: resp.nonce,
                    passHash: user.passhash,
                });
                addDevice(payload.handle, payload.deviceID, print);
            } catch (e) {
                // couldn't find! fill in w/ random salt
                resp.salt = fakeSalt(payload.handle);
            }
            res.json(resp);
        } else {
            res.sendStatus(400);
            return;
        }
    });

    httpServer.put('/api/devices', async (req, res) => {
        if (isDEComplete(req.body)) {
            const payload = req.body;
            try {
                const dev: Device = {
                    fingerprint: payload.hash,
                    verified: true,
                    id: payload.deviceID,
                    info: {
                        name: payload.info?.name ?? payload.deviceID,
                        os: payload.info?.os ?? 'Unknown',
                        type: payload.info?.type ?? DeviceType.Unknown,
                    },
                };
                const nonce = await completeDevice(payload.handle, dev);
                res.status(200).contentType('text/plain').send(nonce);
            } catch (e) {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(400);
        }
    });

    return new Promise<void>((res) => {
        httpServer.listen(httpPort, () => {
            console.log(`HTTPServer listening on port ${httpPort}`);
            res();
        });
    });
}

export async function setupSocketServer(argv: ServerOptions): Promise<void> {
    // WebSockets
    const wsPort =
        argv['socket-port'] ?? parseInt(process.env['SOCKET_PORT'] ?? '8080');
    const wss = new Server({
        port: wsPort,
    });

    wss.on('connection', (ws) => {
        let authed = WSAuthStep.Unauthed;
        const nonce = BigInt(wsNonce().toString());
        let dev: Device;
        let handle: string;
        ws.on('message', async (data) => {
            // client does first volley...
            if (authed === WSAuthStep.Unauthed) {
                try {
                    const msg = JSON.parse(data.toString('utf-8'));
                    if (!isWSOpener(msg)) {
                        throw new Error('Invalid Payload');
                    }
                    // check it
                    const user = await getUser(msg.handle);
                    handle = msg.handle;
                    // decrypt payload with fingerprint as key
                    if (user.devices[msg.deviceID] === undefined) {
                        throw new Error('Invalid Device');
                    }
                    dev = user.devices[msg.deviceID];
                    // otherwise, decrypt with our fingerprint. it'll contain a nonce as a string; use BigInt to find
                    const devNonce = BigInt(
                        socketDecrypt(dev.fingerprint, msg.devNonce),
                    );
                    const devInc = await socketEncrypt(
                        dev.fingerprint,
                        (devNonce + 1n).toString(),
                    );
                    const srvNonce = await socketEncrypt(
                        dev.fingerprint,
                        nonce.toString(),
                    );
                    const resp: WSOpenResponse = { devInc, srvNonce };
                    ws.send(JSON.stringify(resp));
                    authed = WSAuthStep.Opened;
                } catch (e) {
                    const err: ErrorMessage = {
                        type: MessageType.ERR,
                        errNo: 1,
                    };
                    ws.send(JSON.stringify(err));
                    ws.close();
                }
            } else if (authed === WSAuthStep.Opened) {
                try {
                    const msg = JSON.parse(data.toString('utf8'));
                    if (!isWSComplete(msg)) {
                        throw new Error('Invalid Payload');
                    }
                    // check that nonce is correct...
                    const srvCand = BigInt(
                        socketDecrypt(dev.fingerprint, msg.srvInc),
                    );
                    if (srvCand !== nonce + 1n) {
                        throw new Error('Nonce does not match');
                    }
                    register({
                        deviceID: dev.id,
                        fingerprint: dev.fingerprint,
                        handle,
                        socket: ws,
                    });
                    authed = WSAuthStep.Complete;
                } catch (e) {
                    const err: ErrorMessage = {
                        type: MessageType.ERR,
                        errNo: 1,
                    };
                    ws.send(JSON.stringify(err));
                    ws.close();
                }
            } else {
                try {
                    const payload = JSON.parse(data.toString('utf8'));
                    if (!isEncryptedPayload(payload)) {
                        throw new Error('Invalid payload');
                    }
                    const msg = JSON.parse(
                        socketDecrypt(dev.fingerprint, payload),
                    );
                    if (!isServerMessage(msg)) {
                        throw new Error('Invalid Payload');
                    }
                    msg.timeServer = Date.now();
                    queue(msg);
                } catch (e) {
                    const err: ErrorMessage = {
                        type: MessageType.ERR,
                        errNo: NaN,
                    };
                    ws.send(JSON.stringify(err));
                    return;
                }
            }
        });
    });
    return new Promise<void>((res) => {
        wss.on('listening', () => {
            console.log(`SocketServer listening on port ${wsPort}`);
            res();
        });
    });
}

if (require.main === module) {
    const argv = yargs(hideBin(process.argv)).options({
        'server-port': {
            type: 'number',
            describe:
                'The port to serve the HTTP express application from. Defaults to $SERVER_PORT or 3000.',
        },
        'socket-port': {
            type: 'number',
            describe:
                'The port to serve the WebSocket server from. Defaults to $SOCKET_PORT or 8080.',
        },
        'mongo-user': {
            type: 'string',
            describe:
                'The username to use for the MongoDB connection. Defaults to $MONGO_USER',
        },
        'mongo-pass': {
            type: 'string',
            describe:
                'The password to use for the MongoDB connection. Defaults to $MONGO_PASS',
        },
        'mongo-url': {
            type: 'string',
            describe:
                'The URL to use for the MongoDB connection. Defaults to $MONGO_URL',
        },
    }).argv as ServerOptions & Arguments;

    if (
        argv['mongo-user'] !== undefined &&
        argv['mongo-pass'] !== undefined &&
        argv['mongo-url'] !== undefined
    ) {
        setClient(argv['mongo-user'], argv['mongo-pass'], argv['mongo-url']);
    } else {
        setClient();
    }
    setupHttpServer(argv);
    setupSocketServer(argv);
}
