import { queue, QueuedMessage } from '../server/queueService';
import { ServerMessage } from '../shared/types/Message';
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
import { fingerprint, generateNonce } from '../shared/auth';
import { NONCE_LEN } from '../shared/types/authentication';
import { expect } from 'chai';
import { getClient } from '../server/mongoConnector';
const queueModule = rewire('../server/queueService');
const queueDB: string = queueModule.__get__('QUEUE_DB');

setupMongo();

async function createUserWithDevice() {
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
    const newNonce = await completeDevice(handle, device);
    device.fingerprint = fingerprint({
        deviceID,
        nonce: newNonce,
        passhash: user.passhash,
    });

    return { user, device };
}

describe('Queue Service Unit Tests', () => {
    beforeEach(async () => {
        //await resetMongo();
    });
    after(async () => {
        await closeMongo();
    });
    it('Should not queue message for non-existent destination handle', async () => {
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

    it('Should not queue message for non-existent source handle', async () => {
        const { user, device } = await createUserWithDevice();
        const { id: deviceID } = device;
        const msg: ServerMessage = {
            src: { handle: 'NonexistentHandle#12345', deviceID },
            dst: user.handle,
            payload: 'NOT MODIFIED',
        };
        await expect(queue(msg)).to.be.rejected;
    });

    it('Should not queue message for non-existent source device', async () => {
        const { user, device } = await createUserWithDevice();
        const { id: deviceID } = device;
        const msg: ServerMessage = {
            src: { handle: user.handle, deviceID: deviceID + '1' },
            dst: user.handle,
            payload: 'NOT MODIFIED',
        };
        await expect(queue(msg)).to.be.rejected;
    });

    it('Should queue message for valid source and dest', async () => {
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
