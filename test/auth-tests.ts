import { expect } from 'chai';
import {
    isNewUser,
    isDEComplete,
    isDEInit,
    isDEInitResponse,
    isDeletePayload,
    isEncryptedPayload,
    isNewPassword,
    isWSComplete,
    isWSOpenResponse,
    isWSOpener,
    EncryptedPayload,
} from '../shared/types/authentication';
import { socketDecrypt, socketEncrypt } from '../shared/auth';

const VALID_PRINT = 'xiwEI89i5pxEIEpVcIbCGJGTpCwSyJaGF8ZzsKYK5P4=';
const VALID_ENC: EncryptedPayload = {
    iv: 'ZGb8oBdHIngvKDpc3L6Dfg==',
    payload: 'bqLuS8c=',
};
describe('Authentication Unit Tests', function () {
    describe('Authentication Payload Unit Tests', function () {
        describe('New User Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isNewUser(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isNewUser(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isNewUser({})).to.be.false;
            });
            it('Should fail for no password', function () {
                expect(isNewUser({ handle: 'TEST' })).to.be.false;
            });
            it('Should fail for no handle', function () {
                expect(isNewUser({ password: 'wassup' })).to.be.false;
            });
            it('Should fail for incorrect handle types', function () {
                expect(isNewUser({ password: 'hello', handle: false })).to.be
                    .false;
                expect(isNewUser({ password: 'hello', handle: 1 })).to.be.false;
                expect(isNewUser({ password: 'hello', handle: function () {} }))
                    .to.be.false;
                expect(isNewUser({ password: 'hello', handle: 1n })).to.be
                    .false;
            });
            it('Should fail for incorrect password types', function () {
                expect(isNewUser({ handle: 'hello', password: false })).to.be
                    .false;
                expect(isNewUser({ handle: 'hello', password: 1 })).to.be.false;
                expect(isNewUser({ handle: 'hello', password: function () {} }))
                    .to.be.false;
                expect(isNewUser({ handle: 'hello', password: 1n })).to.be
                    .false;
            });
            it('Should fail for zero-length handle', function () {
                expect(isNewUser({ handle: '', password: 'hello' })).to.be
                    .false;
            });
            it('Should fail for zero-length password', function () {
                expect(isNewUser({ handle: 'hello', password: '' })).to.be
                    .false;
            });
            it('Should pass for valid payload', function () {
                expect(isNewUser({ handle: 'hello', password: 'hello' })).to.be
                    .true;
            });
        });
        describe('New Password Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isNewPassword(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isNewPassword(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isNewPassword({})).to.be.false;
            });
            it('Should fail for no new password', function () {
                expect(isNewPassword({ handle: 'TEST', oldPassword: 'hello' }))
                    .to.be.false;
            });
            it('Should fail for no old password', function () {
                expect(isNewPassword({ handle: 'TEST', newPassword: 'hello' }))
                    .to.be.false;
            });
            it('Should fail for no handle', function () {
                expect(
                    isNewPassword({
                        newPassword: 'hello',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
            });
            it('Should fail for zero-length handle', function () {
                expect(
                    isNewPassword({
                        handle: '',
                        newPassword: 'hello',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
            });
            it('Should fail for zero-length new password', function () {
                expect(
                    isNewPassword({
                        handle: 'hello',
                        newPassword: '',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
            });
            it('Should fail for incorrect handle types', function () {
                expect(
                    isNewPassword({
                        handle: false,
                        newPassword: 'wassup',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        handle: 1,
                        newPassword: 'wassup',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        handle: function () {},
                        newPassword: 'wassup',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        handle: 1n,
                        newPassword: 'wassup',
                        oldPassword: 'hello',
                    }),
                ).to.be.false;
            });
            it('Should fail for incorrect oldPassword types', function () {
                expect(
                    isNewPassword({
                        oldPassword: false,
                        newPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        oldPassword: 1,
                        newPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        oldPassword: function () {},
                        newPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        oldPassword: 1n,
                        newPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
            });
            it('Should fail for incorrect newPassword types', function () {
                expect(
                    isNewPassword({
                        newPassword: false,
                        oldPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        newPassword: 1,
                        oldPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        newPassword: function () {},
                        oldPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
                expect(
                    isNewPassword({
                        newPassword: 1n,
                        oldPassword: 'wassup',
                        handle: 'hello',
                    }),
                ).to.be.false;
            });
            it('Should pass for valid payload', function () {
                expect(
                    isNewPassword({
                        handle: 'hello',
                        oldPassword: 'hello',
                        newPassword: 'goodbye',
                    }),
                ).to.be.true;
            });
            it('Should allow same password', function () {
                expect(
                    isNewPassword({
                        handle: 'hello',
                        oldPassword: 'hello',
                        newPassword: 'hello',
                    }),
                ).to.be.true;
            });
        });
        describe('Delete User Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isDeletePayload(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isDeletePayload(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isDeletePayload({})).to.be.false;
            });
            it('Should fail for no password', function () {
                expect(isDeletePayload({ handle: 'TEST' })).to.be.false;
            });
            it('Should fail for no hash', function () {
                expect(isDeletePayload({ hash: 'wassup' })).to.be.false;
            });
            it('Should fail for incorrect handle types', function () {
                expect(isDeletePayload({ hash: 'hello', handle: false })).to.be
                    .false;
                expect(isDeletePayload({ hash: 'hello', handle: 1 })).to.be
                    .false;
                expect(
                    isDeletePayload({ hash: 'hello', handle: function () {} }),
                ).to.be.false;
                expect(isDeletePayload({ hash: 'hello', handle: 1n })).to.be
                    .false;
            });
            it('Should fail for incorrect hash types', function () {
                expect(isDeletePayload({ handle: 'hello', hash: false })).to.be
                    .false;
                expect(isDeletePayload({ handle: 'hello', hash: 1 })).to.be
                    .false;
                expect(
                    isDeletePayload({ handle: 'hello', hash: function () {} }),
                ).to.be.false;
                expect(isDeletePayload({ handle: 'hello', hash: 1n })).to.be
                    .false;
            });
            it('Should fail for zero-length handle', function () {
                expect(isDeletePayload({ handle: '', hash: 'hello' })).to.be
                    .false;
            });
            it('Should fail for zero-length password', function () {
                expect(isDeletePayload({ handle: 'hello', hash: '' })).to.be
                    .false;
            });
            it('Should pass for valid payload', function () {
                expect(isDeletePayload({ handle: 'hello', hash: 'hello' })).to
                    .be.true;
            });
        });
        describe('Device Enrollment Initiation Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isDEInit(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isDEInit(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isDEInit({})).to.be.false;
            });
            it('Should fail for no handle', function () {
                expect(isDEInit({ deviceID: 'TEST' })).to.be.false;
            });
            it('Should fail for no deviceID', function () {
                expect(isDEInit({ handle: 'wassup' })).to.be.false;
            });
            it('Should fail for incorrect handle types', function () {
                expect(isDEInit({ deviceID: 'hello', handle: false })).to.be
                    .false;
                expect(isDEInit({ deviceID: 'hello', handle: 1 })).to.be.false;
                expect(isDEInit({ deviceID: 'hello', handle: function () {} }))
                    .to.be.false;
                expect(isDEInit({ deviceID: 'hello', handle: 1n })).to.be.false;
            });
            it('Should fail for incorrect deviceID types', function () {
                expect(isDEInit({ handle: 'hello', deviceID: false })).to.be
                    .false;
                expect(isDEInit({ handle: 'hello', deviceID: 1 })).to.be.false;
                expect(isDEInit({ handle: 'hello', deviceID: function () {} }))
                    .to.be.false;
                expect(isDEInit({ handle: 'hello', deviceID: 1n })).to.be.false;
            });
            it('Should fail for zero-length handle', function () {
                expect(isDEInit({ handle: '', deviceID: 'hello' })).to.be.false;
            });
            it('Should fail for zero-length deviceID', function () {
                expect(isDEInit({ handle: 'hello', deviceID: '' })).to.be.false;
            });
            it('Should fail for having more keys', function () {
                expect(
                    isDEInit({
                        handle: 'hello',
                        deviceID: 'wassup',
                        other: 'ohNo',
                    }),
                ).to.be.false;
            });
            it('Should pass for valid payload', function () {
                expect(isDEInit({ handle: 'hello', deviceID: 'hello' })).to.be
                    .true;
            });
        });
        describe('Device Enrollment Response Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isDEInitResponse(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isDEInitResponse(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isDEInitResponse({})).to.be.false;
            });
            it('Should fail for no salt', function () {
                expect(isDEInitResponse({ nonce: 'TEST' })).to.be.false;
            });
            it('Should fail for no nonce', function () {
                expect(isDEInitResponse({ salt: 'wassup' })).to.be.false;
            });
            it('Should fail for incorrect salt types', function () {
                expect(isDEInitResponse({ nonce: 'hello', salt: false })).to.be
                    .false;
                expect(isDEInitResponse({ nonce: 'hello', salt: 1 })).to.be
                    .false;
                expect(
                    isDEInitResponse({ nonce: 'hello', salt: function () {} }),
                ).to.be.false;
                expect(isDEInitResponse({ nonce: 'hello', salt: 1n })).to.be
                    .false;
            });
            it('Should fail for incorrect nonce types', function () {
                expect(isDEInitResponse({ salt: 'hello', nonce: false })).to.be
                    .false;
                expect(isDEInitResponse({ salt: 'hello', nonce: 1 })).to.be
                    .false;
                expect(
                    isDEInitResponse({ salt: 'hello', nonce: function () {} }),
                ).to.be.false;
                expect(isDEInitResponse({ salt: 'hello', nonce: 1n })).to.be
                    .false;
            });
            it('Should fail for zero-length salt', function () {
                expect(isDEInitResponse({ salt: '', nonce: 'hello' })).to.be
                    .false;
            });
            it('Should fail for zero-length nonce', function () {
                expect(isDEInitResponse({ salt: 'hello', nonce: '' })).to.be
                    .false;
            });
            it('Should pass for valid payload', function () {
                expect(isDEInitResponse({ salt: 'hello', nonce: 'hello' })).to
                    .be.true;
            });
        });
        describe('Device Enrollment Complete Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isDEComplete(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isDEComplete(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isDEComplete({})).to.be.false;
            });
            it('Should fail for no handle', function () {
                const obj = {
                    deviceID: 'hello',
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for zero-length handle', function () {
                const obj = {
                    handle: '',
                    deviceID: 'hello',
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for no device ID', function () {
                const obj = {
                    handle: 'hello',
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for zero-length device ID', function () {
                const obj = {
                    deviceID: '',
                    handle: 'hello',
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for incorrect handle types', function () {
                // eslint-disable-next-line
                const obj: any = {
                    deviceID: 'hello',
                    handle: false,
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.false;
                obj.handle = 1;
                expect(isDEComplete(obj)).to.be.false;
                obj.handle = () => {};
                expect(isDEComplete(obj)).to.be.false;
                obj.handle = 1n;
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for incorrect deviceID types', function () {
                // eslint-disable-next-line
                const obj: any = {
                    deviceID: false,
                    handle: 'false',
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.false;
                obj.deviceID = 1;
                expect(isDEComplete(obj)).to.be.false;
                obj.deviceID = () => {};
                expect(isDEComplete(obj)).to.be.false;
                obj.deviceID = 1n;
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for incorrect fingerprint types', function () {
                // eslint-disable-next-line
                const obj: any = {
                    deviceID: 'fdsa',
                    handle: 'false',
                    fingerprint: false,
                };
                expect(isDEComplete(obj)).to.be.false;
                obj.fingerprint = 1;
                expect(isDEComplete(obj)).to.be.false;
                obj.fingerprint = () => {};
                expect(isDEComplete(obj)).to.be.false;
                obj.fingerprint = 1n;
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should fail for incorrect-length fingerprint', function () {
                // eslint-disable-next-line
                const obj: any = {
                    deviceID: 'fdsa',
                    handle: 'false',
                    fingerprint: VALID_PRINT.substring(VALID_PRINT.length / 2),
                };
                expect(isDEComplete(obj)).to.be.false;
            });
            it('Should pass for valid payload', function () {
                // eslint-disable-next-line
                const obj: any = {
                    deviceID: 'fdsa',
                    handle: 'false',
                    fingerprint: VALID_PRINT,
                    info: {
                        name: 'hello',
                        os: 'Windows 10',
                        type: 1,
                    },
                };
                expect(isDEComplete(obj)).to.be.true;
            });
            it('Should pass for valid payload, without info', function () {
                // eslint-disable-next-line
                const obj: any = {
                    deviceID: 'fdsa',
                    handle: 'false',
                    fingerprint: VALID_PRINT,
                };
                expect(isDEComplete(obj)).to.be.true;
            });
        });
        describe('Encrypted Payload Unit Tests', function () {
            const VALID_IV = 'LzK2rZ87Nw70eOGLKq0Plw==';
            it('Should fail for null object', function () {
                expect(isEncryptedPayload(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isEncryptedPayload(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isEncryptedPayload({})).to.be.false;
            });
            it('Should fail for no iv', function () {
                expect(isEncryptedPayload({ payload: 'TEST' })).to.be.false;
            });
            it('Should fail for no payload', function () {
                expect(isEncryptedPayload({ iv: VALID_IV })).to.be.false;
            });
            it('Should fail for incorrect iv types', function () {
                expect(isEncryptedPayload({ payload: 'wassup', iv: false })).to
                    .be.false;
                expect(isEncryptedPayload({ payload: 'wassup', iv: 1 })).to.be
                    .false;
                expect(
                    isEncryptedPayload({
                        payload: 'wassup',
                        iv: function () {},
                    }),
                ).to.be.false;
                expect(isEncryptedPayload({ payload: 'wassup', iv: 1n })).to.be
                    .false;
            });
            it('Should fail for incorrect payload types', function () {
                expect(isEncryptedPayload({ payload: false, iv: VALID_IV })).to
                    .be.false;
                expect(isEncryptedPayload({ payload: 1, iv: VALID_IV })).to.be
                    .false;
                expect(
                    isEncryptedPayload({
                        payload: function () {},
                        iv: VALID_IV,
                    }),
                ).to.be.false;
                expect(isEncryptedPayload({ payload: 1n, iv: VALID_IV })).to.be
                    .false;
            });
            it('Should fail for incorrect IV length', function () {
                expect(isEncryptedPayload({ payload: 'hello', iv: 'abcd' })).to
                    .be.false;
            });
            it('Should pass for valid payload and IV', function () {
                expect(isEncryptedPayload({ payload: 'hello', iv: VALID_IV }))
                    .to.be.true;
            });
        });
        describe('WebSocket Open Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isWSOpener(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isWSOpener(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isWSOpener({})).to.be.false;
            });
            it('Should fail for no handle', function () {
                expect(isWSOpener({ deviceID: 'TEST', devNonce: VALID_ENC })).to
                    .be.false;
            });
            it('Should fail for no deviceID', function () {
                expect(isWSOpener({ handle: 'TEST', devNonce: VALID_ENC })).to
                    .be.false;
            });
            it('Should fail for no nonce', function () {
                expect(isWSOpener({ handle: 'TEST', deviceID: 'TEST' })).to.be
                    .false;
            });
            it('Should fail for zero-length handle ', function () {
                expect(
                    isWSOpener({
                        handle: '',
                        deviceID: 'TEST',
                        devNonce: VALID_ENC,
                    }),
                ).to.be.false;
            });
            it('Should fail for zero-length deviceID ', function () {
                expect(
                    isWSOpener({
                        handle: 'TEST',
                        deviceID: '',
                        devNonce: VALID_ENC,
                    }),
                ).to.be.false;
            });
            it('Should pass for valid WebSocket Open Payload', function () {
                expect(
                    isWSOpener({
                        handle: 'TEST',
                        deviceID: 'TEST',
                        devNonce: VALID_ENC,
                    }),
                ).to.be.true;
            });
        });
        describe('WebSocket Open Response Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isWSOpenResponse(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isWSOpenResponse(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isWSOpenResponse({})).to.be.false;
            });
            it('Should fail for no device nonce', function () {
                expect(isWSOpenResponse({ srvNonce: VALID_ENC })).to.be.false;
            });
            it('Should fail for no server nonce', function () {
                expect(isWSOpenResponse({ devInc: VALID_ENC })).to.be.false;
            });
            it('Should pass for valid WebSocket Open Response Payload', function () {
                expect(
                    isWSOpenResponse({
                        srvNonce: VALID_ENC,
                        devInc: VALID_ENC,
                    }),
                ).to.be.true;
            });
        });
        describe('WebSocket Complete Payload Unit Tests', function () {
            it('Should fail for null object', function () {
                expect(isWSComplete(null)).to.be.false;
            });
            it('Should fail for undefined', function () {
                expect(isWSComplete(undefined)).to.be.false;
            });
            it('Should fail without any fields', function () {
                expect(isWSComplete({})).to.be.false;
            });
            it('Should fail for no server nonce', function () {
                expect(isWSComplete({ config: {} })).to.be.false;
            });
            it('Should fail for no configuration', function () {
                expect(isWSComplete({ srvInc: VALID_ENC })).to.be.false;
            });
            it('Should pass for valid WebSocket Complete Payload', function () {
                expect(isWSComplete({ srvInc: VALID_ENC, config: {} })).to.be
                    .true;
            });
        });
    });
    describe('Authentication method Unit Tests', function () {
        describe('Encryption Unit Tests', function () {
            it('Should throw on invalid fingerprint', async function () {
                await expect(socketEncrypt('', 'hello')).to.be.rejected;
            });
            it('Should succeed for valid fingerprint', async function () {
                await expect(socketEncrypt(VALID_PRINT, 'hello')).to.be
                    .fulfilled;
            });
        });
        describe('Decryption Unit Tests', function () {
            it('Should throw on invalid fingerprint', function () {
                expect(() => socketDecrypt('', VALID_ENC)).to.throw();
            });
            it('Should succeed for valid fingerprint', function () {
                expect(socketDecrypt(VALID_PRINT, VALID_ENC)).to.be.equal(
                    'hello',
                );
            });
        });
        it('Decrypt Should be inverse of Encrypt', async function () {
            const startPlain = 'Hello, World!';
            const returned = socketDecrypt(
                VALID_PRINT,
                await socketEncrypt(VALID_PRINT, startPlain),
            );
            expect(returned).to.be.equal(startPlain);
        });
    });
});
