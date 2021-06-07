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
    HashAlgorithm,
    isDEInit,
    NONCE_LEN,
    isDEComplete,
    DeviceType,
    isWSAuth,
    isNewUser,
    isNewPassword,
    isDeletePayload,
} from '../shared/types/authentication';
import { fakeSalt, fingerprint, generateNonce } from '../shared/auth';
import {
    ErrorMessage,
    isServerMessage,
    MessageType,
} from '../shared/types/Message';
import { setClient } from './mongoConnector';
import { queue, register } from './queueService';

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
                hashAlgorithm: HashAlgorithm.SHA256,
                salt: '',
            };
            try {
                const user = await getUser(payload.handle);
                // success! fill in the salt, attach our hash (for checking later...)
                resp.salt = user.salt;
                const print = fingerprint({
                    deviceID: payload.deviceID,
                    hashAlg: user.hashalg,
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

    return new Promise<void>((res, rej) => {
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
        let authed = false;
        ws.on('message', async (data) => {
            // client does first volley...
            if (!authed) {
                try {
                    const msg = JSON.parse(data.toString('utf-8'));
                    if (!isWSAuth(msg)) {
                        throw new Error('Invalid Payload');
                    }
                    // check it
                    const user = await getUser(msg.handle);
                    if (
                        user.devices[msg.deviceID]?.fingerprint === msg.fingerprint
                    ) {
                        register({
                            deviceID: msg.deviceID,
                            fingerprint: msg.fingerprint,
                            handle: msg.handle,
                            socket: ws,
                        });
                        authed = true;
                    } else {
                        throw new Error('Invalid Fingerprint');
                    }
                } catch (e) {
                    const err: ErrorMessage = {
                        type: MessageType.ERR,
                        errNo: NaN,
                    };
                    ws.send(JSON.stringify(err));
                    ws.close();
                }
                return;
            }
            try {
                const msg = JSON.parse(data.toString('utf8'));
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
        });
    });
    return new Promise<void>((res, rej) => {
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
