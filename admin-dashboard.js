const API_BASE = "https://light-assembly.onrender.com/api";

/***********************
 * API HELPER (UNIFIED)
 ***********************/
async function api(endpoint, options = {}) {
    const res = await fetch(API_BASE + endpoint, {
        ...options,
        headers: options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
    }

    if (res.status === 204) return null;
    return res.json();
}

/***********************
 * CLOUDINARY UPLOAD HELPER
 ***********************/
async function upload(endpoint, file, extra = {}) {
    const form = new FormData();
    form.append("image", file);

    Object.entries(extra).forEach(([k, v]) => {
        form.append(k, v);
    });

    const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        body: form
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
    }

    return res.json();
}

/***********************
 * AUTH
 ***********************/
function checkAuth() {
    const user = localStorage.getItem("adminUser");
    if (!user) {
        window.location.href = "login.html";
        return false;
    }

    const userEl = document.getElementById("userName");
    if (userEl) userEl.textContent = user;

    return true;
}

function handleLogout() {
    localStorage.removeItem("adminUser");
    window.location.href = "login.html";
}

/***********************
 * SECTION HANDLER
 ***********************/
let currentSection = "overview";

function switchSection(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

    currentSection = section;
    loaders[section]?.();
}

/***********************
 * LOADERS MAP (CLEAN)
 ***********************/
const loaders = {
    overview: loadOverview,
    background: loadBackground,
    hero: loadHero,
    staff: loadStaff,
    news: loadNews,
    events: loadEvents,
    gallery: loadGallery,
    messages: loadMessages,
    director: loadDirector
};

/***********************
 * OVERVIEW
 ***********************/
async function loadOverview() {
    const [news, staff, events, messages] = await Promise.all([
        api("/news-posts"),
        api("/staff-members"),
        api("/events"),
        api("/contact-messages")
    ]);

    setText("newsCount", news.length);
    setText("staffCount", staff.length);
    setText("eventsCount", events.length);
    setText("messagesCount", messages.length);
}

/***********************
 * DIRECTOR MESSAGE
 ***********************/
async function loadDirector() {
    const data = await api("/director-message");

    setValue("directorTitle", data?.title);
    setValue("directorMessage", data?.message);
    setValue("directorImage", data?.imageUrl);

    document.getElementById("directorForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        await api("/director-message", {
            method: "PUT",
            body: JSON.stringify({
                title: getValue("directorTitle"),
                message: getValue("directorMessage"),
                imageUrl: getValue("directorImage")
            })
        });

        alert("Updated successfully");
    });
}

/***********************
 * HERO
 ***********************/
async function loadHero() {
    const items = await api("/hero-slides");

    setHTML("heroList", items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="100" />
            <p>${i.caption || ""}</p>

            <input type="file" id="heroFile-${i.id}" />
            <input type="text" id="heroCaption-${i.id}" placeholder="caption" />

            <button onclick="updateHero(${i.id})">Update</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `));
}

async function addHero() {
    const file = getFile("heroFile");
    const caption = getValue("heroCaption");

    await upload("/hero-slides", file, { caption });

    loadHero();
}

async function updateHero(id) {
    const file = getFile(`heroFile-${id}`);
    const caption = getValue(`heroCaption-${id}`);

    if (file) {
        await upload("/hero-slides", file, { caption });
    } else {
        await api(`/hero-slides/${id}`, {
            method: "PUT",
            body: JSON.stringify({ caption })
        });
    }

    loadHero();
}

async function deleteHero(id) {
    await api(`/hero-slides/${id}`, { method: "DELETE" });
    loadHero();
}

/***********************
 * STAFF
 ***********************/
async function loadStaff() {
    const items = await api("/staff-members");

    setHTML("staffList", items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="80" />
            <p>${i.name}</p>
            <small>${i.position}</small>

            <input type="file" id="staffFile-${i.id}" />

            <button onclick="updateStaff(${i.id})">Update</button>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `));
}

async function addStaff() {
    const file = getFile("staffFile");

    await upload("/staff-members", file, {
        name: getValue("staffName"),
        position: getValue("staffPosition")
    });

    loadStaff();
}

async function updateStaff(id) {
    const file = getFile(`staffFile-${id}`);

    if (file) {
        await upload("/staff-members", file, {
            name: getValue("staffName"),
            position: getValue("staffPosition")
        });
    }

    loadStaff();
}

async function deleteStaff(id) {
    await api(`/staff-members/${id}`, { method: "DELETE" });
    loadStaff();
}

/***********************
 * BACKGROUND
 ***********************/
async function loadBackground() {
    const items = await api("/background-images");

    setHTML("backgroundList", items.map(i => `
        <img src="${i.url}" width="120"/>
    `));
}

async function addBackground() {
    const file = getFile("bgFile");

    await upload("/background-images", file);

    loadBackground();
}

/***********************
 * GALLERY
 ***********************/
async function loadGallery() {
    const items = await api("/gallery-items");

    setHTML("galleryList", items.map(i => `
        <div>
            ${i.type === "image"
                ? `<img src="${i.url}" width="100"/>`
                : "🎥 Video"}
            <p>${i.caption || ""}</p>
        </div>
    `));
}

async function addGallery() {
    const file = getFile("galleryFile");
    const type = getValue("galleryType");

    if (type === "image") {
        await upload("/gallery-items", file, {
            type,
            caption: getValue("galleryCaption")
        });
    } else {
        await api("/gallery-items", {
            method: "POST",
            body: JSON.stringify({
                type,
                videoUrl: getValue("galleryVideoUrl"),
                caption: getValue("galleryCaption")
            })
        });
    }

    loadGallery();
}

/***********************
 * EVENTS
 ***********************/
async function loadEvents() {
    const items = await api("/events");

    setHTML("eventsList", items.map(e => `
        <div>
            <h4>${e.title}</h4>
            <small>${new Date(e.eventDate).toLocaleDateString()}</small>
        </div>
    `));
}

/***********************
 * MESSAGES
 ***********************/
async function loadMessages() {
    const items = await api("/contact-messages");

    setHTML("messagesList", items.map(m => `
        <div class="${m.isRead ? "" : "unread"}">
            <b>${m.name}</b>
            <p>${m.subject}</p>
            <small>${m.message}</small>

            ${!m.isRead ? `<button onclick="markRead(${m.id})">Mark Read</button>` : ""}
            <button onclick="deleteMessage(${m.id})">Delete</button>
        </div>
    `));
}

async function markRead(id) {
    await api(`/contact-messages/${id}/read`, { method: "PATCH" });
    loadMessages();
}

async function deleteMessage(id) {
    await api(`/contact-messages/${id}`, { method: "DELETE" });
    loadMessages();
}

/***********************
 * HELPERS
 ***********************/
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
}

function getValue(id) {
    return document.getElementById(id)?.value;
}

function getFile(id) {
    return document.getElementById(id)?.files?.[0];
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;

    document.querySelectorAll(".nav-item:not(.logout)")
        .forEach(btn => btn.addEventListener("click", e =>
            switchSection(e.target.dataset.section)
        ));

    document.getElementById("logoutBtn")
        ?.addEventListener("click", handleLogout);

    loadOverview();
});
