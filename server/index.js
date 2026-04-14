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
// CLOUDINARY
// =====================
function uploadToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        stream.end(buffer);
    });
}

async function safeUpload(file, folder) {
    if (!file) return null;
    const res = await uploadToCloudinary(file.buffer, folder);
    return res.secure_url;
}

// =====================
// DB INIT
// =====================
async function initDatabase() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS hero_slides (
            id INTEGER PRIMARY KEY,
            imageUrl TEXT,
            caption TEXT,
            orderIndex INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS staff_members (
            id INTEGER PRIMARY KEY,
            name TEXT,
            position TEXT,
            imageUrl TEXT
        );

        CREATE TABLE IF NOT EXISTS background_images (
            id INTEGER PRIMARY KEY,
            url TEXT
        );

        CREATE TABLE IF NOT EXISTS gallery_items (
            id INTEGER PRIMARY KEY,
            type TEXT,
            url TEXT,
            caption TEXT
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
        return res.json({ success: true, user: username });
    }

    res.status(401).json({ success: false, message: "Invalid credentials" });
});

// =====================
// HERO
// =====================
app.post("/api/hero-slides", upload.single("image"), async (req, res) => {
    const { caption } = req.body;
    const imageUrl = await safeUpload(req.file, "hero");

    const result = await db.run(
        "INSERT INTO hero_slides (imageUrl, caption) VALUES (?, ?)",
        [imageUrl, caption]
    );

    res.json({ id: result.lastID });
});

app.get("/api/hero-slides", async (req, res) => {
    res.json(await db.all("SELECT * FROM hero_slides"));
});

app.put("/api/hero-slides/:id", async (req, res) => {
    const { caption } = req.body;
    await db.run("UPDATE hero_slides SET caption=? WHERE id=?", [caption, req.params.id]);
    res.json({ success: true });
});

app.delete("/api/hero-slides/:id", async (req, res) => {
    await db.run("DELETE FROM hero_slides WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// STAFF
// =====================
app.post("/api/staff-members", upload.single("image"), async (req, res) => {
    const { name, position } = req.body;
    const imageUrl = await safeUpload(req.file, "staff");

    const result = await db.run(
        "INSERT INTO staff_members (name, position, imageUrl) VALUES (?, ?, ?)",
        [name, position, imageUrl]
    );

    res.json({ id: result.lastID });
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await db.all("SELECT * FROM staff_members"));
});

app.put("/api/staff-members/:id", async (req, res) => {
    const { name, position } = req.body;
    await db.run(
        "UPDATE staff_members SET name=?, position=? WHERE id=?",
        [name, position, req.params.id]
    );
    res.json({ success: true });
});

app.delete("/api/staff-members/:id", async (req, res) => {
    await db.run("DELETE FROM staff_members WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// BACKGROUND
// =====================
app.post("/api/background-images", upload.single("image"), async (req, res) => {
    const url = await safeUpload(req.file, "background");

    const result = await db.run(
        "INSERT INTO background_images (url) VALUES (?)",
        [url]
    );

    res.json({ id: result.lastID });
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
    const { type, caption, videoUrl } = req.body;

    let url = type === "image"
        ? await safeUpload(req.file, "gallery")
        : videoUrl;

    const result = await db.run(
        "INSERT INTO gallery_items (type, url, caption) VALUES (?, ?, ?)",
        [type, url, caption]
    );

    res.json({ id: result.lastID });
});

app.get("/api/gallery-items", async (req, res) => {
    res.json(await db.all("SELECT * FROM gallery_items"));
});

app.put("/api/gallery-items/:id", async (req, res) => {
    const { caption } = req.body;
    await db.run("UPDATE gallery_items SET caption=? WHERE id=?", [caption, req.params.id]);
    res.json({ success: true });
});

app.delete("/api/gallery-items/:id", async (req, res) => {
    await db.run("DELETE FROM gallery_items WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// NEWS
// =====================
app.post("/api/news-posts", upload.single("image"), async (req, res) => {
    const { title, slug, previewText, content } = req.body;
    const featuredImage = await safeUpload(req.file, "news");

    const result = await db.run(
        "INSERT INTO news_posts (title, slug, previewText, content, featuredImage) VALUES (?, ?, ?, ?, ?)",
        [title, slug, previewText, content, featuredImage]
    );

    res.json({ id: result.lastID });
});

app.get("/api/news-posts", async (req, res) => {
    res.json(await db.all("SELECT * FROM news_posts ORDER BY createdAt DESC"));
});

// =====================
// EVENTS
// =====================
app.post("/api/events", upload.single("image"), async (req, res) => {
    const { title, description, eventDate } = req.body;
    const imageUrl = await safeUpload(req.file, "events");

    const result = await db.run(
        "INSERT INTO events (title, description, eventDate, imageUrl) VALUES (?, ?, ?, ?)",
        [title, description, eventDate, imageUrl]
    );

    res.json({ id: result.lastID });
});

app.get("/api/events", async (req, res) => {
    const data = await db.all("SELECT * FROM events");
    data.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    res.json(data);
});

app.delete("/api/events/:id", async (req, res) => {
    await db.run("DELETE FROM events WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

// =====================
// MESSAGES
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
async function start() {
    await initDatabase();
    app.listen(5000, () => console.log("Server running on 5000"));
}

start();
