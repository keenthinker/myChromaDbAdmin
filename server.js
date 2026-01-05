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

app.get('/collections/:name/items-count', async (req, res) => {
    const count = await chroma.collectionItemsCount(req.params.name);
    res.json(count);
});

app.post('/collections/:name/items', async (req, res) => {
    const { limit, offset } = req.body;
    const collectionItems = await chroma.listCollectionItems(req.params.name, limit, offset);
    res.json(collectionItems);
});

app.delete('/collections/:name/delete', async (req, res) => {
    await chroma.deleteCollection(req.params.name);
    res.json({ success: true });
});

// global error handler
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).render('error', { error: 'Error' });
});

app.listen(port, () => {
    console.log(`myChromaDbAdmin running at http://localhost:${port}`);
});
