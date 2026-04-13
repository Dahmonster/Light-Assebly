import multer from "multer";
import cloudinary from "./cloudinary.js";
import fs from "fs";
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../data/lightMinistry.db");
const app = express();

let db;

/* =========================
   CLOUDINARY HELPER
========================= */
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

/* =========================
   MULTER (SINGLE INSTANCE)
========================= */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

/* =========================
   DB INIT
========================= */
async function initDatabase() {
    db = await open({
        filename: dbPath,
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
            title TEXT NOT NULL,
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

/* =========================
   SEED DATA
========================= */
async function seedData() {
    const count = await db.get('SELECT COUNT(*) as cnt FROM hero_slides');

    if (count.cnt === 0) {
        await db.run(`INSERT INTO hero_slides (imageUrl, caption, orderIndex)
        VALUES (?, ?, ?)`,
        ["https://i.ibb.co/sample1.jpg", "Welcome", 0]);

        await db.run(`INSERT INTO hero_slides (imageUrl, caption, orderIndex)
        VALUES (?, ?, ?)`,
        ["https://i.ibb.co/sample2.jpg", "Worship", 1]);
    }
}

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

/* =========================
   BASIC ROUTES
========================= */
app.get("/", (req, res) => {
    res.send("Server running");
});

/* =========================
   AUTH (SIMPLE)
========================= */
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "lightAdmin") {
        res.json({ message: "Logged in" });
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
});

/* =========================
   HERO SLIDES
========================= */
app.get("/api/hero-slides", async (req, res) => {
    const data = await db.all("SELECT * FROM hero_slides ORDER BY orderIndex");
    res.json(data);
});

app.post("/api/hero-slides", async (req, res) => {
    const { imageUrl, caption, orderIndex } = req.body;

    const result = await db.run(
        "INSERT INTO hero_slides (imageUrl, caption, orderIndex) VALUES (?, ?, ?)",
        [imageUrl, caption, orderIndex || 0]
    );

    res.json({ id: result.lastID });
});

/* =========================
   CLOUDINARY UPLOAD - HERO
========================= */
app.post("/api/uploads/hero-slides", upload.single("image"), async (req, res) => {
    try {
        const { caption, orderIndex } = req.body;

        const result = await uploadToCloudinary(req.file.buffer, "light-ministry/hero");

        const dbResult = await db.run(
            "INSERT INTO hero_slides (imageUrl, caption, orderIndex) VALUES (?, ?, ?)",
            [result.secure_url, caption || "", Number(orderIndex) || 0]
        );

        res.json({
            id: dbResult.lastID,
            imageUrl: result.secure_url
        });

    } catch (err) {
        res.status(500).json({ message: "Upload failed" });
    }
});

/* =========================
   CLOUDINARY UPLOAD - BACKGROUND
========================= */
app.post("/api/uploads/background", upload.single("image"), async (req, res) => {
    try {
        const result = await uploadToCloudinary(req.file.buffer, "light-ministry/background");

        const dbResult = await db.run(
            "INSERT INTO background_images (url) VALUES (?)",
            [result.secure_url]
        );

        res.json({ id: dbResult.lastID, url: result.secure_url });

    } catch (err) {
        res.status(500).json({ message: "Upload failed" });
    }
});

/* =========================
   CLOUDINARY UPLOAD - STAFF
========================= */
app.post("/api/uploads/staff", upload.single("image"), async (req, res) => {
    try {
        const { name, position, orderIndex } = req.body;

        const result = await uploadToCloudinary(req.file.buffer, "light-ministry/staff");

        const dbResult = await db.run(
            "INSERT INTO staff_members (name, position, imageUrl, orderIndex) VALUES (?, ?, ?, ?)",
            [name, position, result.secure_url, Number(orderIndex) || 0]
        );

        res.json({ id: dbResult.lastID });

    } catch (err) {
        res.status(500).json({ message: "Upload failed" });
    }
});

/* =========================
   CLOUDINARY UPLOAD - DIRECTOR
========================= */
app.post("/api/uploads/director", upload.single("image"), async (req, res) => {
    try {
        const { title, message } = req.body;

        const result = await uploadToCloudinary(req.file.buffer, "light-ministry/director");

        const existing = await db.get("SELECT id FROM director_message LIMIT 1");

        if (existing) {
            await db.run(
                "UPDATE director_message SET title=?, message=?, imageUrl=? WHERE id=?",
                [title, message, result.secure_url, existing.id]
            );
        } else {
            await db.run(
                "INSERT INTO director_message (title, message, imageUrl) VALUES (?, ?, ?)",
                [title, message, result.secure_url]
            );
        }

        res.json({ imageUrl: result.secure_url });

    } catch (err) {
        res.status(500).json({ message: "Upload failed" });
    }
});

/* =========================
   CLOUDINARY UPLOAD - NEWS
========================= */
app.post("/api/uploads/news", upload.single("image"), async (req, res) => {
    try {
        const result = await uploadToCloudinary(req.file.buffer, "light-ministry/news");
        res.json({ imageUrl: result.secure_url });
    } catch (err) {
        res.status(500).json({ message: "Upload failed" });
    }
});

/* =========================
   CLOUDINARY UPLOAD - GALLERY
========================= */
app.post("/api/uploads/gallery", upload.single("file"), async (req, res) => {
    try {
        const { type, caption } = req.body;

        const result = await uploadToCloudinary(req.file.buffer, "light-ministry/gallery");

        const dbResult = await db.run(
            "INSERT INTO gallery_items (type, url, caption) VALUES (?, ?, ?)",
            [type, result.secure_url, caption || ""]
        );

        res.json({ id: dbResult.lastID });

    } catch (err) {
        res.status(500).json({ message: "Upload failed" });
    }
});

/* =========================
   START SERVER
========================= */
async function startServer() {
    const dbExists = fs.existsSync(dbPath);

    await initDatabase();

    if (!dbExists) await seedData();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
