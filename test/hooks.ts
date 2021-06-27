import { closeMongo, setupMongo } from './mongoUtils';
export const mochaHooks = {
    beforeAll: (): void => {
        console.log('hello!');
        setupMongo();
    },
    afterAll: async (): Promise<void> => {
        await closeMongo();
    },
};
