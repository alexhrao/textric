import { MongoClient } from 'mongodb';

let client: MongoClient | undefined = undefined;
/**
 * The default database
 */
export const DB = 'default';
/**
 * Setup the client, closing the previous if necessary
 * 
 * @param user The MongoDB Username
 * @param pass The MongoDB Password
 * @param url The MongoDB URL
 */
export function setClient(user: string, pass: string, url: string): void;
/**
 * Setup the client, using environment variables
 */
export function setClient(): void;
export function setClient(user?: string, pass?: string, url?: string): void {
    if (client !== undefined) {
        // No need to wait!
        client.close();
    }
    if (user === undefined || pass === undefined || url === undefined) {
        if (
            !process.env['MONGO_USER'] ||
            !process.env['MONGO_PASS'] ||
            !process.env['MONGO_URL']
        ) {
            throw new Error('Mongo Credentials were not provided');
        }

        user = process.env['MONGO_USER'];
        pass = encodeURIComponent(process.env['MONGO_PASS']);
        url = process.env['MONGO_URL'];
    }
    if (user.length === 0) {
        const CONN_URL = `mongodb://${url}?retryWrites=true&writeConcern=majority`;
        client = new MongoClient(CONN_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    } else {
        const CONN_URL = `mongodb://${user}:${pass}@${url}?retryWrites=true&writeConcern=majority`;
        client = new MongoClient(CONN_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
}
/**
 * Get the MongoDB client
 * 
 * @returns A Promise that resolves to a valid MongoDB client
 * @throws Will error if the client hasn't been previously set
 * 
 * @see setClient
 */
export async function getClient(): Promise<MongoClient> {
    if (client === undefined) {
        throw new Error(
            'Client was not initialized; make sure you called setClient!',
        );
    }
    if (client.isConnected()) {
        return client;
    }
    await client.connect();
    return client;
}
