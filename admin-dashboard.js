const API = "https://light-assembly.onrender.com/api";
let token = localStorage.getItem("token");

/* ================= TOAST ================= */
function toast(msg, type = "success") {
    const el = document.createElement("div");

    el.textContent = msg;

    Object.assign(el.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: type === "success" ? "green" : "crimson",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        zIndex: 99999
    });

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

/* ================= API WRAPPER ================= */
async function api(url, options = {}) {
    const res = await fetch(API + url, {
        ...options,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
    }

    return res.json();
}

/* ================= LOGIN ================= */
async function login(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch(API + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.token) {
        localStorage.setItem("token", data.token);
        token = data.token;

        toast("Login successful");
        window.location.href = "dashboard.html";
    } else {
        toast("Login failed", "error");
    }
}

/* ================= MENU ================= */
function setupMenu() {
    const btn = document.getElementById("menuToggle");
    const nav = document.getElementById("sidebarNav");

    btn?.addEventListener("click", () => {
        nav.classList.toggle("active");
    });
}

/* ================= NAVIGATION ================= */
function switchSection(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

    if (section === "hero") loadHero();
    if (section === "staff") loadStaff();
    if (section === "background") loadBackground();
    if (section === "gallery") loadGallery();
    if (section === "events") loadEvents();
}

/* ================= HERO ================= */
async function addHero() {
    const file = document.getElementById("heroFile").files[0];
    const caption = document.getElementById("heroCaption").value;

    if (!file) return toast("Select image", "error");

    const form = new FormData();
    form.append("image", file);
    form.append("caption", caption);

    await api("/hero-slides", {
        method: "POST",
        body: form
    });

    document.getElementById("heroFile").value = "";
    document.getElementById("heroCaption").value = "";

    toast("Hero uploaded");
    loadHero();
}

async function loadHero() {
    const data = await api("/hero-slides");

    document.getElementById("heroList").innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="100"/>
            <input id="hero-caption-${i.id}" value="${i.caption || ""}"/>
            <button onclick="updateHero(${i.id})">Update</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateHero(id) {
    const caption = document.getElementById(`hero-caption-${id}`).value;

    await api(`/hero-slides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption })
    });

    toast("Updated");
    loadHero();
}

async function deleteHero(id) {
    await api(`/hero-slides/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadHero();
}

/* ================= STAFF ================= */
async function addStaff() {
    const file = document.getElementById("staffFile").files[0];
    const name = document.getElementById("staffName").value;
    const position = document.getElementById("staffPosition").value;

    const form = new FormData();
    form.append("image", file);
    form.append("name", name);
    form.append("position", position);

    await api("/staff-members", {
        method: "POST",
        body: form
    });

    document.getElementById("staffFile").value = "";
    document.getElementById("staffName").value = "";
    document.getElementById("staffPosition").value = "";

    toast("Staff added");
    loadStaff();
}

async function loadStaff() {
    const data = await api("/staff-members");

    document.getElementById("staffList").innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="80"/>
            <input id="staff-name-${i.id}" value="${i.name}"/>
            <input id="staff-position-${i.id}" value="${i.position}"/>

            <button onclick="updateStaff(${i.id})">Update</button>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateStaff(id) {
    const name = document.getElementById(`staff-name-${id}`).value;
    const position = document.getElementById(`staff-position-${id}`).value;

    await api(`/staff-members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, position })
    });

    toast("Updated");
    loadStaff();
}

async function deleteStaff(id) {
    await api(`/staff-members/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadStaff();
}

/* ================= BACKGROUND ================= */
async function addBackground() {
    const file = document.getElementById("bgFile").files[0];
    if (!file) return toast("Select image", "error");

    const form = new FormData();
    form.append("image", file);

    await api("/background-images", {
        method: "POST",
        body: form
    });

    document.getElementById("bgFile").value = "";
    toast("Uploaded");
    loadBackground();
}

async function loadBackground() {
    const data = await api("/background-images");

    document.getElementById("backgroundList").innerHTML = data.map(i => `
        <div>
            <img src="${i.url}" width="120"/>
            <button onclick="deleteBackground(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function deleteBackground(id) {
    await api(`/background-images/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadBackground();
}

/* ================= GALLERY ================= */
async function loadGallery() {
    const data = await api("/gallery-items");

    document.getElementById("galleryList").innerHTML = data.map(i => `
        <div>
            <img src="${i.url}" width="100"/>
            <input id="gallery-caption-${i.id}" value="${i.caption || ""}"/>
            <button onclick="updateGallery(${i.id})">Update</button>
            <button onclick="deleteGallery(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateGallery(id) {
    const caption = document.getElementById(`gallery-caption-${id}`).value;

    await api(`/gallery-items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption })
    });

    toast("Updated");
    loadGallery();
}

async function deleteGallery(id) {
    await api(`/gallery-items/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadGallery();
}

/* ================= EVENTS ================= */
async function loadEvents() {
    const data = await api("/events");

    document.getElementById("eventsList").innerHTML = data.map(i => `
        <div>
            <h4>${i.title}</h4>
            <input id="event-title-${i.id}" value="${i.title}"/>
            <textarea id="event-desc-${i.id}">${i.description}</textarea>

            <button onclick="updateEvent(${i.id})">Update</button>
            <button onclick="deleteEvent(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateEvent(id) {
    const title = document.getElementById(`event-title-${id}`).value;
    const description = document.getElementById(`event-desc-${id}`).value;

    await api(`/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
    });

    toast("Updated");
    loadEvents();
}

async function deleteEvent(id) {
    await api(`/events/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadEvents();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    setupMenu();

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const section = btn.dataset.section;
            if (section) switchSection(section);
        });
    });

    document.getElementById("addHeroBtn")?.addEventListener("click", addHero);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);
    document.getElementById("addBgBtn")?.addEventListener("click", addBackground);

    loadHero();
    loadStaff();
    loadBackground();
});
