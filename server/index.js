import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import cloudinary from "./cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dbPath = path.join(__dirname, "../data/lightMinistry.db");

let db;

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const upload = multer({ storage: multer.memoryStorage() });

// =====================
// CLOUDINARY HELPERS
// =====================
function uploadToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

async function safeUpload(file, folder) {
    if (!file) return null;
    const result = await uploadToCloudinary(file.buffer, folder);
    return result.secure_url;
}

// =====================
// INIT DB
// =====================
async function initDatabase() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS background_images (
            id INTEGER PRIMARY KEY,
            url TEXT
        );

        CREATE TABLE IF NOT EXISTS hero_slides (
            id INTEGER PRIMARY KEY,
            imageUrl TEXT,
            caption TEXT,
            orderIndex INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS director_message (
            id INTEGER PRIMARY KEY,
            title TEXT,
            message TEXT,
            imageUrl TEXT
        );

        CREATE TABLE IF NOT EXISTS staff_members (
            id INTEGER PRIMARY KEY,
            name TEXT,
            position TEXT,
            imageUrl TEXT
        );

        CREATE TABLE IF NOT EXISTS news_posts (
            id INTEGER PRIMARY KEY,
            title TEXT,
            slug TEXT,
            previewText TEXT,
            content TEXT,
            featuredImage TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            title TEXT,
            description TEXT,
            eventDate TEXT,
            imageUrl TEXT,
            isUpcoming INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS gallery_items (
            id INTEGER PRIMARY KEY,
            type TEXT,
            url TEXT,
            caption TEXT
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT,
            subject TEXT,
            message TEXT,
            isRead INTEGER DEFAULT 0
        );
    `);
}


// =====================
// AUTH
// =====================
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "lightAdmin") {
        return res.json({
            success: true,
            user: username
        });
    }

    res.status(401).json({
        success: false,
        message: "Invalid credentials"
    });
});
// =====================
// HERO SLIDES
// =====================
app.post("/api/hero-slides", upload.single("image"), async (req, res) => {
    try {
        const { caption, orderIndex } = req.body;

        const imageUrl = await safeUpload(req.file, "light-ministry/hero");

        const result = await db.run(
            "INSERT INTO hero_slides (imageUrl, caption, orderIndex) VALUES (?, ?, ?)",
            [imageUrl, caption || "", Number(orderIndex) || 0]
        );

        res.json({ id: result.lastID, imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/hero-slides", async (req, res) => {
    res.json(await db.all("SELECT * FROM hero_slides ORDER BY orderIndex"));
});

app.delete("/api/hero-slides/:id", async (req, res) => {
    await db.run("DELETE FROM hero_slides WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// STAFF
// =====================
app.post("/api/staff-members", upload.single("image"), async (req, res) => {
    try {
        const { name, position } = req.body;

        const imageUrl = await safeUpload(req.file, "light-ministry/staff");

        const result = await db.run(
            "INSERT INTO staff_members (name, position, imageUrl) VALUES (?, ?, ?)",
            [name, position, imageUrl]
        );

        res.json({ id: result.lastID, imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await db.all("SELECT * FROM staff_members"));
});

app.delete("/api/staff-members/:id", async (req, res) => {
    await db.run("DELETE FROM staff_members WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// BACKGROUND
// =====================
app.post("/api/background-images", upload.single("image"), async (req, res) => {
    try {
        const url = await safeUpload(req.file, "light-ministry/backgrounds");

        const result = await db.run(
            "INSERT INTO background_images (url) VALUES (?)",
            [url]
        );

        res.json({ id: result.lastID, url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/background-images", async (req, res) => {
    res.json(await db.all("SELECT * FROM background_images"));
});

app.delete("/api/background-images/:id", async (req, res) => {
    await db.run("DELETE FROM background_images WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// GALLERY
// =====================
app.post("/api/gallery-items", upload.single("image"), async (req, res) => {
    try {
        const { type, caption, videoUrl } = req.body;

        let finalUrl = type === "image"
            ? await safeUpload(req.file, "light-ministry/gallery")
            : videoUrl;

        const result = await db.run(
            "INSERT INTO gallery_items (type, url, caption) VALUES (?, ?, ?)",
            [type, finalUrl, caption || ""]
        );

        res.json({ id: result.lastID, url: finalUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/gallery-items", async (req, res) => {
    res.json(await db.all("SELECT * FROM gallery_items"));
});

app.delete("/api/gallery-items/:id", async (req, res) => {
    await db.run("DELETE FROM gallery_items WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// EVENTS (FIXED + SAFE SORT)
// =====================
app.post("/api/events", upload.single("image"), async (req, res) => {
    try {
        const { title, description, eventDate, isUpcoming } = req.body;

        const imageUrl = await safeUpload(req.file, "light-ministry/events");

        const result = await db.run(
            `INSERT INTO events (title, description, eventDate, imageUrl, isUpcoming)
             VALUES (?, ?, ?, ?, ?)`,
            [title, description, eventDate, imageUrl, isUpcoming ? 1 : 0]
        );

        res.json({ id: result.lastID, imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/events", async (req, res) => {
    const events = await db.all("SELECT * FROM events");

    // safer sorting (real date sorting)
    events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    res.json(events);
});

app.delete("/api/events/:id", async (req, res) => {
    await db.run("DELETE FROM events WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// NEWS
// =====================
app.get("/api/news-posts", async (req, res) => {
    res.json(await db.all("SELECT * FROM news_posts ORDER BY createdAt DESC"));
});

// =====================
// CONTACT MESSAGES
// =====================
app.get("/api/contact-messages", async (req, res) => {
    res.json(await db.all("SELECT * FROM contact_messages ORDER BY id DESC"));
});

app.delete("/api/contact-messages/:id", async (req, res) => {
    await db.run("DELETE FROM contact_messages WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

app.patch("/api/contact-messages/:id/read", async (req, res) => {
    await db.run("UPDATE contact_messages SET isRead=1 WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// DIRECTOR MESSAGE
// =====================
app.put("/api/director-message", async (req, res) => {
    const { title, message, imageUrl } = req.body;

    const existing = await db.get("SELECT id FROM director_message LIMIT 1");

    if (existing) {
        await db.run(
            "UPDATE director_message SET title=?, message=?, imageUrl=? WHERE id=?",
            [title, message, imageUrl, existing.id]
        );
    } else {
        await db.run(
            "INSERT INTO director_message (title, message, imageUrl) VALUES (?, ?, ?)",
            [title, message, imageUrl]
        );
    }

    res.json({ success: true });
});

app.get("/api/director-message", async (req, res) => {
    res.json(await db.get("SELECT * FROM director_message LIMIT 1"));
});

// =====================
// START
// =====================
async function start() {
    await initDatabase();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server running on " + PORT));
}

app.get("/", (req, res) => {
    res.send("Light Assembly API is running 🚀");
});

start();
