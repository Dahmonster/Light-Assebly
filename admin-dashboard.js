/***********************
 * CONFIG
 ***********************/
const API_BASE = "https://light-assembly.onrender.com/api";

/***********************
 * API HELPER
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
 * CLOUDINARY UPLOAD (IMPORTANT FIXED)
 * -> ALWAYS SEND FILES AS FormData
 ***********************/
async function uploadFile(endpoint, file, extra = {}) {
    const form = new FormData();

    // backend expects "image"
    form.append("image", file);

    Object.entries(extra).forEach(([key, value]) => {
        form.append(key, value);
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

    const nameEl = document.getElementById("userName");
    if (nameEl) nameEl.textContent = user;

    return true;
}

function handleLogout() {
    localStorage.removeItem("adminUser");
    window.location.href = "login.html";
}

/***********************
 * SECTION SWITCHER
 ***********************/
let currentSection = "overview";

function switchSection(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

    currentSection = section;

    const loaders = {
        overview: loadOverview,
        background: loadBackground,
        hero: loadHero,
        staff: loadStaff,
        news: loadNews,
        events: loadEvents,
        gallery: loadGallery,
        messages: loadMessages
    };

    loaders[section]?.();
}

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

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/***********************
 * HERO
 ***********************/
async function loadHero() {
    const items = await api("/hero-slides");

    const list = document.getElementById("heroList");
    if (!list) return;

    list.innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="100"/>

            <input type="file" id="heroFile-${i.id}" />
            <input type="text" id="heroCaption-${i.id}" value="${i.caption || ""}" />

            <button onclick="updateHero(${i.id})">Update</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addHero() {
    const file = document.getElementById("heroFile").files[0];
    const caption = document.getElementById("heroCaption").value;

    if (!file) return alert("Select image");

    await uploadFile("/hero-slides", file, { caption });
    loadHero();
}

async function updateHero(id) {
    const file = document.getElementById(`heroFile-${id}`).files[0];
    const caption = document.getElementById(`heroCaption-${id}`).value;

    if (file) {
        await uploadFile("/hero-slides", file, { caption });
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

    const list = document.getElementById("staffList");
    if (!list) return;

    list.innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="80"/>

            <div>${i.name}</div>
            <div>${i.position}</div>

            <input type="file" id="staffFile-${i.id}" />
            <input type="text" id="staffName-${i.id}" value="${i.name}" />
            <input type="text" id="staffPosition-${i.id}" value="${i.position}" />

            <button onclick="updateStaff(${i.id})">Update</button>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addStaff() {
    const file = document.getElementById("staffFile").files[0];
    const name = document.getElementById("staffName").value;
    const position = document.getElementById("staffPosition").value;

    if (!file) return alert("Select image");

    await uploadFile("/staff-members", file, { name, position });
    loadStaff();
}

async function updateStaff(id) {
    const file = document.getElementById(`staffFile-${id}`).files[0];
    const name = document.getElementById(`staffName-${id}`).value;
    const position = document.getElementById(`staffPosition-${id}`).value;

    if (file) {
        await uploadFile("/staff-members", file, { name, position });
    } else {
        await api(`/staff-members/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name, position })
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

    const list = document.getElementById("backgroundList");
    if (!list) return;

    list.innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.url}" width="120"/>
        </div>
    `).join("");
}

async function addBackground() {
    const file = document.getElementById("bgFile").files[0];

    if (!file) return alert("Select image");

    await uploadFile("/background-images", file);
    loadBackground();
}

/***********************
 * GALLERY (FIXED)
 ***********************/
async function loadGallery() {
    const items = await api("/gallery-items");

    const list = document.getElementById("galleryList");
    if (!list) return;

    list.innerHTML = items.map(i => `
        <div class="item-card">
            ${i.type === "image"
                ? `<img src="${i.url}" width="100"/>`
                : "🎥 Video"
            }
            <div>${i.caption || ""}</div>
        </div>
    `).join("");
}

async function addGallery() {
    const file = document.getElementById("galleryFile").files[0];
    const type = document.getElementById("galleryType").value;
    const caption = document.getElementById("galleryCaption").value;

    if (type === "image") {
        if (!file) return alert("Select image");

        await uploadFile("/gallery-items", file, {
            type,
            caption
        });
    } else {
        const videoUrl = document.getElementById("galleryVideoUrl").value;

        await api("/gallery-items", {
            method: "POST",
            body: JSON.stringify({
                type,
                videoUrl,
                caption
            })
        });
    }

    loadGallery();
}

/***********************
 * MESSAGES
 ***********************/
async function loadMessages() {
    const items = await api("/contact-messages");

    const list = document.getElementById("messagesList");
    if (!list) return;

    list.innerHTML = items.map(m => `
        <div class="${m.isRead ? "" : "unread"}">
            <b>${m.name}</b>
            <p>${m.subject}</p>
            <small>${m.message}</small>

            ${!m.isRead ? `<button onclick="markRead(${m.id})">Mark Read</button>` : ""}
            <button onclick="deleteMessage(${m.id})">Delete</button>
        </div>
    `).join("");
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
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;

    document.querySelectorAll(".nav-item:not(.logout)")
        .forEach(btn => btn.addEventListener("click", e =>
            switchSection(e.target.dataset.section)
        ));

    document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

    loadOverview();
});
