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
        currentCollectionEdit: null,

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
            if (col) {
                const clone = structuredClone(Alpine.raw(col));
                this.currentCollectionEdit = {};
                this.currentCollectionEdit.name = clone._name;
                this.currentCollectionEdit.metadata = clone._metadata;
                this.currentCollectionEdit.space = clone._configuration.hnsw.space;
                this.currentCollectionEdit.isNew = false;
                this.currentCollectionEdit.headerText = `Edit Collection`;
                this.currentCollectionEdit.buttonText = `Save Changes`;
            } else {
                this.currentCollectionEdit = {
                    name: "",
                    metadata: {},
                    space: "cosine",
                    isNew: true,
                    headerText: "Create Collection",
                    buttonText: "Create Collection"
                };
            }
            this.view = 'collectionEdit';
        },

        // collection metadata fields handlers
        addMetadata() {
            console.log("Add metadata");
            const newKey = 'key_' + Date.now();
            this.currentCollectionEdit.metadata[newKey] = '';
        },
        removeMetadata(key) {
            delete this.currentCollectionEdit.metadata[key];
        },
        updateMetadataKey(oldKey, newKey) {
            if (oldKey === newKey || !newKey) return;
            // Rename object key: copy value to new key, then delete old
            this.currentCollectionEdit.metadata[newKey] = this.currentCollectionEdit.metadata[oldKey];
            delete this.currentCollectionEdit.metadata[oldKey];
        },

        async saveCollectionEdit() {
            const edit = structuredClone(Alpine.raw(this.currentCollectionEdit));
            console.log(`Save collection edit: isNew=${edit.isNew}`);
            // const metadataObj = {};
            // for (const [key, value] of this.currentCollection.metadata) {
            //     if (key.trim() !== "") {
            //         metadataObj[key] = value;
            //     }
            // }
            // if (edit.isNew) {
            //     await client.createCollection(edit.name, { hnsw: { space: edit.space } }, metadataObj);
            // } else {
            //     await client.updateCollection(edit.name, null, metadataObj);
            // }
            //this.collections = await client.listCollections();
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