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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET;

const dbPath = path.join(__dirname, "../data/lightMinistry.db");

let db;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

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

/* ================= DATABASE ================= */
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
    `);
}

/* ================= AUTH ================= */
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "lightAdmin") {
        const token = jwt.sign({ user: "admin" }, JWT_SECRET, {
            expiresIn: "2h"
        });

        return res.json({ success: true, token });
    }

    return res.status(401).json({ success: false });
});

/* ================= AUTH MIDDLEWARE ================= */
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

    res.json({ success: true, id: result.lastID });
});

app.get("/api/hero-slides", async (req, res) => {
    res.json(await db.all("SELECT * FROM hero_slides ORDER BY id DESC"));
});

app.delete("/api/hero-slides/:id", auth, async (req, res) => {
    await db.run("DELETE FROM hero_slides WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= STAFF ================= */
app.post("/api/staff-members", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "staff");

    const result = await db.run(
        "INSERT INTO staff_members (name, position, imageUrl) VALUES (?,?,?)",
        [req.body.name, req.body.position, imageUrl]
    );

    res.json({ success: true, id: result.lastID });
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await db.all("SELECT * FROM staff_members"));
});

app.delete("/api/staff-members/:id", auth, async (req, res) => {
    await db.run("DELETE FROM staff_members WHERE id=?", [req.params.id]);
    res.json({ success: true });
});

/* ================= BACKGROUND ================= */
app.post("/api/background-images", auth, upload.single("image"), async (req, res) => {
    const url = await safeUpload(req.file, "background");

    const result = await db.run(
        "INSERT INTO background_images (url) VALUES (?)",
        [url]
    );

    res.json({ success: true, id: result.lastID });
});

app.get("/api/background-images", async (req, res) => {
    res.json(await db.all("SELECT * FROM background_images"));
});

/* ================= START ================= */
app.get("/", (req, res) => {
    res.send("CMS API Running 🚀");
});

async function start() {
    await initDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server running on " + PORT));
}

start();
