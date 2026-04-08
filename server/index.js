import fs from 'fs';
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

let db;

// Initialize Database
async function initDatabase() {
    db = await open({
        filename: './data/lightMinistry.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS background_images (
            id INTEGER PRIMARY KEY,
            url TEXT NOT NULL,
            orderIndex INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS hero_slides (
            id INTEGER PRIMARY KEY,
            imageUrl TEXT NOT NULL,
            caption TEXT,
            orderIndex INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS director_message (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL DEFAULT 'THE DIRECTOR',
            message TEXT NOT NULL,
            imageUrl TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_members (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            position TEXT NOT NULL,
            imageUrl TEXT NOT NULL,
            orderIndex INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS news_posts (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            previewText TEXT NOT NULL,
            content TEXT NOT NULL,
            featuredImage TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            eventDate DATETIME NOT NULL,
            imageUrl TEXT,
            isUpcoming INTEGER DEFAULT 1,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS gallery_items (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL,
            url TEXT NOT NULL,
            caption TEXT,
            orderIndex INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            isRead INTEGER DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS site_settings (
            id INTEGER PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL
        );
    `);
}

// Seed data
function seedData() {
    const count = await db.get('SELECT COUNT(*) as cnt FROM hero_slides');
    
    if (count.cnt === 0) {
        await db.run(`INSERT INTO hero_slides (imageUrl, caption, orderIndex)
            VALUES (?, ?, ?)`, ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070', 'Welcome to Light Evangelist Ministry', 0]);
        await db.run(`INSERT INTO hero_slides (imageUrl, caption, orderIndex)
            VALUES (?, ?, ?)`, ['https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2132', 'Empowering the Next Generation', 1]);
        
        await db.run(`INSERT INTO director_message (title, message, imageUrl)
            VALUES (?, ?, ?)`, ['THE DIRECTOR', 'Welcome to our school. We are committed to academic excellence and moral uprightness.', 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?q=80&w=2069']);
        
        await db.run(`INSERT INTO staff_members (name, position, imageUrl, orderIndex)
            VALUES (?, ?, ?, ?)`, ['John Doe', 'Principal', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974', 0]);
        await db.run(`INSERT INTO staff_members (name, position, imageUrl, orderIndex)
            VALUES (?, ?, ?, ?)`, ['Jane Smith', 'Vice Principal', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976', 1]);
        
        await db.run(`INSERT INTO news_posts (title, slug, previewText, content, featuredImage)
            VALUES (?, ?, ?, ?, ?)`, ['Resumption Date Announced', 'resumption-date', 'School resumes on the 10th of next month.', '<p>School resumes on the 10th of next month. All students are expected to be present.</p>', 'https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2072']);
        
        await db.run(`INSERT INTO background_images (url, orderIndex)
            VALUES (?, ?)`, ['https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071', 0]);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Routes
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'lightAdmin') {
        res.json({ message: 'Logged in' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', (req, res) => {
    res.json({ username: 'admin' });
});

// Background Images
app.get('/api/background-images', async (req, res) => {
    const items = await db.all('SELECT * FROM background_images ORDER BY orderIndex');
    res.json(items);
});

app.post('/api/background-images', async (req, res) => {
    const { url, orderIndex } = req.body;
    const result = await db.run('INSERT INTO background_images (url, orderIndex) VALUES (?, ?)', [url, orderIndex || 0]);
    res.status(201).json({ id: result.lastID, url, orderIndex });
});

app.put('/api/background-images/:id', async (req, res) => {
    const { url, orderIndex } = req.body;
    await db.run('UPDATE background_images SET url = ?, orderIndex = ? WHERE id = ?', [url, orderIndex, req.params.id]);
    res.json({ id: req.params.id, url, orderIndex });
});

app.delete('/api/background-images/:id', async (req, res) => {
    await db.run('DELETE FROM background_images WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Hero Slides
app.get('/api/hero-slides', async (req, res) => {
    const items = await db.all('SELECT * FROM hero_slides ORDER BY orderIndex');
    res.json(items);
});

app.post('/api/hero-slides', async (req, res) => {
    const { imageUrl, caption, orderIndex } = req.body;
    const result = await db.run('INSERT INTO hero_slides (imageUrl, caption, orderIndex) VALUES (?, ?, ?)', [imageUrl, caption, orderIndex || 0]);
    res.status(201).json({ id: result.lastID, imageUrl, caption, orderIndex });
});

app.put('/api/hero-slides/:id', async (req, res) => {
    const { imageUrl, caption, orderIndex } = req.body;
    await db.run('UPDATE hero_slides SET imageUrl = ?, caption = ?, orderIndex = ? WHERE id = ?', [imageUrl, caption, orderIndex, req.params.id]);
    res.json({ id: req.params.id, imageUrl, caption, orderIndex });
});

app.delete('/api/hero-slides/:id', async (req, res) => {
    await db.run('DELETE FROM hero_slides WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Director Message
app.get('/api/director-message', async (req, res) => {
    const msg = await db.get('SELECT * FROM director_message LIMIT 1');
    res.json(msg || null);
});

app.put('/api/director-message', async (req, res) => {
    const { title, message, imageUrl } = req.body;
    const existing = await db.get('SELECT id FROM director_message LIMIT 1');
    
    if (existing) {
        await db.run('UPDATE director_message SET title = ?, message = ?, imageUrl = ? WHERE id = ?', [title, message, imageUrl, existing.id]);
        res.json({ id: existing.id, title, message, imageUrl });
    } else {
        const result = await db.run('INSERT INTO director_message (title, message, imageUrl) VALUES (?, ?, ?)', [title, message, imageUrl]);
        res.status(201).json({ id: result.lastID, title, message, imageUrl });
    }
});

// Staff Members
app.get('/api/staff-members', async (req, res) => {
    const items = await db.all('SELECT * FROM staff_members ORDER BY orderIndex');
    res.json(items);
});

app.post('/api/staff-members', async (req, res) => {
    const { name, position, imageUrl, orderIndex } = req.body;
    const result = await db.run('INSERT INTO staff_members (name, position, imageUrl, orderIndex) VALUES (?, ?, ?, ?)', [name, position, imageUrl, orderIndex || 0]);
    res.status(201).json({ id: result.lastID, name, position, imageUrl, orderIndex });
});

app.put('/api/staff-members/:id', async (req, res) => {
    const { name, position, imageUrl, orderIndex } = req.body;
    await db.run('UPDATE staff_members SET name = ?, position = ?, imageUrl = ?, orderIndex = ? WHERE id = ?', [name, position, imageUrl, orderIndex, req.params.id]);
    res.json({ id: req.params.id, name, position, imageUrl, orderIndex });
});

app.delete('/api/staff-members/:id', async (req, res) => {
    await db.run('DELETE FROM staff_members WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// News Posts
app.get('/api/news-posts', async (req, res) => {
    const items = await db.all('SELECT * FROM news_posts ORDER BY createdAt DESC');
    res.json(items);
});

app.get('/api/news-posts/:slug', async (req, res) => {
    const item = await db.get('SELECT * FROM news_posts WHERE slug = ?', [req.params.slug]);
    if (item) res.json(item);
    else res.status(404).json({ message: 'Not found' });
});

app.post('/api/news-posts', async (req, res) => {
    const { title, slug, previewText, content, featuredImage } = req.body;
    const result = await db.run('INSERT INTO news_posts (title, slug, previewText, content, featuredImage) VALUES (?, ?, ?, ?, ?)', [title, slug, previewText, content, featuredImage]);
    res.status(201).json({ id: result.lastID, title, slug, previewText, content, featuredImage });
});

app.put('/api/news-posts/:id', async (req, res) => {
    const { title, slug, previewText, content, featuredImage } = req.body;
    await db.run('UPDATE news_posts SET title = ?, slug = ?, previewText = ?, content = ?, featuredImage = ? WHERE id = ?', [title, slug, previewText, content, featuredImage, req.params.id]);
    res.json({ id: req.params.id, title, slug, previewText, content, featuredImage });
});

app.delete('/api/news-posts/:id', async (req, res) => {
    await db.run('DELETE FROM news_posts WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Events
app.get('/api/events', async (req, res) => {
    const items = await db.all('SELECT * FROM events ORDER BY eventDate');
    res.json(items);
});

app.post('/api/events', async (req, res) => {
    const { title, description, eventDate, imageUrl, isUpcoming } = req.body;
    const result = await db.run('INSERT INTO events (title, description, eventDate, imageUrl, isUpcoming) VALUES (?, ?, ?, ?, ?)', [title, description, eventDate, imageUrl, isUpcoming || 1]);
    res.status(201).json({ id: result.lastID, title, description, eventDate, imageUrl, isUpcoming });
});

app.put('/api/events/:id', async (req, res) => {
    const { title, description, eventDate, imageUrl, isUpcoming } = req.body;
    await db.run('UPDATE events SET title = ?, description = ?, eventDate = ?, imageUrl = ?, isUpcoming = ? WHERE id = ?', [title, description, eventDate, imageUrl, isUpcoming, req.params.id]);
    res.json({ id: req.params.id, title, description, eventDate, imageUrl, isUpcoming });
});

app.delete('/api/events/:id', async (req, res) => {
    await db.run('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Gallery
app.get('/api/gallery-items', async (req, res) => {
    const items = await db.all('SELECT * FROM gallery_items ORDER BY orderIndex');
    res.json(items);
});

app.post('/api/gallery-items', async (req, res) => {
    const { type, url, caption, orderIndex } = req.body;
    const result = await db.run('INSERT INTO gallery_items (type, url, caption, orderIndex) VALUES (?, ?, ?, ?)', [type, url, caption, orderIndex || 0]);
    res.status(201).json({ id: result.lastID, type, url, caption, orderIndex });
});

app.put('/api/gallery-items/:id', async (req, res) => {
    const { type, url, caption, orderIndex } = req.body;
    await db.run('UPDATE gallery_items SET type = ?, url = ?, caption = ?, orderIndex = ? WHERE id = ?', [type, url, caption, orderIndex, req.params.id]);
    res.json({ id: req.params.id, type, url, caption, orderIndex });
});

app.delete('/api/gallery-items/:id', async (req, res) => {
    await db.run('DELETE FROM gallery_items WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Contact Messages
app.get('/api/contact-messages', async (req, res) => {
    const items = await db.all('SELECT * FROM contact_messages ORDER BY createdAt DESC');
    res.json(items);
});

app.post('/api/contact-messages', async (req, res) => {
    const { name, email, subject, message } = req.body;
    const result = await db.run('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)', [name, email, subject, message]);
    res.status(201).json({ id: result.lastID, name, email, subject, message, isRead: 0 });
});

app.patch('/api/contact-messages/:id/read', async (req, res) => {
    await db.run('UPDATE contact_messages SET isRead = 1 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Marked as read' });
});

app.delete('/api/contact-messages/:id', async (req, res) => {
    await db.run('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    res.status(204).send();
});

// Site Settings
app.get('/api/site-settings', async (req, res) => {
    const items = await db.all('SELECT * FROM site_settings');
    res.json(items);
});

app.put('/api/site-settings/:key', async (req, res) => {
    const { value } = req.body;
    const existing = await db.get('SELECT id FROM site_settings WHERE key = ?', [req.params.key]);
    
    if (existing) {
        await db.run('UPDATE site_settings SET value = ? WHERE key = ?', [value, req.params.key]);
    } else {
        await db.run('INSERT INTO site_settings (key, value) VALUES (?, ?)', [req.params.key, value]);
    }
    res.json({ key: req.params.key, value });
});

// Upload placeholder
app.post('/api/uploads', (req, res) => {
    res.status(201).json({ url: 'https://placehold.co/600x400?text=Uploaded+Image' });
});

// Start server
async function startServer() {
    const dbPath = path.join(__dirname, 'data', 'lightMinistry.db');

    // Only seed if DB file doesn't exist yet
    const dbExists = fs.existsSync(dbPath);

    await initDatabase();

    if (!dbExists) {
        await seedData(); // Only seed default data if database is new
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
