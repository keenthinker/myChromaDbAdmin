class ChromaDbClient {
    constructor() {
    }

    async request(endpoint, options = {}) {
        try {
            //const res = await fetch(`${this.baseUrl}${endpoint}`, {
            const res = await fetch(`${endpoint}`, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers }
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async listCollections() { return this.request('/collections/list', { method: 'GET' }); }
    async getCollection(name) { return this.request(`/collections/${name}`, { method: 'POST' }); }
    async createCollection(name, configuration, metadata) {
        return this.request('/collections/add', { method: 'POST', body: JSON.stringify({ name, configuration, metadata }) });
    }
    async deleteCollection(name) {
        await this.request(`/collections/${name}/delete`, { method: 'DELETE' });
    }
    async updateCollection(id, newName, newMetadata) {
        const body = {};
        if (newName) body.newName = newName;
        if (newMetadata) body.metadata = newMetadata;
        return this.request(`/collections/${id}/update`, { method: 'POST', body: JSON.stringify(body) });
    }
    async countItems(name) { return this.request(`/collections/${name}/items-count`, { method: 'GET' }); }

    async items(name, limit = 10, offset = 0) {
        return this.request(`/collections/${name}/items`, {
            method: 'POST',
            body: JSON.stringify({ limit, offset, include: ['embeddings', 'documents', 'metadatas'] })
        });
    }
    async add(id, ids, documents, metadatas) {
        return this.request(`/collections/${id}/add`, {
            method: 'POST',
            body: JSON.stringify({ ids, documents, metadatas })
        });
    }
    async upsertItems(id, ids, documents, metadatas) {
        return this.request(`/collections/${id}/upsert`, {
            method: 'POST',
            body: JSON.stringify({ ids, documents, metadatas })
        });
    }
    async deleteItems(id, ids) {
        return this.request(`/collection/${id}/delete`, {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    }
    async version() { return this.request('/version', { method: 'GET' }); }
    async heartbeat() { return this.request('/heartbeat', { method: 'GET' }); }
}