import * as Message from 'src/shared/types/Message';
import { expect } from 'chai';

describe('Address Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isAddress(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isAddress(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isAddress("hello")).to.equal(false);
        });
    });
    describe("Must have userID and deviceID fields", function() {
        it('Should return false if missing userID field', function() {
            const noUserID: any = {deviceID: "TEST"};
            expect(Message.isAddress(noUserID)).to.equal(false);
        });
        it('Should return false if missing deviceID field', function() {
            const noDeviceID: any = {userID: "TEST"};
            expect(Message.isAddress(noDeviceID)).to.equal(false);
        });
    });
    describe("userID and deviceID must be strings", function() {
        it('Should return false if userID is not string', function() {
            const badUserID: any = {userID: 1, deviceID: "TEST"};
            expect(Message.isAddress(badUserID)).to.equal(false);
        });
        it('Should return false if deviceID is not string', function() {
            const badDeviceID: any = {userID: "TEST", deviceID: 1};
            expect(Message.isAddress(badDeviceID)).to.equal(false);
        });
    });
    describe("Validate properly declared Address and any type with proper fields", 
        function () {
        it('Should return true on correctly structured Address', function() {
            const goodAddress: Message.Address = {userID: "TEST", 
                deviceID: "TEST"};
            expect(Message.isAddress(goodAddress)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodAddress: any = {userID: "TEST", deviceID: "TEST"};
            expect(Message.isAddress(goodAddress)).to.equal(true);
        });
    });
});

describe('Database Payload Tests', function() {
    // TODO Update when this is fleshed out!
    describe("Should always return true", function() {
        it('Should return true', function() {
            expect(Message.isDatabasePayload(null)).to.equal(true);
        });
        it('Should not return false', function() {
            expect(Message.isDatabasePayload(undefined)).to.not.equal(false);
        });
    });
});

describe('AckMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isAckMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isAckMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isAckMessage("hello")).to.equal(false);
        });
    });
    describe("Must have type, id, timeLocal, and ref fields", function() {
        it('Should return false if missing type field', function() {
            const noType: any = {id: 1, timeLocal: 1, ref: 1};
            expect(Message.isAckMessage(noType)).to.equal(false);
        });
        it('Should return false if missing id field', function() {
            const noID: any = {type: Message.MessageType.ACK, timeLocal: 1, 
                ref: 1};
            expect(Message.isAckMessage(noID)).to.equal(false);
        });
        it('Should return false if missing timeLocal field', function() {
            const noTimeLocal: any = {type: Message.MessageType.ACK, id: 1, 
                ref: 1};
            expect(Message.isAckMessage(noTimeLocal)).to.equal(false);
        });
        it('Should return false if missing ref field', function() {
            const noRef: any = {type: Message.MessageType.ACK, id: 1, 
                timeLocal: 1};
            expect(Message.isAckMessage(noRef)).to.equal(false);
        });
    });
    describe("Fields must have correct types", function() {
        it('Should return false if type is not MessageType.ACK', function() {
            const badType: any = {type: Message.MessageType.ERR, id: 1,
                timeLocal: 1, ref: 1};
            expect(Message.isAckMessage(badType)).to.equal(false);
        });
        it('Should return false if id is not number', function() {
            const badID: any = {type: Message.MessageType.ACK, id: "hello",
                timeLocal: 1, ref: 1};
            expect(Message.isAckMessage(badID)).to.equal(false);
        });
        it('Should return false if timeLocal is not number', function() {
            const badTimeLocal: any = {type: Message.MessageType.ACK, id: 1,
                timeLocal: "hello", ref: 1};
            expect(Message.isAckMessage(badTimeLocal)).to.equal(false);
        });
        it('Should return false if ref is not number', function() {
            const badRef: any = {type: Message.MessageType.ACK, id: 1,
                timeLocal: 1, ref: "hello"};
            expect(Message.isAckMessage(badRef)).to.equal(false);
        });
    });
    describe("Validate on properly formed AckMessage and any type with proper fields",
        function() {
        it('Should return true on correctly structured AckMessage', function() {
            const goodAckMessage: Message.AckMessage = {type: Message.MessageType.ACK,
                id: 1, timeLocal: 1, ref: 1};
            expect(Message.isAckMessage(goodAckMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodAckMessage: any = {type: Message.MessageType.ACK,
                id: 1, timeLocal: 1, ref: 1};
            expect(Message.isAckMessage(goodAckMessage)).to.equal(true);
        });
    });
});

describe('AliveMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isAliveMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isAliveMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isAliveMessage("hello")).to.equal(false);
        });
    });
    describe('Must have type field and must be correct type', function() {
        it('Should return false if missing type field', function() {
            const noType: any = {test: "hello"};
            expect(Message.isAliveMessage(noType)).to.equal(false);
        });
        it('Should return false if type field is not MessageType.ALIV', function() {
            const badType: any = {type: Message.MessageType.ERR};
            expect(Message.isAliveMessage(badType)).to.equal(false);
        });
    });
    describe("Validate on properly formed AliveMessage and any type with proper fields",
        function() {
        it('Should return true on correctly structured AliveMessage', function() {
            const goodAliveMessage: Message.AliveMessage = {type: Message.MessageType.ALIV};
            expect(Message.isAliveMessage(goodAliveMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodAliveMessage: any = {type: Message.MessageType.ALIV};
            expect(Message.isAliveMessage(goodAliveMessage)).to.equal(true);
        });
    });

});

describe('AuthMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isAuthMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isAuthMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isAuthMessage("hello")).to.equal(false);
        });
    });
    describe('Must have type field and must be correct type', function() {
        it('Should return false if missing type field', function() {
            const noType: any = {test: "hello"};
            expect(Message.isAuthMessage(noType)).to.equal(false);
        });
        it('Should return false if type field is not MessageType.AACK', function() {
            const badType: any = {type: Message.MessageType.ERR};
            expect(Message.isAuthMessage(badType)).to.equal(false);
        });
    });
    describe("Validate on properly formed AuthMessage and any type with proper fields",
        function() {
        it('Should return true on correctly structured AuthMessage', function() {
            const goodAuthMessage: Message.AuthMessage = {type: Message.MessageType.AACK};
            expect(Message.isAuthMessage(goodAuthMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodAuthMessage: any = {type: Message.MessageType.AACK};
            expect(Message.isAuthMessage(goodAuthMessage)).to.equal(true);
        });
    });
});

describe('DataMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isDataMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isDataMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isDataMessage("hello")).to.equal(false);
        });
    });
    describe("Must have type and body fields", function() {
        it('Should return false if missing type field', function() {
            const dbPayload: Message.DatabasePayload = {};
            const noType: any = {body: dbPayload};
            expect(Message.isDataMessage(noType)).to.equal(false);
        });
        it('Should return false if missing body field', function() {
            const noBody: any = {type: Message.MessageType.DATA};
            expect(Message.isDataMessage(noBody)).to.equal(false);
        });
    });
    describe("Fields must have correct types", function() {
        it('Should return false if type is not MessageType.DATA', function() {
            const dbPayload: Message.DatabasePayload = {};
            const badType: any = {type: Message.MessageType.ERR, body: dbPayload};
            expect(Message.isDataMessage(badType)).to.equal(false);
        });
    });
    describe("Should validate properly declared DataMessage and any type with proper fields", 
        function () {
        it('Should return true on correctly structured DataMessage', function() {
            const dbPayload: Message.DatabasePayload = {};
            const goodDataMessage: Message.DataMessage = {type: Message.MessageType.DATA, 
                body: dbPayload};
            expect(Message.isDataMessage(goodDataMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const dbPayload: Message.DatabasePayload = {};
            const goodDataMessage: any = {type: Message.MessageType.DATA, 
                body: dbPayload};
            expect(Message.isDataMessage(goodDataMessage)).to.equal(true);
        });
    });
});

describe('ErrorMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isErrorMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isErrorMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isErrorMessage("hello")).to.equal(false);
        });
    });
    describe("Must have type and errNo fields", function() {
        it('Should return false if missing type field', function() {
            const noType: any = {errNo: 1};
            expect(Message.isErrorMessage(noType)).to.equal(false);
        });
        it('Should return false if missing errNo field', function() {
            const noErrNo: any = {type: Message.MessageType.ERR};
            expect(Message.isErrorMessage(noErrNo)).to.equal(false);
        });
    });
    describe("Fields must have correct types", function() {
        it('Should return false if type is not MessageType.ERR', function() {
            const badType: any = {type: Message.MessageType.DATA, errNo: 1};
            expect(Message.isErrorMessage(badType)).to.equal(false);
        });
        it('Should return false if errNo is not a number', function() {
            const badType: any = {type: Message.MessageType.ERR, errNo: "HELLO"};
            expect(Message.isErrorMessage(badType)).to.equal(false);
        });
    });
    describe("Should validate properly declared ErrorMessage and any type with proper fields", 
        function () {
        it('Should return true on correctly structured ErrorMessage', function() {
            const goodErrorMessage: Message.ErrorMessage = {type: Message.MessageType.ERR, 
                errNo: 1};
            expect(Message.isErrorMessage(goodErrorMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodErrorMessage: any = {type: Message.MessageType.ERR, 
                errNo: 1};
            expect(Message.isErrorMessage(goodErrorMessage)).to.equal(true);
        });
    });
});

describe('NormalMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isNormalMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isNormalMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isNormalMessage("hello")).to.equal(false);
        });
    });
    describe("Must have type, id, timeLocal, and body fields", function() {
        it('Should return false if missing type field', function() {
            const noType: any = {id: 1, timeLocal: 1, body: "Hello world!"};
            expect(Message.isNormalMessage(noType)).to.equal(false);
        });
        it('Should return false if missing id field', function() {
            const noID: any = {type: Message.MessageType.MSG, timeLocal: 1, 
                body: "Hello world!"};
            expect(Message.isNormalMessage(noID)).to.equal(false);
        });
        it('Should return false if missing timeLocal field', function() {
            const noTimeLocal: any = {type: Message.MessageType.MSG, id: 1, 
                body: "Hello world!"};
            expect(Message.isNormalMessage(noTimeLocal)).to.equal(false);
        });
        it('Should return false if missing body field', function() {
            const noBody: any = {type: Message.MessageType.MSG, id: 1, 
                timeLocal: 1};
            expect(Message.isNormalMessage(noBody)).to.equal(false);
        });
    });
    describe("Fields must have correct types", function() {
        it('Should return false if type is not MessageType.MSG', function() {
            const badType: any = {type: Message.MessageType.ERR, id: 1,
                timeLocal: 1, body: "Hello world!"};
            expect(Message.isNormalMessage(badType)).to.equal(false);
        });
        it('Should return false if id is not number', function() {
            const badID: any = {type: Message.MessageType.MSG, id: "hello",
                timeLocal: 1, body: "Hello world!"};
            expect(Message.isNormalMessage(badID)).to.equal(false);
        });
        it('Should return false if timeLocal is not number', function() {
            const badTimeLocal: any = {type: Message.MessageType.MSG, id: 1,
                timeLocal: "hello", body: "Hello world!"};
            expect(Message.isNormalMessage(badTimeLocal)).to.equal(false);
        });
        it('Should return false if body is not string', function() {
            const badBody: any = {type: Message.MessageType.MSG, id: 1,
                timeLocal: 1, body: 1};
            expect(Message.isNormalMessage(badBody)).to.equal(false);
        });
    });
    describe("Validate on properly formed NormalMessage and any type with proper fields",
        function() {
        it('Should return true on correctly structured NormalMessage', function() {
            const goodNormalMessage: Message.NormalMessage = {type: Message.MessageType.MSG,
                id: 1, timeLocal: 1, body: "Hello world!"};
            expect(Message.isNormalMessage(goodNormalMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodNormalMessage: any = {type: Message.MessageType.MSG,
                id: 1, timeLocal: 1, body: "Hello world!"};
            expect(Message.isNormalMessage(goodNormalMessage)).to.equal(true);
        });
    });
});

describe('ReactMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isReacMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isReacMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isReacMessage("hello")).to.equal(false);
        });
    });
    describe("Must have type, id, timeLocal, body, and ref fields", function() {
        it('Should return false if missing type field', function() {
            const noType: any = {id: 1, timeLocal: 1, body: "Hello world!", 
                ref: 1};
            expect(Message.isReacMessage(noType)).to.equal(false);
        });
        it('Should return false if missing id field', function() {
            const noID: any = {type: Message.MessageType.REAC, timeLocal: 1, 
                body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(noID)).to.equal(false);
        });
        it('Should return false if missing timeLocal field', function() {
            const noTimeLocal: any = {type: Message.MessageType.REAC, id: 1, 
                body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(noTimeLocal)).to.equal(false);
        });
        it('Should return false if missing body field', function() {
            const noBody: any = {type: Message.MessageType.REAC, id: 1, 
                timeLocal: 1, ref: 1};
            expect(Message.isReacMessage(noBody)).to.equal(false);
        });
        it('Should return false if missing ref field', function() {
            const noRef: any = {type: Message.MessageType.REAC, id: 1, 
                timeLocal: 1, body: "Hello world!"};
            expect(Message.isReacMessage(noRef)).to.equal(false);
        });
    });
    describe("Fields must have correct types", function() {
        it('Should return false if type is not MessageType.REAC', function() {
            const badType: any = {type: Message.MessageType.ERR, id: 1,
                timeLocal: 1, body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(badType)).to.equal(false);
        });
        it('Should return false if id is not number', function() {
            const badID: any = {type: Message.MessageType.REAC, id: "hello",
                timeLocal: 1, body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(badID)).to.equal(false);
        });
        it('Should return false if timeLocal is not number', function() {
            const badTimeLocal: any = {type: Message.MessageType.REAC, id: 1,
                timeLocal: "hello", body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(badTimeLocal)).to.equal(false);
        });
        it('Should return false if body is not string', function() {
            const badBody: any = {type: Message.MessageType.REAC, id: 1,
                timeLocal: 1, body: 1, ref: 1};
            expect(Message.isReacMessage(badBody)).to.equal(false);
        });
        it('Should return false if ref is not number', function() {
            const badRef: any = {type: Message.MessageType.REAC, id: 1,
                timeLocal: 1, body: "Hello world!", ref: "hello"};
            expect(Message.isReacMessage(badRef)).to.equal(false);
        });
    });
    describe("Validate on properly formed ReacMessage and any type with proper fields",
        function() {
        it('Should return true on correctly structured ReacMessage', function() {
            const goodReacMessage: Message.ReacMessage = {type: Message.MessageType.REAC,
                id: 1, timeLocal: 1, body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(goodReacMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodReacMessage: any = {type: Message.MessageType.REAC,
                id: 1, timeLocal: 1, body: "Hello world!", ref: 1};
            expect(Message.isReacMessage(goodReacMessage)).to.equal(true);
        });
    });
});

describe('ReplyMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isReplyMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isReplyMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isReplyMessage("hello")).to.equal(false);
        });
    });
    describe("Must have type, id, timeLocal, body, and ref fields", function() {
        it('Should return false if missing type field', function() {
            const noType: any = {id: 1, timeLocal: 1, body: "Hello world!", 
                ref: [1]};
            expect(Message.isReplyMessage(noType)).to.equal(false);
        });
        it('Should return false if missing id field', function() {
            const noID: any = {type: Message.MessageType.RPLY, timeLocal: 1, 
                body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(noID)).to.equal(false);
        });
        it('Should return false if missing timeLocal field', function() {
            const noTimeLocal: any = {type: Message.MessageType.RPLY, id: 1, 
                body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(noTimeLocal)).to.equal(false);
        });
        it('Should return false if missing body field', function() {
            const noBody: any = {type: Message.MessageType.RPLY, id: 1, 
                timeLocal: 1, ref: [1]};
            expect(Message.isReplyMessage(noBody)).to.equal(false);
        });
        it('Should return false if missing ref field', function() {
            const noRef: any = {type: Message.MessageType.RPLY, id: 1, 
                timeLocal: 1, body: "Hello world!"};
            expect(Message.isReplyMessage(noRef)).to.equal(false);
        });
    });
    describe("Fields must have correct types", function() {
        it('Should return false if type is not MessageType.RPLY', function() {
            const badType: any = {type: Message.MessageType.ERR, id: 1,
                timeLocal: 1, body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(badType)).to.equal(false);
        });
        it('Should return false if id is not number', function() {
            const badID: any = {type: Message.MessageType.RPLY, id: "hello",
                timeLocal: 1, body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(badID)).to.equal(false);
        });
        it('Should return false if timeLocal is not number', function() {
            const badTimeLocal: any = {type: Message.MessageType.RPLY, id: 1,
                timeLocal: "hello", body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(badTimeLocal)).to.equal(false);
        });
        it('Should return false if body is not string', function() {
            const badBody: any = {type: Message.MessageType.RPLY, id: 1,
                timeLocal: 1, body: 1, ref: [1]};
            expect(Message.isReplyMessage(badBody)).to.equal(false);
        });
        // it('Should return false if ref is not number array', function() { //idk how to check this
        // });
    });
    describe("Validate on properly formed ReplyMessage and any type with proper fields",
        function() {
        it('Should return true on correctly structured ReplyMessage', function() {
            const goodReplyMessage: Message.ReplyMessage = {type: Message.MessageType.RPLY,
                id: 1, timeLocal: 1, body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(goodReplyMessage)).to.equal(true);
        });
        it('Should return true on correctly structured any object', function() {
            const goodReplyMessage: any = {type: Message.MessageType.RPLY,
                id: 1, timeLocal: 1, body: "Hello world!", ref: [1]};
            expect(Message.isReplyMessage(goodReplyMessage)).to.equal(true);
        });
    });
});

describe('isMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isMessage("hello")).to.equal(false);
        });
    });
    describe("Must validate on each type of valid message", function() {
        it('Should return true on Error Message', function() {
            const errMessage: Message.ErrorMessage = {type: Message.MessageType.ERR,
                errNo: 1};
            expect(Message.isMessage(errMessage)).to.equal(true);
        });
        it('Should return true on Normal Message', function() {
            const message: Message.NormalMessage = {type: Message.MessageType.MSG,
                id: 1, timeLocal: 1, body: "Hello world!"};
            expect(Message.isMessage(message)).to.equal(true);
        });
        it('Should return true on Reply Message', function() {
            const replyMessage: Message.ReplyMessage = {type: Message.MessageType.RPLY,
                id: 1, timeLocal: 1, body: "Hello world!", ref: [1]};
            expect(Message.isMessage(replyMessage)).to.equal(true);
        });
        it('Should return true on React Message', function() {
            const reacMessage: Message.ReacMessage = {type: Message.MessageType.REAC,
                id: 1, timeLocal: 1, body: "Hello world!", ref: 1};
            expect(Message.isMessage(reacMessage)).to.equal(true);
        });
        it('Should return true on Ack Message', function() {
            const ack: Message.AckMessage= {type: Message.MessageType.ACK,
                id: 1, timeLocal: 1, ref: 1};
            expect(Message.isMessage(ack)).to.equal(true);
        });
        it('Should return true on Auth Message', function() {
            const authMessage: Message.AuthMessage = {type:Message.MessageType.AACK};
            expect(Message.isMessage(authMessage)).to.equal(true);
        });
        it('Should return true on Alive Message', function() {
            const aliveMessage: Message.AliveMessage = {type:Message.MessageType.ALIV};
            expect(Message.isMessage(aliveMessage)).to.equal(true);
        });
        it('Should return true on Data Message', function() {
            const dbm: Message.DataMessage = {type: Message.MessageType.DATA,
                body: {}};
            expect(Message.isMessage(dbm)).to.equal(true);
        });
    });
    describe("Must not validate non-messages", function() {
        it('Should return false on non-message object', function() {
            const addr: Message.Address = {userID: "hello", deviceID: "world"};
            expect(Message.isMessage(addr)).to.equal(false);
        });
    });
});

describe('isCommMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isCommMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isCommMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isCommMessage("hello")).to.equal(false);
        });
    });
    describe("Must validate on each Normal, Reply, React, and Ack messages", function() {
        it('Should return true on Normal Message', function() {
            const message: Message.NormalMessage = {type: Message.MessageType.MSG,
                id: 1, timeLocal: 1, body: "Hello world!"};
            expect(Message.isCommMessage(message)).to.equal(true);
        });
        it('Should return true on Reply Message', function() {
            const replyMessage: Message.ReplyMessage = {type: Message.MessageType.RPLY,
                id: 1, timeLocal: 1, body: "Hello world!", ref: [1]};
            expect(Message.isCommMessage(replyMessage)).to.equal(true);
        });
        it('Should return true on React Message', function() {
            const reacMessage: Message.ReacMessage = {type: Message.MessageType.REAC,
                id: 1, timeLocal: 1, body: "Hello world!", ref: 1};
            expect(Message.isCommMessage(reacMessage)).to.equal(true);
        });
        it('Should return true on Ack Message', function() {
            const ack: Message.AckMessage= {type: Message.MessageType.ACK,
                id: 1, timeLocal: 1, ref: 1};
            expect(Message.isCommMessage(ack)).to.equal(true);
        });
    });
    describe("Must not validate anythinge else", function() {
        it('Should return false on Error Message', function() {
            const errMessage: Message.ErrorMessage = {type: Message.MessageType.ERR,
                errNo: 1};
            expect(Message.isCommMessage(errMessage)).to.equal(false);
        });
        it('Should return false on Auth Message', function() {
            const authMessage: Message.AuthMessage = {type:Message.MessageType.AACK};
            expect(Message.isCommMessage(authMessage)).to.equal(false);
        });
        it('Should return false on Alive Message', function() {
            const aliveMessage: Message.AliveMessage = {type:Message.MessageType.ALIV};
            expect(Message.isCommMessage(aliveMessage)).to.equal(false);
        });
        it('Should return false on Data Message', function() {
            const dbm: Message.DataMessage = {type: Message.MessageType.DATA,
                body: {}};
            expect(Message.isCommMessage(dbm)).to.equal(false);
        });
        it('Should return false on non-message object', function() {
            const addr: Message.Address = {userID: "hello", deviceID: "world"};
            expect(Message.isCommMessage(addr)).to.equal(false);
        });
    });
});

describe('isClientMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isClientMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isClientMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isClientMessage("hello")).to.equal(false);
        });
    });
    describe("Must have src, dst, timeServer, and payload fields", function() {
        it('Should return false if missing src field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const noSrc: any = {dst: tempAddr, timeServer: 1, payload: tempAlive};
            expect(Message.isClientMessage(noSrc)).to.equal(false);
        });
        it('Should return false if missing dst field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const noDst: any = {src: tempAddr, timeServer: 1, payload: tempAlive};
            expect(Message.isClientMessage(noDst)).to.equal(false);
        });
        it('Should return false if missing timeServer field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const noTimeServer: any = {src: tempAddr, dst: tempAddr, 
                payload: tempAlive};
            expect(Message.isClientMessage(noTimeServer)).to.equal(false);
        });
        it('Should return false if missing payload field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const noPayload: any = {src: tempAddr, dst: tempAddr, timeServer: 1};
            expect(Message.isClientMessage(noPayload)).to.equal(false);
        });   
    });
    describe("Fields must have correct types", function() {
        it('Should return false if src is not an Address', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const badSrc: any = {src: "hi", dst: tempAddr, timeServer: 1,
                payload: tempAlive};
            expect(Message.isClientMessage(badSrc)).to.equal(false);
        });
        it('Should return false if dst is not a string or Address', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const badDst: any = {src: tempAddr, dst: 1, timeServer: 1,
                payload: tempAlive};
            expect(Message.isClientMessage(badDst)).to.equal(false);
        });
        it('Should return false if timeServer is not a number', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const badTimeServer: any = {src: tempAddr, dst: tempAddr, 
                timeServer: "hi", payload: tempAlive};
            expect(Message.isClientMessage(badTimeServer)).to.equal(false);
        });
        it('Should return false if payload is not a Message', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const badPayload: any = {src: "hi", dst: tempAddr, timeServer: 1,
                payload: tempAddr};
            expect(Message.isClientMessage(badPayload)).to.equal(false);
        });
    });
    describe("Validate on properly formed ClientMessage or any type with proper fields", 
        function() {
        it('Should return true on proper ClientMessage with Address dst', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const clientMsg: Message.ClientMessage = {src: tempAddr, 
                dst: tempAddr, timeServer: 1, payload: tempAlive};
            expect(Message.isClientMessage(clientMsg)).to.equal(true);
        });
        it('Should return true on proper ClientMessage with string dst', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const clientMsg: Message.ClientMessage = {src: tempAddr, 
                dst: "hello", timeServer: 1, payload: tempAlive};
            expect(Message.isClientMessage(clientMsg)).to.equal(true);
        });
        it('Should return true on any with proper fields', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const tempAlive: Message.AliveMessage = {type:Message.MessageType.ALIV};
            const clientMsg: Message.ClientMessage = {src: tempAddr, 
                dst: tempAddr, timeServer: 1, payload: tempAlive};
            expect(Message.isClientMessage(clientMsg)).to.equal(true);
        });
    });
});

describe('isServerMessage Tests', function() {
    describe("Must be a non-null and non-undefined object", function() {
        it('Should return false on null', function() {
            expect(Message.isServerMessage(null)).to.equal(false);
        });
        it('Should return false on undefined', function() {
            expect(Message.isServerMessage(undefined)).to.equal(false);
        });
        it('Should return false on non-object', function() {
            expect(Message.isServerMessage("hello")).to.equal(false);
        });
    });
    describe("Must have src, dst, timeServer, and payload fields", function() {
        it('Should return false if missing src field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const noSrc: any = {dst: tempAddr, timeServer: 1, payload: "hello"};
            expect(Message.isServerMessage(noSrc)).to.equal(false);
        });
        it('Should return false if missing dst field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const noDst: any = {src: tempAddr, timeServer: 1, payload: "hello"};
            expect(Message.isServerMessage(noDst)).to.equal(false);
        });
        it('Should return false if missing payload field', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const noPayload: any = {src: tempAddr, dst: tempAddr, timeServer: 1};
            expect(Message.isServerMessage(noPayload)).to.equal(false);
        });   
    });
    describe("Fields must have correct types", function() {
        it('Should return false if src is not an Address', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const badSrc: any = {src: "hi", dst: tempAddr, timeServer: 1,
                payload: "hello"};
            expect(Message.isServerMessage(badSrc)).to.equal(false);
        });
        it('Should return false if dst is not a string or Address', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const badDst: any = {src: tempAddr, dst: 1, timeServer: 1,
                payload: "hello"};
            expect(Message.isServerMessage(badDst)).to.equal(false);
        });
        it('Should return false if timeServer is not a number', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const badTimeServer: any = {src: tempAddr, dst: "hello", 
                timeServer: "hello", payload: "hello"};
            expect(Message.isServerMessage(badTimeServer)).to.equal(false);
        });
        it('Should return false if payload is not a Message', function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const badPayload: any = {src: "hi", dst: tempAddr, timeServer: 1,
                payload: tempAddr};
            expect(Message.isServerMessage(badPayload)).to.equal(false);
        });
    });
    describe("Validate on properly formed ServerMessage or any type with proper fields", 
        function() {
        it('Should return true on proper ServerMessage with Address dst', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const serverMsg: Message.ServerMessage = {src: tempAddr, 
                dst: tempAddr, timeServer: 1, payload: "hello"};
            expect(Message.isServerMessage(serverMsg)).to.equal(true);
        });
        it('Should return true on proper ServerMessage with string dst', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const serverMsg: Message.ServerMessage = {src: tempAddr, 
                dst: "hello", timeServer: 1, payload: "hello"};
            expect(Message.isServerMessage(serverMsg)).to.equal(true);
        });
        it('Should return true on proper ServerMessage with no timeServer', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const serverMsg: Message.ServerMessage = {src: tempAddr, 
                dst: "hello", payload: "hello"};
            expect(Message.isServerMessage(serverMsg)).to.equal(true);
        });
        it('Should return true on any with proper fields', 
            function() {
            const tempAddr: Message.Address = {userID: "hi", deviceID: "hi"};
            const serverMsg: Message.ServerMessage = {src: tempAddr, 
                dst: tempAddr, timeServer: 1, payload: "hello"};
            expect(Message.isServerMessage(serverMsg)).to.equal(true);
        });
    });
});