import { setClient, getClient, DB } from '../server/mongoConnector';

export async function resetMongo(): Promise<void> {
    const client = await getClient();
    await client.db(DB).dropDatabase();
    await client.db('messagequeues').dropDatabase();
}

export async function closeMongo(): Promise<void> {
    await (await getClient()).close();
    setClient('', '', '127.0.0.1');
}

export function setupMongo(): void {
    setClient('', '', '127.0.0.1');
}
