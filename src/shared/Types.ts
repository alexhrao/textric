
// File for shared types, interfaces, and enums within Textric.

/**
 * An enum to denote the different types of textric messages.
 * 
 * ERR is for errors
 * MSG is for text messages
 * RPLY is for replies
 * REAC is for reactions
 * ALIV is for keep-alive messages
 * ACK is for acknowledgements
 * DBM is for database messages
 */
 export enum MessageType {
    ERR = -1,
    MSG,
    RPLY,
    REAC,
    ALIV,
    ACK,
    DBM
}

/**
 * The interface for messages in textric
 */
interface Message {

    // Fields
    dst: string;        // destination
    src: string;        // source
    timeLocal: Date;    // local timestamp
    timeServer: Date;   // textric server timestamp
    type: MessageType;  // type of message
    idNumber: number;   // id number for the message
    ref: number[];        // id numbers of referenced messages as array (can reference multiple messages)
    payload: string;    // payload of message
}

