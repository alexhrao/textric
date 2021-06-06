import express from 'express';
import { Server } from 'ws';
import { Arguments } from 'yargs';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import {
    addDevice,
    completeDevice,
    createUser,
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
} from '../shared/types/authentication';
import { fakeSalt, fingerprint, generateNonce } from '../shared/auth';
import {
    ErrorMessage,
    isServerMessage,
    MessageType,
} from '../shared/types/Message';
import { setClient } from './mongoConnector';
import { queue, register } from './queueService';

interface ServerOptions extends Arguments {
    'server-port'?: number;
    'socket-port'?: number;
    'mongo-user'?: string;
    'mongo-pass'?: string;
    'mongo-url'?: string;
}

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
}).argv as ServerOptions;
console.log(argv);
const httpPort =
    argv['server-port'] ?? parseInt(process.env['SERVER_PORT'] ?? '3000');
const wsPort =
    argv['socket-port'] ?? parseInt(process.env['SOCKET_PORT'] ?? '8080');

if (
    argv['mongo-user'] !== undefined &&
    argv['mongo-pass'] !== undefined &&
    argv['mongo-url'] !== undefined
) {
    setClient(argv['mongo-user'], argv['mongo-pass'], argv['mongo-url']);
} else {
    setClient();
}
// WebSockets
const wss = new Server({
    port: wsPort,
});

wss.on('listening', () => {
    console.log(`SocketServer listening on port ${wsPort}`);
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

// express!
const httpServer = express();
httpServer.use(express.json());

httpServer.get('/users', async (req, res) => {
    if (req.query['username'] !== undefined) {
        generateHandle().then((handle) => {
            res.contentType('text/plain').send(handle).end();
        });
    } else {
        res.sendStatus(404);
    }
});

httpServer.post('/users', async (req, res) => {
    if (!isNewUser(req.body)) {
        res.sendStatus(400);
        return;
    }
    await createUser(req.body);
    res.sendStatus(204);
});

httpServer.post('/enroll', async (req, res) => {
    // verify req.body
    if (isDEInit(req.body)) {
        const payload = req.body;
        // look up user... how?
        // TODO: Look @ local mongoDB stuff
        // for now... can't find user. so just send back a random nonce + random salt
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
    } else if (isDEComplete(req.body)) {
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
            await completeDevice(payload.handle, dev);
            res.sendStatus(204);
        } catch (e) {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(400);
        return;
    }
});

httpServer.listen(httpPort, () => {
    console.log(`HTTPServer listening on port ${httpPort}`);
});
