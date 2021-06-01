import express from 'express';
import WebSocket from 'ws';
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
    SALT_LEN,
    isDEComplete,
    DeviceType,
    isWSAuth,
    isNewUser,
} from '../shared/types/authentication';
import { fingerprint, generateNonce } from '../shared/auth';
import {
    AuthMessage,
    ErrorMessage,
    isClientMessage,
    isServerMessage,
    MessageType,
} from '../shared/types/Message';

interface ServerOptions extends Arguments {
    'server-port'?: number;
    'socket-port'?: number;
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
}).argv as ServerOptions;

interface DeviceSocket {
    userID: string;
    deviceID: string;
    fingerprint: string;
    socket: WebSocket;
}
interface ConnectionLibrary {
    [userID: string]: {
        [deviceID: string]: DeviceSocket;
    };
}
// Index with userID, then with deviceID
const conns: ConnectionLibrary = {};

const httpPort =
    argv['server-port'] ?? parseInt(process.env['SERVER_PORT'] ?? '3000');
const wsPort =
    argv['socket-port'] ?? parseInt(process.env['SOCKET_PORT'] ?? '8080');

// WebSockets
const wss = new Server({
    port: wsPort,
});

wss.on('listening', () => {
    console.log(`SocketServer listening on port ${wsPort}`);
});

wss.on('connection', (ws) => {
    let authed = false;
    let dev: DeviceSocket;
    ws.on('message', async (data) => {
        // client does first volley...
        if (!authed) {
            try {
                const msg = JSON.parse(data.toString('utf-8'));
                if (!isWSAuth(msg)) {
                    throw new Error('Invalid Payload');
                }
                // check it
                const user = await getUser(msg.userID);
                if (
                    user.devices[msg.deviceID]?.fingerprint === msg.fingerprint
                ) {
                    // check if our user is there
                    if (!(msg.userID in conns)) {
                        conns[msg.userID] = {};
                    }
                    if (msg.deviceID in conns[msg.userID]) {
                        // wut
                        throw new Error('Device already listening...');
                    }
                    conns[msg.userID][msg.deviceID] = {
                        deviceID: msg.deviceID,
                        fingerprint: msg.fingerprint,
                        userID: msg.userID,
                        socket: ws,
                    };
                    const closer = () => {
                        delete conns[msg.userID][msg.deviceID];
                        if (Object.keys(conns[msg.userID]).length === 0) {
                            delete conns[msg.userID][msg.deviceID];
                        }
                    };
                    ws.on('error', closer);
                    ws.on('close', closer);
                    dev = conns[msg.userID][msg.deviceID];
                    const success: AuthMessage = {
                        type: MessageType.AACK,
                    };
                    ws.send(JSON.stringify(success));
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
            // read the destination, send accordingly
            // so... eventually, we'll need to manage queues for users with devices that aren't online...
            // but I don't wanna do that right now. So for now, we're just going to send to devices that are awake
            const dst = typeof msg.dst === 'string' ? msg.dst : msg.dst.userID;
            if (!(dst in conns)) {
                return;
            } else {
                msg.timeServer = Date.now();
                Object.values(conns[dst]).forEach((ds) => {
                    ds.socket.send(JSON.stringify(msg));
                });
            }
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
            const user = await getUser(payload.userID);
            // success! fill in the salt, attach our hash (for checking later...)
            resp.salt = user.salt;
            const print = fingerprint({
                deviceID: payload.deviceID,
                hashAlg: user.hashalg,
                nonce: resp.nonce,
                passHash: user.passhash,
            });
            addDevice(payload.userID, payload.deviceID, print);
        } catch (e) {
            // couldn't find! fill in w/ random salt
            resp.salt = (await generateNonce(SALT_LEN)).toString('base64');
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
            await completeDevice(payload.userID, dev);
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
