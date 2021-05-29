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
 * DBM is for database messages
 */
 export enum MessageType {
    ERR = -1,
    MSG,
    RPLY,
    REAC,
    ALIV,
    ACK,
    AACK,
    DBM
}

/**
 * The interface for messages in textric
 */
export interface Message {

    // Fields
    dst: string;        // destination
    src: string;        // source
    timeLocal: number;    // local timestamp
    timeServer: number|null;   // textric server timestamp
    type: MessageType;  // type of message
    idNumber: number;   // id number for the message
    ref: number[];        // id numbers of referenced messages as array (can reference multiple messages)
    payload: string;    // payload of message
}
export function isMessage(msg: unknown): msg is Message {
    if (typeof msg !== 'object' || msg === null || msg === undefined) {
        return false;
    } else if (
        'dst' in msg &&
        'src' in msg &&
        'timeLocal' in msg &&
        'timeServer' in msg &&
        'type' in msg &&
        'idNumber' in msg &&
        'ref' in msg &&
        'payload' in msg
    ) {
        return true;
    } else {
        return false;
    }
}