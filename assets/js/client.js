function app() {
    return {
        view: 'dashboard',
        collections: [],
        currentCollection: null,
        documents: [],
        version: "",
        currentOffset: 0,
        footerTableItemsPagingText: "",
        footerTableItemsPagingPreviousDisabled: true,
        footerTableItemsPagingNextDisabled: true,

        async LIMIT() {
            return 10;
        },

        async init() {
            client = new ChromaDbClient();
            const heartbeat = await client.heartbeat();
            console.log(`🩷 ${heartbeat}`);
            this.version = await client.version();
            this.collections = await client.listCollections();
        },

        async showDashboard() {
            this.view = 'dashboard';
        },

        async openCollection(col) {
            if (col._name !== this.currentCollection?._name) {
                this.currentOffset = 0;
            }

            this.currentCollection = col;
            
            const LIMIT = await this.LIMIT();
            const count = await client.countItems(col._name);
            const data = await client.items(col._name, LIMIT, this.currentOffset);
            
            this.footerTableItemsText = await this.footerTableItems(col);
            this.footerTableItemsPagingPreviousDisabled = this.currentOffset === 0;
            this.footerTableItemsPagingNextDisabled = (this.currentOffset + LIMIT) >= count;

            this.documents = data.ids.map((id, i) => ({
                id,
                document: data.documents[i],
                metadata: data.metadatas[i] || {}
            }));

            this.view = 'collection';
        },

        async deleteCollection(col) {
            if (confirm(`Delete collection ${col._name}? This action cannot be undone.`)) {
                await client.deleteCollection(col._name);
                this.collections = await client.listCollections();
                this.view = 'dashboard';
            }
        },

        async editCollection(col) {
            console.log("Edit collection", col._name);
        },

        async itemsCount(col) {
            const count = await client.countItems(col._name);
            return `${count} items`;
        },

        async addDocument() {
            console.log("Add document");
        },

        async footerTableItems(col) {
            const count = await client.countItems(col._name);
            const LIMIT = await this.LIMIT();
            this.footerTableItemsPagingText = `Showing ${this.currentOffset + 1}-${Math.min(this.currentOffset + LIMIT, count)} of ${count}`;
            return this.footerTableItemsPagingText;
        },

        async footerTableItemsPagingPreviousClick(col) {
            const LIMIT = await this.LIMIT();
            this.currentOffset -= LIMIT;
            this.footerTableItemsPagingText = await this.footerTableItems(col);
            this.openCollection(col);
        },

        async footerTableItemsPagingNextClick(col) {
            const LIMIT = await this.LIMIT();
            this.currentOffset += LIMIT;            
            this.footerTableItemsPagingText = await this.footerTableItems(col);
            this.openCollection(col);
        },
    }
}