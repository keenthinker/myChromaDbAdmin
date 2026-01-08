import express from 'express';
//import helmet from 'helmet';
import ChromaDb from './database/chroma.js';

const app = express();
const port = process.env.PORT || 3000;

// Chroma 
const chroma = new ChromaDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('assets'));
//app.use(helmet());
app.set('view engine', 'ejs');

// Routes
app.get('/', async (req, res) => {
    res.render('index');
});

// Chroma handlers
app.get('/heartbeat', async (req, res) => {
    const heartbeat = await chroma.heartbeat();
    res.json(heartbeat);
});

app.get('/version', async (req, res) => {
    const version = await chroma.version();
    res.json(version);
});

// - collection handlers
app.get('/collections/list', async (req, res) => {
    const collections = await chroma.listCollections();
    res.json(collections);
});

app.post('/collections/add', async (req, res) => {
    const { name, configuration, metadata } = req.body;
    await chroma.createCollection(name, configuration, metadata);
    res.json({ success: true });
});

app.get('/collections/:name/items-count', async (req, res) => {
    const count = await chroma.collectionItemsCount(req.params.name);
    res.json(count);
});

app.get('/collections/:name/exists', async (req, res) => {
    const exists = await chroma.collectionExists(req.params.name);
    res.json(exists);
});

app.post('/collections/:name/items', async (req, res) => {
    const { limit, offset } = req.body;
    const collectionItems = await chroma.listCollectionItems(req.params.name, limit, offset);
    res.json(collectionItems);
});

app.post('/collections/:name/update', async (req, res) => {
    await chroma.updateCollection(req.params.name, req.body.newName, req.body.metadata);
    res.json({ success: true });
});

app.post('/collections/:name/upsert', async (req, res) => {
    const { ids, documents, metadatas } = req.body;
    await chroma.upsertItems(req.params.name, ids, documents, metadatas);
    res.json({ success: true });
});

app.post('/collections/:name/items-delete', async (req, res) => {
    await chroma.deleteItems(req.params.name, req.body.ids);
    res.json({ success: true });
});

app.delete('/collections/:name/delete', async (req, res) => {
    await chroma.deleteCollection(req.params.name);
    res.json({ success: true });
});

app.post('/collections/:name/embeddings/:documentid', async (req, res) => {
    const embeddings = await chroma.getEmbeddings(req.params.name, req.params.documentid);
    res.json(embeddings);
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('error', { error: 'Not Found' });
});

// global error handler
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).render('error', { error: 'Error' });
});

app.listen(port, () => {
    console.log(`myChromaDbAdmin running at http://localhost:${port}`);
});
