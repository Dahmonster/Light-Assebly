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
 * CLOUDINARY UPLOAD HELPER
 ***********************/
async function uploadFile(endpoint, file, extra = {}) {
    if (!file && endpoint !== "/gallery-items" && extra.type !== "video") {
        throw new Error("File is required");
    }

    const form = new FormData();

    if (file) {
        form.append("image", file);
    }

    Object.keys(extra).forEach(key => {
        form.append(key, extra[key]);
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
    document.getElementById("userName").textContent = user;
    return true;
}

function handleLogout() {
    localStorage.removeItem("adminUser");
    window.location.href = "login.html";
}

/***********************
 * DIRECTOR MESSAGE
 ***********************/
async function initDirector() {
    const data = await api("/director-message");

    const titleEl = document.getElementById("directorTitle");
    const msgEl = document.getElementById("directorMessage");
    const imgEl = document.getElementById("directorImage");

    if (titleEl) titleEl.value = data?.title || "";
    if (msgEl) msgEl.value = data?.message || "";
    if (imgEl) imgEl.value = data?.imageUrl || "";

    document.getElementById("directorForm")?.addEventListener("submit", async e => {
        e.preventDefault();

        await api("/director-message", {
            method: "PUT",
            body: JSON.stringify({
                title: titleEl.value,
                message: msgEl.value,
                imageUrl: imgEl.value
            })
        });

        alert("Director message updated");
    });
}

/***********************
 * SECTION SWITCHING
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

    document.getElementById("newsCount").textContent = news?.length || 0;
    document.getElementById("staffCount").textContent = staff?.length || 0;
    document.getElementById("eventsCount").textContent = events?.length || 0;
    document.getElementById("messagesCount").textContent = messages?.length || 0;
}

/***********************
 * HERO SLIDES (CLOUDINARY)
 ***********************/
async function addHero() {
    const file = document.getElementById("heroFile").files[0];
    const caption = document.getElementById("heroCaption").value;

    await uploadFile("/hero-slides", file, { caption });

    loadHero();
}

async function loadHero() {
    const items = await api("/hero-slides");

    document.getElementById("heroList").innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="100"/>
            <div>${i.caption || ""}</div>

            <input type="file" id="heroFile-${i.id}" />
            <input type="text" id="heroCaption-${i.id}" value="${i.caption || ""}" />

            <button onclick="updateHero(${i.id})">Update</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
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
 * STAFF (CLOUDINARY)
 ***********************/
async function loadStaff() {
    const items = await api("/staff-members");

    document.getElementById("staffList").innerHTML = items.map(i => `
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

    await uploadFile("/staff-members", file, {
        name,
        position
    });

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

    document.getElementById("backgroundList").innerHTML = items.map(i => `
        <img src="${i.url}" width="120"/>
    `).join("");
}

async function addBackground() {
    const file = document.getElementById("bgFile").files[0];
    await uploadFile("/background-images", file);
    loadBackground();
}

/***********************
 * GALLERY (CLOUDINARY)
 ***********************/
async function loadGallery() {
    const items = await api("/gallery-items");

    document.getElementById("galleryList").innerHTML = items.map(i => `
        <div>
            ${i.type === "image"
                ? `<img src="${i.url}" width="100"/>`
                : "🎥 Video"}
            <div>${i.caption || ""}</div>
        </div>
    `).join("");
}

async function addGallery() {
    const file = document.getElementById("galleryFile").files[0];
    const type = document.getElementById("galleryType").value;
    const caption = document.getElementById("galleryCaption").value;

    if (type === "image") {
        await uploadFile("/gallery-items", file, { type, caption });
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

    document.getElementById("messagesList").innerHTML = items.map(m => `
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

    initDirector();

    document.querySelectorAll(".nav-item:not(.logout)")
        .forEach(btn => btn.addEventListener("click", e =>
            switchSection(e.target.dataset.section)
        ));

    document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);

    loadOverview();
});
