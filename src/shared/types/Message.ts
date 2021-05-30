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
}

export interface Address {
    userID: string;
    deviceID: string;
}


interface DatabasePayload {
    // Eventually mirrors JSON payload we'll send to other device
}

// This is the types of message that the server sees. It contains source,
// destination, field for the server to add its timestamp, and a payload,
// which is assumed to be an encrypted ClientMessage.
export interface ServerMessage {
    src: Address;
    dst: string|Address; // to include ErrorMessage
    timeServer?: number; // made optional because client will not have this field
    payload: string; // NOTE: Assumed to be decodeable to a ClientMessage
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

export type ClientMessage = ErrorMessage | NormalMessage | ReplyMessage | ReacMessage | AckMessage | AuthMessage | AliveMessage | DataMessage;
export function isCommMessage(msg: unknown): msg is NormalMessage|ReplyMessage|ReacMessage|AckMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'timeLocal' in msg &&
        'type' in msg &&
        'id' in msg
    ) {
        return true;
    } else {
        return false;
    }
}