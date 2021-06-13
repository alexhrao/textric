/**
 * An enum to denote the different types of textric messages.
 *
 * ERR is for errors
 * MSG is for text messages
 * RPLY is for replies
 * REAC is for reactions
 * ALIV is for keep-alive messages
 * ACK is for acknowledgements
 * AACK is for authentication acknowledgements
 * DATA is for database messages
 */
export enum MessageType {
    ERR = -1,
    MSG,
    RPLY,
    REAC,
    ACK,
    AACK,
    ALIV,
    DATA,
    MAX     // unused, for internal purposes
}

export interface Address {
    handle: string;
    deviceID: string;
}
// eslint-disable-next-line
export interface DatabasePayload {
    // Eventually mirrors JSON payload we'll send to other device
}

// This is the types of message that the server sees. It contains source,
// destination, field for the server to add its timestamp, and a payload,
// which is assumed to be an encrypted ClientMessage.
export interface ServerMessage {
    src: Address;
    dst: string | Address; // to include ErrorMessage
    timeServer?: number; // made optional because client will not have this field
    payload: string; // NOTE: Assumed to be decodeable to a ClientMessage
}

export interface ClientMessage {
    src: Address;
    dst: string | Address; // to include ErrorMessage
    timeServer: number; // nonoptional because client will know this field
    payload: Message; // NOTE: Assumed to be decodeable to a ClientMessage
}

export interface ErrorMessage {
    type: MessageType.ERR;
    errNo: number;
}
export interface NormalMessage {
    type: MessageType.MSG;
    id: number;
    timeLocal: number;
    body: string;
}

export interface ReplyMessage {
    type: MessageType.RPLY;
    id: number;
    timeLocal: number;
    body: string;
    ref: number[];
}

export interface ReacMessage {
    type: MessageType.REAC;
    id: number;
    timeLocal: number;
    body: string; // Single emoji
    ref: number;
}

export interface AckMessage {
    type: MessageType.ACK;
    id: number;
    timeLocal: number;
    ref: number;
}

export interface AuthMessage {
    type: MessageType.AACK;
}

export interface AliveMessage {
    type: MessageType.ALIV;
}

export interface DataMessage {
    type: MessageType.DATA;
    body: DatabasePayload;
}

export type Message =
    | ErrorMessage
    | NormalMessage
    | ReplyMessage
    | ReacMessage
    | AckMessage
    | AuthMessage
    | AliveMessage
    | DataMessage;

// ------------------------------ Validation functions ------------------------------
export function isServerMessage(msg: unknown): msg is ServerMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'src' in msg &&
        'dst' in msg &&
        'timeServer' in msg &&
        'payload' in msg &&
        isAddress((<ServerMessage>msg).src) &&
        (typeof (<ServerMessage>msg).dst === 'string' ||
            isAddress((<ServerMessage>msg).dst)) &&
        typeof (<ServerMessage>msg).timeServer === 'number' &&
        typeof (<ServerMessage>msg).payload === 'string'
    ) {
        return true;
    } else if (
        'src' in msg &&
        'dst' in msg &&
        !('timeServer' in msg) &&
        'payload' in msg &&
        isAddress((<ServerMessage>msg).src) &&
        (typeof (<ServerMessage>msg).dst === 'string' ||
            isAddress((<ServerMessage>msg).dst)) &&
        typeof (<ServerMessage>msg).payload === 'string'
    ) {
        return true;
    } else {
        return false;
    }
}

export function isClientMessage(msg: unknown): msg is ClientMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'src' in msg &&
        'dst' in msg &&
        'timeServer' in msg &&
        'payload' in msg &&
        isAddress((<ClientMessage>msg).src) &&
        (typeof (<ClientMessage>msg).dst === 'string' ||
            isAddress((<ClientMessage>msg).dst)) &&
        typeof (<ClientMessage>msg).timeServer === 'number' &&
        isMessage((<ClientMessage>msg).payload)
    ) {
        return true;
    } else {
        return false;
    }
}

export function isMessage(msg: unknown): msg is Message {
    if (typeof msg !== 'object' || msg === null || msg === undefined)
        return false;
    else
        return (
            isErrorMessage(msg) ||
            isNormalMessage(msg) ||
            isReplyMessage(msg) ||
            isReacMessage(msg) ||
            isAckMessage(msg) ||
            isAuthMessage(msg) ||
            isAliveMessage(msg) ||
            isDataMessage(msg)
        );
}

type CommMessage = NormalMessage | ReplyMessage | ReacMessage | AckMessage;

export function isCommMessage(msg: unknown): msg is CommMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if ('timeLocal' in msg && 'type' in msg && 'id' in msg) {
        return true;
    } else {
        return false;
    }
}

export function isErrorMessage(msg: unknown): msg is ErrorMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'type' in msg &&
        'errNo' in msg &&
        typeof (<ErrorMessage>msg).errNo === 'number' &&
        (<ErrorMessage>msg).type == MessageType.ERR
    ) {
        return true;
    } else {
        return false;
    }
}
export function isNormalMessage(msg: unknown): msg is NormalMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'type' in msg &&
        'id' in msg &&
        'timeLocal' in msg &&
        'body' in msg &&
        typeof (<NormalMessage>msg).id === 'number' &&
        typeof (<NormalMessage>msg).timeLocal === 'number' &&
        typeof (<NormalMessage>msg).body === 'string' &&
        (<NormalMessage>msg).type == MessageType.MSG
    ) {
        return true;
    } else {
        return false;
    }
}

export function isReplyMessage(msg: unknown): msg is ReplyMessage {
    const rep = <ReplyMessage>msg;
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'type' in msg &&
        'id' in msg &&
        'timeLocal' in msg &&
        'body' in msg &&
        'ref' in msg &&
        typeof rep.id === 'number' &&
        typeof rep.timeLocal === 'number' &&
        typeof rep.body === 'string' &&
        Array.isArray(rep.ref) &&
        rep.ref.length > 0 &&
        typeof rep.ref[0] === 'number' &&
        rep.type == MessageType.RPLY
    ) {
        return true;
    } else {
        return false;
    }
}

export function isReacMessage(msg: unknown): msg is ReacMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'type' in msg &&
        'id' in msg &&
        'timeLocal' in msg &&
        'body' in msg &&
        'ref' in msg &&
        typeof (<ReacMessage>msg).id === 'number' &&
        typeof (<ReacMessage>msg).timeLocal === 'number' &&
        typeof (<ReacMessage>msg).body === 'string' &&
        typeof (<ReacMessage>msg).ref === 'number' &&
        (<ReacMessage>msg).type == MessageType.REAC
    ) {
        return true;
    } else {
        return false;
    }
}

export function isAckMessage(msg: unknown): msg is AckMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'type' in msg &&
        'id' in msg &&
        'timeLocal' in msg &&
        'ref' in msg &&
        typeof (<AckMessage>msg).id === 'number' &&
        typeof (<AckMessage>msg).timeLocal === 'number' &&
        typeof (<AckMessage>msg).ref === 'number' &&
        (<AckMessage>msg).type == MessageType.ACK
    ) {
        return true;
    } else {
        return false;
    }
}

export function isAuthMessage(msg: unknown): msg is AuthMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if ('type' in msg && (<AuthMessage>msg).type == MessageType.AACK) {
        return true;
    } else {
        return false;
    }
}

export function isAliveMessage(msg: unknown): msg is AliveMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if ('type' in msg && (<AliveMessage>msg).type == MessageType.ALIV) {
        return true;
    } else {
        return false;
    }
}

export function isDataMessage(msg: unknown): msg is DataMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'type' in msg &&
        'body' in msg &&
        (<DataMessage>msg).type == MessageType.DATA &&
        isDatabasePayload((<DataMessage>msg).body)
    ) {
        return true;
    } else {
        return false;
    }
}

export function isAddress(addr: unknown): addr is Address {
    if (typeof addr !== 'object' || addr === null || addr === undefined) {
        return false;
    } else if (
        'handle' in addr &&
        'deviceID' in addr &&
        typeof (<Address>addr).deviceID === 'string' &&
        typeof (<Address>addr).handle === 'string'
    ) {
        return true;
    } else {
        return false;
    }
}

// TODO: Update this when database payload is updated
export function isDatabasePayload(
    payload: unknown,
): payload is DatabasePayload {
    // if (typeof payload !== 'object' || payload === null || payload === undefined) {
    //     return false;
    // } else {
    //     return true;
    // }
    return true;
}

export function isMessageType(msgType: unknown): msgType is MessageType {
    if (typeof msgType !== 'object' || msgType === null || msgType === undefined) {
        return false;
    } else if (msgType.valueOf() >= -1 && msgType.valueOf() <= MessageType.MAX.valueOf()) {
        return true;
    } else {
        return false;
    }
}
