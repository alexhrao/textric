"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getMessageFromUser = exports.getLoginCredentials = void 0;
var prompts_1 = require("prompts");
var Message_1 = require("../shared/types/Message");
/**
 * Function to ask the user for login credentials. Will display a command line
 * prompt for a Username and a Password.
 * @returns Promise<[string, string]> containing [username, password], both of
 *          which can be undefined or empty strings.
 */
function getLoginCredentials() {
    return __awaiter(this, void 0, void 0, function () {
        var loginQuesions, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    loginQuesions = [
                        {
                            type: 'text',
                            name: 'username',
                            message: 'What\'s your username?'
                        },
                        {
                            type: 'password',
                            name: 'password',
                            message: 'What\'s your password?'
                        }
                    ];
                    return [4 /*yield*/, prompts_1.prompt(loginQuesions)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, new Promise(function (resolve) {
                            resolve([response.username, response.password]);
                        })];
            }
        });
    });
}
exports.getLoginCredentials = getLoginCredentials;
function getMessageFromUser() {
    return __awaiter(this, void 0, void 0, function () {
        function logAndReturnNull() {
            console.log("You must select a message type to send a message. Aborting...");
        }
        var dst, payload, askMessageType, msgType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    askMessageType = [
                        {
                            type: 'select',
                            name: 'msg_type',
                            message: 'Select a type of message',
                            choices: [
                                { title: 'Error', value: Message_1.MessageType.ERR },
                                { title: 'Message', value: Message_1.MessageType.MSG },
                                { title: 'Reply', value: Message_1.MessageType.RPLY },
                                { title: 'Reaction', value: Message_1.MessageType.REAC },
                                { title: 'Acknowledge', value: Message_1.MessageType.ACK },
                                { title: 'Authentication', value: Message_1.MessageType.AACK },
                                { title: 'Alive', value: Message_1.MessageType.ALIV },
                                { title: 'Data', value: Message_1.MessageType.DATA },
                            ],
                            initial: 0
                        },
                    ];
                    return [4 /*yield*/, prompts_1.prompt(askMessageType, { onCancel: logAndReturnNull })];
                case 1:
                    msgType = _a.sent();
                    console.log(Message_1.isMessageType(msgType));
                    return [2 /*return*/, new Promise(function (resolve) {
                            resolve([payload, dst]);
                        })];
            }
        });
    });
}
exports.getMessageFromUser = getMessageFromUser;
console.log(Message_1.MessageType.MAX);
var resp1, resp2;
(function () {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getMessageFromUser()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
})();
