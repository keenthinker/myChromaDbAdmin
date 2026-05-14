function app() {
    return {
        view: 'dashboard',
        collections: [],
        currentCollection: null,
        documents: [],
        documentsCount: 0,
        version: "unknown",
        currentOffset: 0,
        footerTableItemsPagingText: "",
        footerTableItemsPagingPreviousDisabled: true,
        footerTableItemsPagingNextDisabled: true,
        currentCollectionEdit: null,
        currentDocumentEdit: null,
        packageVersion: "",
        databaseAddress: "http://localhost:8000", // todo: make configurable,
        globalError: false,
        userSettings: {
            username: ""
        },
        searchQuery: '',
        isSearching: false,
        searchType: 'similarity', 

        async LIMIT() {
            return 10;
        },

        async init() {
            if (window.userData) {
                this.userSettings.username = window.userData.username || "";
            }
            client = new ChromaDbClient();
            this.packageVersion = await client.packageVersion();
            const heartbeat = await client.heartbeat();
            if (heartbeat.error) {
                this.globalError = true;
            } else {
                this.globalError = false;
                console.log(`🩷 ${heartbeat}`);
                this.version = await client.version();
                this.collections = await client.listCollections();
                this.documentsCount = await client.countAllDocuments();
            }
        },

        async showDashboard() {
            this.collections = await client.listCollections();
            this.documentsCount = await client.countAllDocuments();
            this.resetSearch(false);
            this.view = 'dashboard';
        },

        async openCollection(col) {
            if (col) {
                this.resetSearch(false);
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
                    metadata: data.metadatas[i] || {},
                    distance: null
                }));

                this.view = 'collection';
            } else {
                this.view = 'dashboard';
            }
        },

        async deleteCollection(col) {
            await client.deleteCollection(col._name);
            this.collections = await client.listCollections();
            this.view = 'dashboard';
        },

        async editCollection(col, confirmDelete = false) {
            if (col) {
                const clone = structuredClone(Alpine.raw(col));
                this.currentCollectionEdit = {};
                this.currentCollectionEdit.name = clone._name;

                const metadataObject = col._metadata || {};
                const metadataArray = Object.entries(metadataObject).map(([key, value]) => ({
                    id: this.metadataKeyGenerator(),
                    key: key,
                    value: value
                }));

                this.currentCollectionEdit.metadata = metadataArray.sort((mdi1, mdi2) => mdi1.key.localeCompare(mdi2.key)); //;clone._metadata || [];
                this.currentCollectionEdit.space = clone._configuration.hnsw.space;
                this.currentCollectionEdit.isNew = false;
                this.currentCollectionEdit.headerText = `Edit Collection`;
                this.currentCollectionEdit.buttonText = `Save Changes`;
                this.currentCollectionEdit.confirmDelete = confirmDelete;
            } else {
                this.currentCollectionEdit = {
                    name: "",
                    metadata: [],
                    space: "cosine",
                    isNew: true,
                    headerText: "Create Collection",
                    buttonText: "Create Collection",
                    confirmDelete: false
                };
            }
            this.view = 'collectionEdit';
        },

        // collection metadata fields handlers
        metadataKeyGenerator() {
            return 'key_' + Date.now() + Math.random().toString(36).slice(2, 7);
        },

        addMetadata() {
            const newKey = this.metadataKeyGenerator();
            this.currentCollectionEdit.metadata.push({
                id: newKey,
                key: "",
                value: ""
            });
        },
        removeMetadata(id) {
            const index = this.currentCollectionEdit.metadata.findIndex(item => item.id === id);
            if (index !== -1) {
                this.currentCollectionEdit.metadata.splice(index, 1);
            }
        },

        async saveCollectionEdit() {
            const edit = structuredClone(Alpine.raw(this.currentCollectionEdit));
            edit.metadata = Object.fromEntries(edit.metadata
                .filter(item => item.key && item.value)
                .map(item => [item.key, item.value]));
            if (edit.isNew) {
                await client.createCollection(edit.name, { hnsw: { space: edit.space } }, edit.metadata);
            } else {
                await client.updateCollection(this.currentCollection._name, edit.name, edit.metadata);
            }
            this.collections = await client.listCollections();
            const updatedCollection = this.collections.find(c => c._name === edit.name);
            this.currentCollection = updatedCollection;
            await this.openCollection(this.currentCollection);
        },

        async itemsCount(col) {
            const count = await client.countItems(col._name);
            return `${count} items`;
        },

        // document metadata fields handlers
        addMetadataDocument() {
            const newKey = this.metadataKeyGenerator();
            this.currentDocumentEdit.metadata.push({
                id: newKey,
                key: "",
                value: ""
            });            
        },
        removeMetadataDocument(id) {
            const index = this.currentDocumentEdit.metadata.findIndex(item => item.id === id);
            if (index !== -1) {
                /*
                In ChromaDB, the upsert and update operations perform a shallow merge (also known as a "patch" update) 
                rather than a full overwrite. This means that sendindg a new metadata object that is missing a field previously stored in the database, 
                Chroma will keep the old field rather than deleting it.
                Record metadata fields must be explicitly set to null to delete them.
                Alternative solution: delete the whole record and re-add it with the desired fields only.
                */
                this.currentDocumentEdit.metadata[index]['value'] = null;
            }
        },

        async editDocument(doc, confirmDelete = false) {
            const clone = structuredClone(Alpine.raw(doc));
            this.currentDocumentEdit = {};
            if (doc) {
                const documentEmbeddings = await client.embeddings(this.currentCollection._name, clone.id);
                this.currentDocumentEdit.id = clone.id;
                this.currentDocumentEdit.document = clone.document;

                const metadataObject = clone.metadata || {};
                const metadataArray = Object.entries(metadataObject).map(([key, value]) => ({
                    id: this.metadataKeyGenerator(),
                    key: key,
                    value: value
                }));

                this.currentDocumentEdit.metadata = metadataArray.sort((mdi1, mdi2) => mdi1.key.localeCompare(mdi2.key)); // clone.metadata || {};
                this.currentDocumentEdit.isNew = false;
                this.currentDocumentEdit.headerText = `Edit Document`;
                this.currentDocumentEdit.buttonText = `Save Changes`;
                this.currentDocumentEdit.embeddingsText = 'Embeddings (read-only)';
                this.currentDocumentEdit.embeddings = JSON.stringify(documentEmbeddings.embeddings);
                this.currentDocumentEdit.confirmDelete = confirmDelete;
                this.currentDocumentEdit.reference = doc;
            } else {
                this.currentDocumentEdit.id = '';
                this.currentDocumentEdit.document = '';
                this.currentDocumentEdit.metadata = [];
                this.currentDocumentEdit.isNew = true;
                this.currentDocumentEdit.headerText = `Add Document`;
                this.currentDocumentEdit.buttonText = `Add Document`;
                this.currentDocumentEdit.embeddingsText = 'Embeddings (will be generated)';
                this.currentDocumentEdit.embeddings = JSON.stringify([]);
                this.currentDocumentEdit.confirmDelete = false;
                this.currentDocumentEdit.reference = doc;
            }
            this.view = 'documentEdit';
        },

        async saveDocumentEdit() {
            const edit = structuredClone(Alpine.raw(this.currentDocumentEdit));
            edit.metadata = Object.fromEntries(edit.metadata
                .filter(item => item.key) //&& item.value)
                .map(item => [item.key, item.value]));
            await client.upsertItems(this.currentCollection._name, [edit.id], [edit.document], [edit.metadata]);
            await this.openCollection(this.currentCollection);
        },

        async deleteDocument(doc) {
            await client.deleteItems(this.currentCollection._name, [String(doc.id)]);
            await this.openCollection(this.currentCollection);
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

        async showSettings() {
            this.view = 'settings';
        },

        async executeSearch() {
            if (!this.searchQuery.trim()) {
                this.resetSearch();
                return;
            }
            
            this.isSearching = true;
            try {
                const data = await client.searchItems(this.currentCollection._name, this.searchType, this.searchQuery);
                // Map ChromaDb's nested arrays into flat row objects for x-for rendering
                if (data.ids && data.ids[0]) {
                    this.documents = data.ids[0].map((id, index) => ({
                        id: id,
                        document: data.documents[0][index],
                        metadata: data.metadatas[0][index] || {},
                        distance: data.distances ? this.similarityPercentage(data.distances[0][index], this.currentCollection._configuration.hnsw.space) : null
                    }));
                } else {
                    this.documents = [];
                }
            } catch (error) {
                console.error("Search failed:", error);
                this.documents = [];
            }
        },

        async resetSearch(shouldReloadCurrentCollection = true) {
            this.searchQuery = '';
            this.isSearching = false;
            // Load the original collection items again, since the search query is cleared
            if (shouldReloadCurrentCollection) {
                await this.openCollection(this.currentCollection);
            }
        },

        // Calculates similarity percentage based on distance and space type, 
        // with clamping to ensure values between 0% and 100%
        similarityPercentage(distance, spaceType = 'cosine') {
            if (distance === null || distance === undefined) return 'N/A';
            
            let similarity = 0;

            switch (spaceType.toLowerCase()) {
                case 'cosine':
                    // distance: 0 to 2 -> map to 100% down to 0%
                    similarity = (1 - distance) * 100;
                    break;
                    
                case 'l2':
                    // distance: 0 to 4 -> map to 100% down to 0%
                    // dividing distance by 4 scales it to a 0-1 range
                    similarity = (1 - (distance / 4)) * 100;
                    break;
                    
                case 'ip':
                    // ChromaDB IP distance is calculated as (1 - Inner Product)
                    // distance: 0 (IP=1) to 2 (IP=-1) -> map to 100% down to 0%
                    similarity = (1 - distance) * 100;
                    break;
                    
                default:
                    // fallback to cosine similarity mapping
                    similarity = (1 - distance) * 100;
            }

            // Clamp values firmly between 0 and 100 to handle floating-point anomalies
            const finalScore = Math.max(0, Math.min(100, Math.round(similarity)));
            
            return finalScore;
        }
    }
}