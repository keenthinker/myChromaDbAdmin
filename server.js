import express from 'express';
import session from 'express-session';
//import helmet from 'helmet';
import ChromaDb from './database/chroma.js';
import pkg from './package.json' with { type: 'json' };
import { readConfig, writeConfig, getSelectedConfiguration } from './configuration/utils.js';
import { User } from './usermanagement/usermanagement.js';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { checkAuthenticated, checkAuthenticatedJson, checkNotAuthenticated } from './auth.js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'url';

const packageVersion = pkg.version;

const app = express();
const port = process.env.PORT || 3350;

app.disable('x-powered-by');
app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../secrets/mychromadbadmin.txt');
dotenv.config({ path: envPath });

const isProduction = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET;

// Chroma 
const chromaConfigurations = await readConfig();
const chromaConfiguration = await getSelectedConfiguration(chromaConfigurations);
const chroma = new ChromaDb(chromaConfiguration.host, chromaConfiguration.port, chromaConfiguration.protocol);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('assets'));
//app.use(helmet());
app.set('view engine', 'ejs');

// --- Session configuration ---
app.use(session({
    name: 'mychromadbadmin',
    secret: sessionSecret, // use a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction, // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'strict', // lax
        maxAge: 1000 * 60 * 60 * 24 // 1 day

    }
}));

// --- custom flash middleware ---
app.use((req, res, next) => {
    const flashMessages = req.session.flash || [];
    delete req.session.flash;

    res.locals.flash = (flashMessages.length > 0) ? flashMessages : null;

    req.setFlash = (type, message) => {
        const entry = { type, message };

        if (!req.session.flash) {
            req.session.flash = [];
        }
        req.session.flash.push(entry); // if redirecting

        if (!res.locals.flash) {
            res.locals.flash = [];
        }
        res.locals.flash.push(entry); // if rendering immediately
    };

    next();
});

// --- Passport init ---
app.use(passport.initialize());
app.use(passport.session());

// --- Passport local strategy ---
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne(username);

            if (!user || !user.id) {
                // No user found (false = authentication failed)
                return done(null, false, { message: 'Login failed' });
            }

            const isMatch = await User.verifyPassword(user, password);

            if (!isMatch) {
                return done(null, false, { message: 'Login failed' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// session serialization
passport.serializeUser((user, done) => done(null, user.id));

// session deserialization
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    if (user) {
        done(null, user); // req.user will be set to this user object
    } else {
        done(new Error('Login failed'));
    }
});

// Routes
app.get('/', async (req, res) => {
    if (req.isAuthenticated()) {
        return res.render('index', { user: req.user });
    } else {
        req.setFlash('type', 'info');
        req.setFlash('message', 'Please sign in first');
        res.redirect('signin');
    }
});

// --- Authentication routes ---
app.get('/signin', checkNotAuthenticated, (req, res) => {
    res.render('signin', { packageVersion: packageVersion });
});

app.post('/signin', (req, res, next) => {
    //console.log(JSON.stringify(req.body, null, 2));
    // User.create(req.body.username, req.body.password).then(() => {
    //     req.setFlash('type', 'info');
    //     req.setFlash('message', 'User created, you can now log in');
    //     req.setFlash('username', req.body.username);
    //     return res.redirect('/signin');
    // });
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            req.setFlash('type', 'info');
            req.setFlash('message', info.message || 'Login failed');
            req.setFlash('username', req.body.username);
            return res.redirect('/signin');
        }

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect('/');
        });
    })(req, res, next);
});

app.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

// Chroma handlers
app.get('/heartbeat', checkAuthenticatedJson, async (req, res) => {
    const heartbeat = await chroma.heartbeat();
    res.json(heartbeat);
});

app.get('/version', checkAuthenticatedJson, async (req, res) => {
    const version = await chroma.version();
    res.json(version);
});

app.get('/package-version', async (req, res) => {
    res.json(packageVersion);
});

// - collection handlers
app.get('/collections/list', checkAuthenticatedJson, async (req, res) => {
    const collections = await chroma.listCollections();
    res.json(collections);
});

app.get('/collections/all-documents-count', checkAuthenticatedJson, async (req, res) => {
    const allDocumentsCount = await chroma.allDocumentsCount(0, 0);
    res.json(allDocumentsCount);
});

app.post('/collections/add', checkAuthenticatedJson, async (req, res) => {
    const { name, configuration, metadata } = req.body;
    await chroma.createCollection(name, configuration, metadata);
    res.json({ success: true });
});

app.get('/collections/:name/items-count', checkAuthenticatedJson, async (req, res) => {
    const count = await chroma.collectionItemsCount(req.params.name);
    res.json(count);
});

app.get('/collections/:name/exists', checkAuthenticatedJson, async (req, res) => {
    const exists = await chroma.collectionExists(req.params.name);
    res.json(exists);
});

app.post('/collections/:name/items', checkAuthenticatedJson, async (req, res) => {
    const { limit, offset } = req.body;
    const collectionItems = await chroma.listCollectionItems(req.params.name, limit, offset);
    res.json(collectionItems);
});

app.post('/collections/:name/update', checkAuthenticatedJson, async (req, res) => {
    await chroma.updateCollection(req.params.name, req.body.newName, req.body.metadata);
    res.json({ success: true });
});

app.post('/collections/:name/upsert', checkAuthenticatedJson, async (req, res) => {
    const { ids, documents, metadatas } = req.body;
    await chroma.upsertItems(req.params.name, ids, documents, metadatas);
    res.json({ success: true });
});

app.post('/collections/:name/items-search', checkAuthenticatedJson, async (req, res) => {
    const { searchType, searchText, limit } = req.body;
    const searchResults = await chroma.collectionItemsSearch(req.params.name, searchType, searchText, limit);
    res.json(searchResults);
});

app.post('/collections/:name/items-delete', checkAuthenticatedJson, async (req, res) => {
    await chroma.deleteItems(req.params.name, req.body.ids);
    res.json({ success: true });
});

app.delete('/collections/:name/delete', checkAuthenticatedJson, async (req, res) => {
    await chroma.deleteCollection(req.params.name);
    res.json({ success: true });
});

app.post('/collections/:name/embeddings/:documentid', checkAuthenticatedJson, async (req, res) => {
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
    res.status(500).json({ error: 'Error' });
});

app.listen(port, "127.0.0.1", () => {
    console.log(`myChromaDbAdmin running at http://localhost:${port}`);
});
