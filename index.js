import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let notes = [
    { id: 1, category: 'Podcasts', title: 'Podcast Title 1', author: 'Author 1', rating: 4, content: 'This is a sample note' },
];

async function fetchNoteById(noteId) {
  try {
    const result = await db.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    return result.rows[0];
  } catch (error) {
    console.error(error);
  }
}

app.get('/', async (req, res) => {
    try {
      const podcastResult = await db.query("SELECT * FROM notes WHERE category = 'Podcast' ORDER BY date_created DESC");
      const podcastNotes = podcastResult.rows;

      const otherResult = await db.query("SELECT * FROM notes WHERE category != 'Podcast' ORDER BY date_created DESC");
      const otherNotes = otherResult.rows;

        res.render('index.ejs', {
          podcastNotes: podcastNotes,
          otherNotes: otherNotes,
        });
    } catch (error) {
        console.error(error);
    }
});

app.get('/detail/:id', async (req, res) => {
  const noteId = req.params.id;
  try {
    const note = await fetchNoteById(noteId);
    res.render('detail.ejs', { note: note });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching note details');
  }
});


app.get('/new', (req, res) => {
  res.render('new.ejs');
});

app.post("/new", async (req, res) => {
  const note = {
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    category: req.body.category,
    date_created: req.body.date_created,
    rating: req.body.rating,
  }
  try {
    await db.query("INSERT INTO notes (title, content, author, category, date_created, rating) VALUES ($1, $2, $3, $4, $5, $6);", 
    [note.title, note.content, note.author, note.category, note.date_created, note.rating]);
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving note');
  }
});

  
app.get("/edit/:id", async (req, res) => {
  const noteId = req.params.id;
  try {
    const note = await db.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    res.render('modify.ejs', { note: note.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching note details');
  }
});

app.post("/notes/:id", async (req, res) => {
  const noteId = req.params.id;
  const { title, content, author, category, date_created, rating } = req.body;
  try {
    await db.query(
      'UPDATE notes SET title = $1, content = $2, author = $3, category = $4, date_created = $5, rating = $6 WHERE id = $7',
      [title, content, author, category, date_created, rating, noteId]
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating note');
  }
});


app.get("/delete/:id", async (req, res) => {
  const noteId = req.params.id;
  try {
    await db.query('DELETE FROM notes WHERE id = $1', [noteId]);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting note');
  }
});

  
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
