import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import cloudinary from "./cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const dbPath = path.join(__dirname, "../data/lightMinistry.db");

let db;

// =====================
// CLOUDINARY UPLOADER
// =====================
const upload = multer({ storage: multer.memoryStorage() });

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
            featuredImage TEXT
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
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// =====================
// HERO SLIDES (CLOUDINARY)
// =====================
app.post("/api/hero-slides", upload.single("image"), async (req, res) => {
    try {
        const { caption, orderIndex } = req.body;

        const result = await uploadToCloudinary(
            req.file.buffer,
            "light-ministry/hero"
        );

        const dbResult = await db.run(
            "INSERT INTO hero_slides (imageUrl, caption, orderIndex) VALUES (?, ?, ?)",
            [result.secure_url, caption, Number(orderIndex) || 0]
        );

        res.json({
            id: dbResult.lastID,
            imageUrl: result.secure_url
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================
// STAFF (CLOUDINARY)
// =====================
app.post("/api/staff-members", upload.single("image"), async (req, res) => {
    try {
        const { name, position } = req.body;

        const result = await uploadToCloudinary(
            req.file.buffer,
            "light-ministry/staff"
        );

        const dbResult = await db.run(
            "INSERT INTO staff_members (name, position, imageUrl) VALUES (?, ?, ?)",
            [name, position, result.secure_url]
        );

        res.json({
            id: dbResult.lastID,
            imageUrl: result.secure_url
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================
// BACKGROUND (CLOUDINARY)
// =====================
app.post("/api/background-images", upload.single("image"), async (req, res) => {
    try {
        const result = await uploadToCloudinary(
            req.file.buffer,
            "light-ministry/backgrounds"
        );

        const dbResult = await db.run(
            "INSERT INTO background_images (url) VALUES (?)",
            [result.secure_url]
        );

        res.json({
            id: dbResult.lastID,
            url: result.secure_url
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================
// GALLERY (CLOUDINARY)
// =====================
app.post("/api/gallery-items", upload.single("image"), async (req, res) => {
    try {
        const { type, caption, videoUrl } = req.body;

        let finalUrl = "";

        if (type === "image") {
            const result = await uploadToCloudinary(
                req.file.buffer,
                "light-ministry/gallery"
            );
            finalUrl = result.secure_url;
        } else {
            finalUrl = videoUrl;
        }

        const dbResult = await db.run(
            "INSERT INTO gallery_items (type, url, caption) VALUES (?, ?, ?)",
            [type, finalUrl, caption]
        );

        res.json({
            id: dbResult.lastID,
            url: finalUrl
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =====================
// DIRECTOR MESSAGE (NO FILE UPLOAD OPTIONAL)
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

// =====================
// ALL READ ROUTES (UNCHANGED)
// =====================
app.get("/api/hero-slides", async (req, res) => {
    res.json(await db.all("SELECT * FROM hero_slides ORDER BY orderIndex"));
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await db.all("SELECT * FROM staff_members"));
});

app.get("/api/background-images", async (req, res) => {
    res.json(await db.all("SELECT * FROM background_images"));
});

app.get("/api/gallery-items", async (req, res) => {
    res.json(await db.all("SELECT * FROM gallery_items"));
});

app.get("/api/director-message", async (req, res) => {
    res.json(await db.get("SELECT * FROM director_message LIMIT 1"));
});

// =====================
// START SERVER
// =====================
async function start() {
    await initDatabase();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server running on " + PORT));
}

start();
