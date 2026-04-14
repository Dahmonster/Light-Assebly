import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cloudinary from "./cloudinary.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "../data/lightMinistry.db");

let db;

/* ================= MIDDLEWARE ================= */
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
    res.send("API is running...");
});

/* ================= CLOUDINARY ================= */
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

/* ================= DB ================= */
async function initDB() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS hero_slides (
            id INTEGER PRIMARY KEY,
            imageUrl TEXT,
            caption TEXT
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

        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY,
            title TEXT,
            description TEXT,
            eventDate TEXT
        );

        /* NEW */
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY,
            title TEXT,
            slug TEXT,
            preview TEXT,
            content TEXT,
            imageUrl TEXT
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY,
            name TEXT,
            email TEXT,
            message TEXT
        );
    `);
}

/* ================= AUTH ================= */
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "lightAdmin") {
        const token = jwt.sign({ user: "admin" }, JWT_SECRET, { expiresIn: "2h" });
        return res.json({ success: true, token });
    }

    res.status(401).json({ message: "Invalid login" });
});

function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(403).json({ message: "No token" });

    try {
        const token = header.split(" ")[1];
        jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
}

/* ================= HERO ================= */
app.post("/api/hero-slides", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "hero");
    const result = await db.run(
        "INSERT INTO hero_slides (imageUrl, caption) VALUES (?,?)",
        [imageUrl, req.body.caption || ""]
    );
    res.json({ success: true });
});

app.get("/api/hero-slides", async (req, res) => {
    res.json(await db.all("SELECT * FROM hero_slides"));
});

app.delete("/api/hero-slides/:id", auth, async (req, res) => {
    await db.run("DELETE FROM hero_slides WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= STAFF ================= */
app.post("/api/staff-members", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "staff");
    await db.run(
        "INSERT INTO staff_members (name, position, imageUrl) VALUES (?,?,?)",
        [req.body.name, req.body.position, imageUrl]
    );
    res.json({ success: true });
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await db.all("SELECT * FROM staff_members"));
});

/* ================= BACKGROUND ================= */
app.post("/api/background-images", auth, upload.single("image"), async (req, res) => {
    const url = await safeUpload(req.file, "background");
    await db.run("INSERT INTO background_images (url) VALUES (?)", [url]);
    res.json({ success: true });
});

app.get("/api/background-images", async (req, res) => {
    res.json(await db.all("SELECT * FROM background_images"));
});

/* ================= GALLERY ================= */
app.post("/api/gallery-items", auth, upload.single("image"), async (req, res) => {
    const url = req.body.type === "video"
        ? req.body.url
        : await safeUpload(req.file, "gallery");

    await db.run(
        "INSERT INTO gallery_items (type, url, caption) VALUES (?,?,?)",
        [req.body.type, url, req.body.caption]
    );

    res.json({ success: true });
});

app.get("/api/gallery-items", async (req, res) => {
    res.json(await db.all("SELECT * FROM gallery_items"));
});

/* ================= EVENTS ================= */
app.post("/api/events", auth, async (req, res) => {
    await db.run(
        "INSERT INTO events (title, description, eventDate) VALUES (?,?,?)",
        [req.body.title, req.body.description, req.body.eventDate]
    );
    res.json({ success: true });
});

app.get("/api/events", async (req, res) => {
    res.json(await db.all("SELECT * FROM events"));
});

/* ================= NEWS ================= */
app.post("/api/news", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "news");

    await db.run(
        "INSERT INTO news (title, slug, preview, content, imageUrl) VALUES (?,?,?,?,?)",
        [req.body.title, req.body.slug, req.body.preview, req.body.content, imageUrl]
    );

    res.json({ success: true });
});

app.get("/api/news", async (req, res) => {
    res.json(await db.all("SELECT * FROM news"));
});

/* ================= MESSAGES ================= */
app.get("/api/messages", auth, async (req, res) => {
    res.json(await db.all("SELECT * FROM messages"));
});

/* ================= START ================= */
async function start() {
    await initDB();
    app.listen(process.env.PORT || 5000, () =>
        console.log("Server running")
    );
}

start();
