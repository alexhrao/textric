import { MessageType } from "./MessageType";

/**
 * The class for messages in textric
 */
class Message {

    // Fields
    dst: String;        // destination
    src: String;        // source
    timeLocal: Date;    // local timestamp
    timeServer: Date;   // textric server timestamp
    type: MessageType;  // type of message
    idNumber: number;   // id number for the message
    ref: number[];        // id numbers of referenced messages as array (can reference multiple messages)
    payload: String;    // payload of message

    // Constructor
    constructor( dst: String, src: String, timeLocal: Date, timeServer: Date,
        type: MessageType, idNumber: number, ref: number[], payload: String) {
        
        this.dst = dst;
        this.src = src;
        this.timeLocal = timeLocal;
        this.timeServer = timeServer;
        this.type = type;
        this.idNumber = idNumber;
        this.ref = ref;
        this.payload = payload;
    }

    // Static factory methods for each type of message with message type preset
    public static makeMessage(dst:String, src:String, idNumber:number, 
        payload:String, isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.MSG, idNumber, null, payload);
        } else {
            return new Message(dst, src, new Date(), null, MessageType.MSG, 
            idNumber, null, payload);
        }
    }

    // Note: replies and reactions will probably never come from the server but 
    // including support just in case.
    public static makeReply(dst:String, src:String, idNumber:number, 
        ref:number[], payload:String, isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.RPLY, idNumber, ref, payload);
        } else {
            return new Message(dst, src, new Date(), null, MessageType.RPLY, 
            idNumber, ref, payload);
        }
    }

    public static makeReact(dst:String, src:String, idNumber:number, 
        ref:number[], payload:String, isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.REAC, idNumber, ref, payload);
        } else {
            return new Message(dst, src, new Date(), null, MessageType.REAC, 
            idNumber, ref, payload);
        }
    }

    // I feel like errors and keep-alives will only be sent from the server, 
    // but including support in case.
    public static makeError(dst:String, src:String, idNumber:number, 
        ref:number[], payload:String, isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.ERR, idNumber, ref, payload);
        } else {
            return new Message(dst, src, new Date(), null, MessageType.ERR, 
            idNumber, ref, payload);
        }
    }

    public static makeAlive(dst:String, src:String, idNumber:number, 
        isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.ALIV, idNumber, null, null);
        } else {
            return new Message(dst, src, new Date(), null, MessageType.ALIV, 
            idNumber, null, null);
        }
    }

    public static makeAck(dst:String, src:String, ref:number[], 
        isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.ACK, null, ref, null);
        } else {
            return new Message(dst, src, new Date(), null, 
            MessageType.ACK, null, ref, null);
        }
    }

    // I also feel like this will never be sent from server. And we probably
    // don't need the ref field, but including in case.
    public static makeDatabaseMessage(dst:String, src:String, idNumber:number, 
        ref:number[], payload:String, isServer:boolean): Message {
        if (isServer) {
            return new Message(dst, src, new Date(), new Date(), 
            MessageType.DBM, idNumber, ref, payload);
        } else {
            return new Message(dst, src, new Date(), null, 
            MessageType.DBM, idNumber, ref, payload);
        }
    }
}