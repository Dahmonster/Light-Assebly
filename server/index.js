import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cloudinary from "./cloudinary.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API is running...");
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


/* ================= MONGODB ================= */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

/* ================= SCHEMAS ================= */
const Hero = mongoose.model("Hero", {
    imageUrl: String,
    caption: String
});

const Staff = mongoose.model("Staff", {
    name: String,
    position: String,
    imageUrl: String
});

const Background = mongoose.model("Background", {
    url: String
});

const Gallery = mongoose.model("Gallery", {
    type: String,
    url: String,
    caption: String
});

const Event = mongoose.model("Event", {
    title: String,
    description: String,
    eventDate: String,
    imageUrl: String   // ✅ NEW
});

const News = mongoose.model("News", {
    title: String,
    slug: String,
    preview: String,
    content: String,
    imageUrl: String
});

const Message = mongoose.model("Message", {
    name: String,
    email: String,
    subject: String,
    message: String
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

app.post("/api/background-images", auth, upload.single("image"), async (req, res) => {
    try {
        const url = await safeUpload(req.file, "background");
        await Background.create({ url });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: "Background upload failed" });
    }
});

app.get("/api/background-images", async (req, res) => {
    res.json(await Background.find());
});

app.delete("/api/background-images/:id", auth, async (req, res) => {
    await Background.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});



/* ================= HERO ================= */
app.post("/api/hero-slides", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "hero");
    await Hero.create({ imageUrl, caption: req.body.caption || "" });
    res.json({ success: true });
});

app.get("/api/hero-slides", async (req, res) => {
    res.json(await Hero.find());
});

app.put("/api/hero-slides/:id", auth, upload.single("image"), async (req, res) => {
    const imageUrl = req.file ? await safeUpload(req.file, "hero") : null;

    await Hero.findByIdAndUpdate(req.params.id, {
        caption: req.body.caption,
        ...(imageUrl && { imageUrl })
    });

    res.json({ success: true });
});

app.delete("/api/hero-slides/:id", auth, async (req, res) => {
    await Hero.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

/* ================= STAFF ================= */
app.post("/api/staff-members", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "staff");

    await Staff.create({
        name: req.body.name,
        position: req.body.position,
        imageUrl
    });

    res.json({ success: true });
});

app.get("/api/staff-members", async (req, res) => {
    res.json(await Staff.find());
});

app.put("/api/staff-members/:id", auth, upload.single("image"), async (req, res) => {
    const imageUrl = req.file ? await safeUpload(req.file, "staff") : null;

    await Staff.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        position: req.body.position,
        ...(imageUrl && { imageUrl })
    });

    res.json({ success: true });
});

app.delete("/api/staff-members/:id", auth, async (req, res) => {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

/* ================= EVENTS (UPDATED) ================= */
app.post("/api/events", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "events");

    await Event.create({
        title: req.body.title,
        description: req.body.description,
        eventDate: req.body.eventDate,
        imageUrl
    });

    res.json({ success: true });
});

app.get("/api/events", async (req, res) => {
    res.json(await Event.find());
});

app.put("/api/events/:id", auth, upload.single("image"), async (req, res) => {
    const imageUrl = req.file ? await safeUpload(req.file, "events") : null;

    await Event.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        description: req.body.description,
        eventDate: req.body.eventDate,
        ...(imageUrl && { imageUrl })
    });

    res.json({ success: true });
});

app.delete("/api/events/:id", auth, async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

/* ================= NEWS ================= */
app.post("/api/news", auth, upload.single("image"), async (req, res) => {
    const imageUrl = await safeUpload(req.file, "news");

    await News.create({
        title: req.body.title,
        slug: req.body.slug,
        preview: req.body.preview,
        content: req.body.content,
        imageUrl
    });

    res.json({ success: true });
});

app.get("/api/news", async (req, res) => {
    const news = await News.find().sort({ _id: -1 }); // newest first
    res.json(news);
});


app.delete("/api/news/:id", auth, async (req, res) => {
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.post("/api/gallery-items", auth, upload.single("image"), async (req, res) => {
    try {
        const url = req.body.type === "video"
            ? req.body.url
            : await safeUpload(req.file, "gallery");

        await Gallery.create({
            type: req.body.type,
            url,
            caption: req.body.caption
        });

        res.json({ success: true });
    } catch {
        res.status(500).json({ message: "Gallery upload failed" });
    }
});

app.get("/api/gallery-items", async (req, res) => {
    res.json(await Gallery.find());
});

/* ================= GALLERY UPDATE ================= */
app.put("/api/gallery-items/:id", auth, upload.single("image"), async (req, res) => {
    try {
        let url = req.body.url;

        if (req.body.type !== "video" && req.file) {
            url = await safeUpload(req.file, "gallery");
        }

        await Gallery.findByIdAndUpdate(req.params.id, {
            type: req.body.type,
            caption: req.body.caption,
            ...(url && { url })
        });

        res.json({ success: true });

    } catch (err) {
        console.error("❌ Gallery update error:", err);
        res.status(500).json({ message: "Gallery update failed" });
    }
});

/* ================= NEWS UPDATE (FIX) ================= */
app.put("/api/news/:id", auth, upload.single("image"), async (req, res) => {
    try {
        const imageUrl = req.file ? await safeUpload(req.file, "news") : null;

        await News.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            slug: req.body.slug,
            preview: req.body.preview,
            content: req.body.content,
            ...(imageUrl && { imageUrl })
        });

        res.json({ success: true });

    } catch (err) {
        console.error("❌ News update error:", err);
        res.status(500).json({ message: "News update failed" });
    }
});


app.delete("/api/gallery-items/:id", auth, async (req, res) => {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});


/* ================= MESSAGES ================= */

// SEND MESSAGE (from contact form)
app.post("/api/messages", async (req, res) => {
    try {
        console.log("📩 Message received:", req.body);

        await Message.create({
            name: req.body.name,
            email: req.body.email,
            subject: req.body.subject,
            message: req.body.message
        });

        res.json({ success: true });

    } catch (err) {
        console.error("❌ Message error:", err);
        res.status(500).json({ message: "Message failed to send" });
    }
});

// GET ALL (admin dashboard)
app.get("/api/messages", auth, async (req, res) => {
    res.json(await Message.find());
});

// DELETE
app.delete("/api/messages/:id", auth, async (req, res) => {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});
/* ================= START ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
