function app() {
    return {
        view: 'dashboard',
        collections: [],
        currentCollection: null,
        documents: [],

        async init() {
            client = new ChromaDbClient();
            const heartbeat = await client.heartbeat();
            console.log(`🩷 ${heartbeat}`);
            this.collections = await client.listCollections();
        },

        async showDashboard() {
            this.view = 'dashboard';
        },

        async openCollection(col) {
            this.currentCollection = col;
            const data = await client.items(col._name, 50, 0);

            this.documents = data.ids.map((id, i) => ({
                id,
                document: data.documents[i],
                metadata: data.metadatas[i] || {}
            }));

            this.view = 'collection';
        },
    }
}