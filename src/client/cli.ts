import {prompt} from 'prompts'
import {Address, Message, MessageType} from '../shared/types/Message'

/**
 * Function to ask the user for login credentials. Will display a command line
 * prompt for a Username and a Password.
 * @returns Promise<[string, string]> containing [username, password], both of
 *          which can be undefined or empty strings.
 */
export async function getLoginCredentials(): Promise<[string, string]> {
    const loginQuesions = [
        {
            type: 'text',
            name: 'username',
            message: 'What\'s your username?', 
        },
        {
            type: 'password',
            name: 'password',
            message: 'What\'s your password?' 
        }
    ]; 

    // get responses
    const response: any = await prompt(loginQuesions);


    return new Promise<[string, string]>((resolve) => {
        resolve([response.username, response.password]);
    })
}

export async function getMessageFromUser(): Promise<[Message, Address]> {
    var dst: Address, payload: Message;

    const askMessageType = [
        {
            type: 'select',
            name: 'msg_type',
            message: 'Select a type of message',
            choices: [
                {title: 'Error', value: MessageType.ERR},
                {title: 'Message', value: MessageType.MSG},
                {title: 'Reply', value: MessageType.RPLY},
                {title: 'Reaction', value: MessageType.REAC},
                {title: 'Acknowledge', value: MessageType.ACK},
                {title: 'Authentication', value: MessageType.AACK},
                {title: 'Alive', value: MessageType.ALIV},
                {title: 'Data', value: MessageType.DATA},
            ],
            initial: 0
        },
    ];

    var msgType: MessageType = await prompt(askMessageType);
    

    console.log(isMessageType(msgType));
    
    return new Promise<[Message, Address]>((resolve) => {
        resolve([payload, dst]);
    });
}

var resp1: string, resp2: string;

(async function() {
    await getMessageFromUser();
})();