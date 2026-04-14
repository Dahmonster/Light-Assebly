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

/* ================= ROOT FIX (Render) ================= */
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

/* ================= DB INIT ================= */
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
    `);
}

/* ================= AUTH ================= */
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "lightAdmin") {
        const token = jwt.sign({ user: "admin" }, JWT_SECRET, { expiresIn: "2h" });
        return res.json({ success: true, token });
    }

    res.status(401).json({ success: false, message: "Invalid login" });
});

function auth(req, res, next) {
    const header = req.headers.authorization;

    if (!header) return res.status(403).json({ message: "No token" });

    try {
        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(403).json({ message: "Invalid token" });
    }
}

/* ================= HERO ================= */
app.post("/api/hero-slides", auth, upload.single("image"), async (req, res) => {
    try {
        const imageUrl = await safeUpload(req.file, "hero");

        const result = await db.run(
            "INSERT INTO hero_slides (imageUrl, caption) VALUES (?,?)",
            [imageUrl, req.body.caption || ""]
        );

        res.json({ success: true, id: result.lastID });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed" });
    }
});

app.get("/api/hero-slides", async (req, res) => {
    res.json(await db.all("SELECT * FROM hero_slides ORDER BY id DESC"));
});

app.put("/api/hero-slides/:id", auth, async (req, res) => {
    await db.run(
        "UPDATE hero_slides SET caption=? WHERE id=?",
        [req.body.caption, req.params.id]
    );
    res.json({ success: true });
});

app.delete("/api/hero-slides/:id", auth, async (req, res) => {
    await db.run("DELETE FROM hero_slides WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= STAFF ================= */
app.post("/api/staff-members", auth, upload.single("image"), async (req, res) => {
    try {
        const imageUrl = await safeUpload(req.file, "staff");

        const result = await db.run(
            "INSERT INTO staff_members (name, position, imageUrl) VALUES (?,?,?)",
            [req.body.name, req.body.position, imageUrl]
        );

        res.json({ success: true, id: result.lastID });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed" });
    }
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await db.all("SELECT * FROM staff_members"));
});

app.put("/api/staff-members/:id", auth, async (req, res) => {
    await db.run(
        "UPDATE staff_members SET name=?, position=? WHERE id=?",
        [req.body.name, req.body.position, req.params.id]
    );
    res.json({ success: true });
});

app.delete("/api/staff-members/:id", auth, async (req, res) => {
    await db.run("DELETE FROM staff_members WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= BACKGROUND ================= */
app.post("/api/background-images", auth, upload.single("image"), async (req, res) => {
    try {
        const url = await safeUpload(req.file, "background");

        const result = await db.run(
            "INSERT INTO background_images (url) VALUES (?)",
            [url]
        );

        res.json({ success: true, id: result.lastID });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed" });
    }
});

app.get("/api/background-images", async (req, res) => {
    res.json(await db.all("SELECT * FROM background_images"));
});

app.delete("/api/background-images/:id", auth, async (req, res) => {
    await db.run("DELETE FROM background_images WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= GALLERY ================= */
app.post("/api/gallery-items", auth, upload.single("image"), async (req, res) => {
    try {
        const url =
            req.body.type === "video"
                ? req.body.url
                : await safeUpload(req.file, "gallery");

        const result = await db.run(
            "INSERT INTO gallery_items (type, url, caption) VALUES (?,?,?)",
            [req.body.type, url, req.body.caption || ""]
        );

        res.json({ success: true, id: result.lastID });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload failed" });
    }
});

app.get("/api/gallery-items", async (req, res) => {
    res.json(await db.all("SELECT * FROM gallery_items"));
});

app.put("/api/gallery-items/:id", auth, async (req, res) => {
    await db.run(
        "UPDATE gallery_items SET caption=? WHERE id=?",
        [req.body.caption, req.params.id]
    );
    res.json({ success: true });
});

app.delete("/api/gallery-items/:id", auth, async (req, res) => {
    await db.run("DELETE FROM gallery_items WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= EVENTS ================= */
app.post("/api/events", auth, async (req, res) => {
    const result = await db.run(
        "INSERT INTO events (title, description, eventDate) VALUES (?,?,?)",
        [req.body.title, req.body.description, req.body.eventDate]
    );

    res.json({ success: true, id: result.lastID });
});

app.get("/api/events", async (req, res) => {
    res.json(await db.all("SELECT * FROM events ORDER BY id DESC"));
});

app.put("/api/events/:id", auth, async (req, res) => {
    await db.run(
        "UPDATE events SET title=?, description=? WHERE id=?",
        [req.body.title, req.body.description, req.params.id]
    );
    res.json({ success: true });
});

app.delete("/api/events/:id", auth, async (req, res) => {
    await db.run("DELETE FROM events WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= START ================= */
async function start() {
    await initDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server running on " + PORT));
}

start();
