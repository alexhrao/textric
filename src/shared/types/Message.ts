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

export interface ErrorMessage {
    type: MessageType.ERR;
    dst: string|Address;
    timeServer: number;
}
export interface NormalMessage {
    type: MessageType.MSG;
    id: number;
    src: Address;
    dst: string;
    timeLocal: number;
    timeServer: number;
    payload: string;
}

export interface ReplyMessage {
    type: MessageType.RPLY;
    id: number;
    src: Address;
    dst: string;
    timeLocal: number;
    timeServer: number;
    payload: string;
    ref: number[];
}

export interface ReacMessage {
    type: MessageType.REAC;
    id: number;
    src: Address;
    dst: string;
    timeLocal: number;
    timeServer: number;
    payload: string; // Single emoji
    ref: number;
}

export interface AckMessage {
    type: MessageType.ACK;
    id: number;
    src: Address;
    dst: string;
    timeLocal: number;
    timeServer: number;
    ref: number;
}

export interface AuthMessage {
    type: MessageType.AACK;
    timeServer: number;
}

export interface AliveMessage {
    type: MessageType.ALIV;
}

export interface DataMessage {
    type: MessageType.DATA;
    src: Address;
    dst: Address;
    payload: DatabasePayload;
}

export type Message = ErrorMessage | NormalMessage | ReplyMessage | ReacMessage | AckMessage | AuthMessage | AliveMessage | DataMessage;
export function isCommMessage(msg: unknown): msg is NormalMessage|ReplyMessage|ReacMessage|AckMessage {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'dst' in msg &&
        'src' in msg &&
        'timeLocal' in msg &&
        'timeServer' in msg &&
        'type' in msg &&
        'id' in msg
    ) {
        return true;
    } else {
        return false;
    }
}