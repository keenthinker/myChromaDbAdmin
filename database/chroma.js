import { ChromaClient } from "chromadb";

let client = undefined;

export default class ChromaDb {
    constructor(host, port, protocol) {
        client = new ChromaClient({
            host: host,
            port: port,
            protocol: protocol
        });
    }

    async heartbeat() {
        return await client.heartbeat();
    }

    async version() {
        return await client.version();
    }

    async listCollections() {
        const collections = await client.listCollections();
        return collections.sort((c1, c2) => c1._name.localeCompare(c2._name));
    }

    async listCollectionItems(collectionName, limit = 10, offset = 0) {
        const collection = await client.getCollection({ name: collectionName });
        const collectionInfo = await collection.get({
            limit: limit,
            offset: offset
        });
        return collectionInfo;
    }

    async createCollection(collectionName, configuration, metadata) {

        function isNotEmpty(obj) {
            return obj &&
                typeof obj === 'object' &&
                !Array.isArray(obj) &&
                Object.keys(obj).length > 0;
        }

        let createConfiguration = {
            name: collectionName,
            configuration: configuration
        }

        if (isNotEmpty(metadata)) {
            createConfiguration.metadata = metadata;
        }
        return await client.createCollection(createConfiguration);
    }

    // Update name or metadata
    async updateCollection(collectionName, newCollectionName, newMetadata) {

        function isNotEmpty(obj) {
            return obj &&
                typeof obj === 'object' &&
                !Array.isArray(obj) &&
                Object.keys(obj).length > 0;
        }

        const collection = await client.getCollection({ name: collectionName });
        const collectionConfiguration = { name: newCollectionName };
        if (isNotEmpty(newMetadata)) {
            collectionConfiguration.metadata = newMetadata;
        }
        return await collection.modify(collectionConfiguration);
    }

    async deleteCollection(collectionName) {
        return await client.deleteCollection({ name: collectionName });
    }

    async collectionItemsCount(collectionName) {
        const collection = await client.getCollection({ name: collectionName });
        const countInfo = await collection.count();
        return countInfo;
    }

    async getEmbeddings(collectionName, documentId) {
        const collection = await client.getCollection({ name: collectionName });
        const result = await collection.get({
            ids: [documentId],
            include: ['embeddings']
        });
        return result;
    }

    async upsertItems(collectionName, ids, documents, metadatas) {

        function isNotEmpty(obj) {
            return obj &&
                typeof obj === 'object' &&
                !Array.isArray(obj) &&
                Object.keys(obj).length > 0;
        }

        const collection = await client.getCollection({ name: collectionName });
        let data = {
            ids: ids,
            documents: documents
        };
        for (let i = 0; i < metadatas.length; i++) {
            const metadata = metadatas[i];
            if (isNotEmpty(metadata)) {
                data = { ...data, metadatas: metadatas };
                break;
            }
        };
        return await collection.upsert(data);
    }

    async deleteItems(collectionName, ids) {
        const collection = await client.getCollection({ name: collectionName });
        return await collection.delete({ ids: ids });
    }

    async collectionExists(collectionName) {
        const collections = await client.listCollections();
        collections.forEach(col => console.log(col._name));
        const exists = collections.some(col => col._name === collectionName);
        return exists;
    }

    async allDocumentsCount(offset, total = 0) {
        const limit = 100;
        const collectionsSubset = await client.listCollections({ limit: limit, offset: offset });
        let collectionDocumentsCount = 0;
        for (const collection of collectionsSubset) {
            const currentCollectionDocumentsCount = await collection.count();
            collectionDocumentsCount += currentCollectionDocumentsCount;
        }
        return (collectionsSubset.length === limit) ? await totalCollectionsDocumentsCount(offset + limit, total + collectionDocumentsCount) : total + collectionDocumentsCount;
    }

    async collectionItemsSearch(collectionName, searchType, searchText, limit = 10) {
        const collection = await client.getCollection({ name: collectionName });
        // Semantic/Similarity search over the complete set of documents in the collection.
        const queryOptions = {
            queryTexts: [searchText],
            nResults: limit,
            // where: { "status": "active" },
            //whereDocument: { "$contains": searchText }
        };
        if (searchType === 'exact') {
            queryOptions.whereDocument = { "$contains": searchText };
        }
        const searchResults = await collection.query(queryOptions);
        return searchResults;
    }

}