import chai, { expect } from 'chai';
import asPromised from 'chai-as-promised';
import { DB, getClient } from '../server/mongoConnector';
import {
    addDevice,
    changePassword,
    completeDevice,
    createUser,
    defaultDevice,
    deleteUser,
    Device,
    generateHandle,
    getUser,
    HandleCandidate,
    revokeDevice,
    User,
} from '../server/user';
import { fingerprint, generateNonce } from '../shared/auth';
import { DeviceType, NONCE_LEN } from '../shared/types/authentication';
// monkeypatch
import rewire from 'rewire';
const userModule = rewire('../server/user');

const userConsts = {
    NUM_LEN: userModule.__get__('NUM_LEN'),
    HANDLE_TTL: userModule.__get__('HANDLE_TTL'),
    USER_COL: userModule.__get__('USER_COL'),
    HANDLE_COL: userModule.__get__('HANDLE_COL'),
};

chai.use(asPromised);

describe('User Unit Tests', function () {
    it('Should generate valid handles', async function () {
        for (let i = 0; i < 10; ++i) {
            const handle = await generateHandle();
            // handle should match {string}#{5-digit#}
            expect(handle).to.match(/\w+#\d{5}/);
        }
    });

    it('Should store handle in MongoDB', async function () {
        const handle = await generateHandle();
        const inDB = await (await getClient())
            .db(DB)
            .collection<HandleCandidate>(userConsts.HANDLE_COL)
            .findOne({ handle });
        expect(inDB).not.to.be.null;
        expect(inDB).to.have.property('handle', handle);
        expect(inDB)
            .to.have.property('timecreated')
            .that.is.greaterThan(Date.now() - userConsts.HANDLE_TTL);
    });

    it('Should reject unrequested handle', async function () {
        expect(
            createUser({
                handle: 'UnrequestedHandle#12345',
                password: 'password',
            }),
        ).to.be.rejected;
    });

    it('Should create a valid user', async function () {
        const password = 'password';
        const handle = await generateHandle();
        await expect(createUser({ handle, password })).to.be.fulfilled;

        // check information in DB
        const inDB = await (await getClient())
            .db(DB)
            .collection<User>(userConsts.USER_COL)
            .findOne({ handle });
        expect(inDB).not.to.be.null;
        expect(inDB).to.have.property('handle', handle);
        expect(inDB).to.have.property('createdate');
        expect(inDB).to.have.deep.property('devices', {});
        // make sure we have salt... but no need to check
        expect(inDB).to.have.property('passhash');
        expect(inDB).to.have.property('salt');
    });

    it('Should reject a user that already exists', async function () {
        // get a handle
        const password = 'password';
        const handle = await generateHandle();
        await expect(createUser({ handle, password })).to.be.fulfilled;
        // splice in handle (i.e., attacker spliced in a previously-used handle...)
        await (await getClient())
            .db(DB)
            .collection<HandleCandidate>(userConsts.HANDLE_COL)
            .insertOne({
                handle,
                timecreated: Date.now(),
            });
        // try again
        await expect(createUser({ handle, password })).to.be.rejected;
    });

    it('Should throw on unknown user', async function () {
        const handle = await generateHandle();
        await expect(getUser(handle)).to.be.rejected;
    });

    it('Should retrieve the correct user', async function () {
        const password = 'password';
        const handle = await generateHandle();
        await expect(createUser({ handle, password })).to.be.fulfilled;

        const res: User = await expect(getUser(handle)).to.be.fulfilled;
        expect(res).to.have.property('handle', handle);
        expect(res).to.have.property('devices').to.be.instanceOf(Map);
    });

    it('Should not delete user with wrong password', async function () {
        const password = 'password';
        const handle = await generateHandle();
        await expect(createUser({ handle, password })).to.be.fulfilled;

        await expect(deleteUser(handle, '12345')).to.be.rejected;
        const test = await (await getClient())
            .db(DB)
            .collection<User>(userConsts.USER_COL)
            .findOne({ handle });
        expect(test).not.to.be.null;
    });

    it('Should delete user with right hash', async function () {
        const password = 'password';
        const handle = await generateHandle();
        await expect(createUser({ handle, password })).to.be.fulfilled;
        const user = await getUser(handle);

        await expect(deleteUser(handle, user.passhash)).to.be.fulfilled;
        // should not be in DB
        const test = await (await getClient())
            .db(DB)
            .collection<User>(userConsts.USER_COL)
            .findOne({ handle });
        expect(test).to.be.null;
    });

    it('Should not change password for invalid current password', async function () {
        const password = 'password';
        const handle = await generateHandle();
        await expect(createUser({ handle, password })).to.be.fulfilled;

        await expect(changePassword(handle, password + '1', password + '2')).to
            .be.rejected;
    });

    it('Should change the password', async function () {
        const password = 'password';
        const handle = await generateHandle();
        const devID = '12:34:56:78';
        await createUser({ handle, password });
        const oldUser = await getUser(handle);
        await addDevice(
            handle,
            devID,
            fingerprint({
                deviceID: devID,
                nonce: 'NONCE',
                passhash: oldUser.passhash,
            }),
        );
        await expect(changePassword(handle, password, password + '2')).to.be
            .fulfilled;
        const newUser = await getUser(handle);
        // devices should be revoked, passhash & salt should be different
        expect(oldUser.passhash).not.to.equal(newUser.passhash);
        expect(oldUser.salt).not.to.equal(newUser.salt);
        expect(newUser).to.have.property('devices').to.be.instanceOf(Map);
        expect(newUser.devices.size).to.be.equal(0);
    });
});

describe('User Device Unit Tests', async function () {
    it('Should not add device to non-existent user', async function () {
        const handle = 'NonexistentUser#12345';
        const deviceID = '12:34:56';
        const print = fingerprint({
            deviceID,
            nonce: 'NONCE',
            passhash: '12345',
        });
        await expect(addDevice(handle, deviceID, print)).to.be.rejected;
    });

    it('Should add unverified device', async function () {
        const handle = await generateHandle();
        const password = 'password';
        const deviceID = '12:34:56';
        const nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        await createUser({ handle, password });
        const passHash = (await getUser(handle)).passhash;
        const print = fingerprint({ deviceID, nonce, passhash: passHash });

        await expect(addDevice(handle, deviceID, print)).to.be.fulfilled;
        const user = await getUser(handle);
        const expectedDevice = defaultDevice(deviceID, print);
        expect(user).to.have.property('devices').to.be.instanceOf(Map);
        expect(user.devices.get(deviceID)).to.be.deep.equal(expectedDevice);
    });

    it('Should overwrite unverified device', async function () {
        const handle = await generateHandle();
        const password = 'password';
        const deviceID = '12:34:56';
        await createUser({ handle, password });
        let nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        const passHash = (await getUser(handle)).passhash;
        const print = fingerprint({ deviceID, nonce, passhash: passHash });
        await addDevice(handle, deviceID, print);

        nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        const newPrint = fingerprint({ deviceID, nonce, passhash: passHash });
        await addDevice(handle, deviceID, newPrint);

        const user = await getUser(handle);
        const expectedDevice = defaultDevice(deviceID, newPrint);
        expect(user).to.have.property('devices').to.be.instanceOf(Map);
        expect(user.devices.get(deviceID)).to.be.deep.equal(expectedDevice);
    });

    it('Should revoke device', async function () {
        const handle = await generateHandle();
        const password = 'password';
        const deviceID = '12:34:56';
        const nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        await createUser({ handle, password });
        const passHash = (await getUser(handle)).passhash;
        const print = fingerprint({ deviceID, nonce, passhash: passHash });

        await addDevice(handle, deviceID, print);
        await expect(revokeDevice(handle, deviceID, print)).to.be.fulfilled;
        const user = await getUser(handle);
        expect(user).to.have.property('devices').to.be.instanceOf(Map);
        expect(user.devices.size).to.be.equal(0);
    });

    it('Should not revoke device with incorrect print', async function () {
        const handle = await generateHandle();
        const password = 'password';
        const deviceID = '12:34:56';
        const nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        await createUser({ handle, password });
        const passHash = (await getUser(handle)).passhash;
        const print = fingerprint({ deviceID, nonce, passhash: passHash });

        await addDevice(handle, deviceID, print);
        await expect(revokeDevice(handle, deviceID, print + '1')).to.be
            .rejected;
        const user = await getUser(handle);
        const expectedDevice = defaultDevice(deviceID, print);
        expect(user).to.have.property('devices').to.be.instanceOf(Map);
        expect(user.devices.get(deviceID)).to.be.deep.equal(expectedDevice);
    });

    it('Should not complete device registration with wrong print', async function () {
        const handle = await generateHandle();
        const password = 'password';
        const deviceID = '12:34:56';
        const nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        await createUser({ handle, password });
        const passHash = (await getUser(handle)).passhash;
        const print = fingerprint({ deviceID, nonce, passhash: passHash });

        await addDevice(handle, deviceID, print);
        const user = await getUser(handle);
        const expectedDevice = defaultDevice(deviceID, print);
        const badDevice = { ...expectedDevice };
        badDevice.fingerprint += '1';
        await expect(completeDevice(handle, badDevice)).to.be.rejected;
        expect(user).to.have.property('devices').to.be.instanceOf(Map);
        expect(user.devices.get(deviceID)).to.be.deep.equal(expectedDevice);
    });

    it('Should complete device registration', async function () {
        const handle = await generateHandle();
        const password = 'password';
        const deviceID = '12:34:56';
        const nonce = (await generateNonce(NONCE_LEN)).toString('base64');
        await createUser({ handle, password });
        const passHash = (await getUser(handle)).passhash;
        const print = fingerprint({ deviceID, nonce, passhash: passHash });

        await addDevice(handle, deviceID, print);
        const expectedDevice: Device = {
            verified: true,
            fingerprint: print,
            id: deviceID,
            info: {
                name: 'TestDevice',
                os: 'mocha',
                type: DeviceType.Desktop,
            },
        };
        const newNonce = await completeDevice(handle, expectedDevice);
        const newPrint = fingerprint({
            deviceID,
            nonce: newNonce,
            passhash: passHash,
        });
        expectedDevice.fingerprint = newPrint;
        const user = await getUser(handle);
        expect(user).to.have.property('devices').to.be.instanceOf(Map);
        expect(user.devices.get(deviceID)).to.be.deep.equal(expectedDevice);
    });
});
