
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