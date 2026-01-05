import { ChromaClient } from "chromadb";

const client = new ChromaClient({
    host: "localhost", // TODO: make configurable
    port: 8000,
    protocol: "http"
});

export default class ChromaDb {
    constructor() {

    }

    async heartbeat() {
        return await client.heartbeat();
    }

    async version() {
        return await client.version();
    }

    async listCollections() {
        return await client.listCollections();
    }

    async listCollectionItems(collectionName, limit = 10, offset = 0) {
        const collection = await client.getCollection({ name: collectionName });
        const collectionInfo = await collection.get({
            limit: limit,
            offset: offset
        });
        return collectionInfo;
    }

    async deleteCollection(collectionName) {
        return await client.deleteCollection({ name: collectionName });
    }

    async collectionItemsCount(collectionName) {
        const collection = await client.getCollection({ name: collectionName });
        const countInfo = await collection.count();
        return countInfo;
    }
}