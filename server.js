import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('assets'));
app.set('view engine', 'ejs');

// Routes
app.get('/', async (req, res) => {
    res.render('index');
});

app.listen(port, () => {
    console.log(`myChromaDbAdmin running at http://localhost:${port}`);
});
