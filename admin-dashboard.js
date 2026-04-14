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
        background: type === "success" ? "#28a745" : "#dc3545",
        color: "white",
        padding: "12px 16px",
        borderRadius: "8px",
        zIndex: 99999,
        fontSize: "14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
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

    // 🔴 TOKEN EXPIRED HANDLING
    if (res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Request failed");
    }

    return res.json();
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

    const loaders = {
        hero: loadHero,
        staff: loadStaff,
        background: loadBackground,
        gallery: loadGallery,
        events: loadEvents
    };

    loaders[section]?.();
}

/* ================= HERO ================= */
async function addHero() {
    try {
        const file = document.getElementById("heroFile").files[0];
        const caption = document.getElementById("heroCaption").value;

        if (!file) return toast("Select image", "error");

        const form = new FormData();
        form.append("image", file);
        form.append("caption", caption);

        await api("/hero-slides", { method: "POST", body: form });

        toast("Hero uploaded");
        loadHero();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function loadHero() {
    try {
        const data = await api("/hero-slides");

        document.getElementById("heroList").innerHTML = data.map(i => `
            <div class="card">
                <img src="${i.imageUrl}" width="100"/>
                <input id="hero-${i.id}" value="${i.caption || ""}"/>
                <button onclick="updateHero(${i.id})">Update</button>
                <button onclick="deleteHero(${i.id})">Delete</button>
            </div>
        `).join("");
    } catch (err) {
        toast(err.message, "error");
    }
}

async function updateHero(id) {
    try {
        await api(`/hero-slides/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                caption: document.getElementById(`hero-${id}`).value
            })
        });

        toast("Updated");
        loadHero();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function deleteHero(id) {
    try {
        await api(`/hero-slides/${id}`, { method: "DELETE" });
        toast("Deleted");
        loadHero();
    } catch (err) {
        toast(err.message, "error");
    }
}

/* ================= STAFF ================= */
async function addStaff() {
    try {
        const file = document.getElementById("staffFile").files[0];
        const name = document.getElementById("staffName").value;
        const position = document.getElementById("staffPosition").value;

        if (!file || !name) return toast("Fill all fields", "error");

        const form = new FormData();
        form.append("image", file);
        form.append("name", name);
        form.append("position", position);

        await api("/staff-members", { method: "POST", body: form });

        toast("Staff added");
        loadStaff();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function loadStaff() {
    try {
        const data = await api("/staff-members");

        document.getElementById("staffList").innerHTML = data.map(i => `
            <div class="card">
                <img src="${i.imageUrl}" width="80"/>
                <input id="staff-name-${i.id}" value="${i.name}"/>
                <input id="staff-position-${i.id}" value="${i.position}"/>

                <button onclick="updateStaff(${i.id})">Update</button>
                <button onclick="deleteStaff(${i.id})">Delete</button>
            </div>
        `).join("");
    } catch (err) {
        toast(err.message, "error");
    }
}

async function updateStaff(id) {
    try {
        await api(`/staff-members/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: document.getElementById(`staff-name-${id}`).value,
                position: document.getElementById(`staff-position-${id}`).value
            })
        });

        toast("Updated");
        loadStaff();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function deleteStaff(id) {
    try {
        await api(`/staff-members/${id}`, { method: "DELETE" });
        toast("Deleted");
        loadStaff();
    } catch (err) {
        toast(err.message, "error");
    }
}

/* ================= BACKGROUND ================= */
async function addBackground() {
    try {
        const file = document.getElementById("bgFile").files[0];

        if (!file) return toast("Select image", "error");

        const form = new FormData();
        form.append("image", file);

        await api("/background-images", { method: "POST", body: form });

        toast("Uploaded");
        loadBackground();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function loadBackground() {
    try {
        const data = await api("/background-images");

        document.getElementById("backgroundList").innerHTML = data.map(i => `
            <div>
                <img src="${i.url}" width="120"/>
                <button onclick="deleteBackground(${i.id})">Delete</button>
            </div>
        `).join("");
    } catch (err) {
        toast(err.message, "error");
    }
}

async function deleteBackground(id) {
    try {
        await api(`/background-images/${id}`, { method: "DELETE" });
        toast("Deleted");
        loadBackground();
    } catch (err) {
        toast(err.message, "error");
    }
}

/* ================= GALLERY ================= */
async function addGallery() {
    try {
        const file = document.getElementById("galleryFile").files[0];
        const caption = document.getElementById("galleryCaption").value;
        const type = document.getElementById("galleryType").value;
        const videoUrl = document.getElementById("galleryVideoUrl").value;

        if (type === "image" && !file) return toast("Select image", "error");
        if (type === "video" && !videoUrl) return toast("Enter video URL", "error");

        const form = new FormData();
        form.append("type", type);
        form.append("caption", caption);

        if (type === "video") {
            form.append("url", videoUrl);
        } else {
            form.append("image", file);
        }

        await api("/gallery-items", { method: "POST", body: form });

        toast("Added");
        loadGallery();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function loadGallery() {
    try {
        const data = await api("/gallery-items");

        document.getElementById("galleryList").innerHTML = data.map(i => `
            <div>
                ${i.type === "video"
                    ? `<a href="${i.url}" target="_blank">▶ View Video</a>`
                    : `<img src="${i.url}" width="100"/>`}

                <input id="gallery-${i.id}" value="${i.caption || ""}"/>
                <button onclick="updateGallery(${i.id})">Update</button>
                <button onclick="deleteGallery(${i.id})">Delete</button>
            </div>
        `).join("");
    } catch (err) {
        toast(err.message, "error");
    }
}

async function updateGallery(id) {
    try {
        await api(`/gallery-items/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                caption: document.getElementById(`gallery-${id}`).value
            })
        });

        toast("Updated");
        loadGallery();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function deleteGallery(id) {
    try {
        await api(`/gallery-items/${id}`, { method: "DELETE" });
        toast("Deleted");
        loadGallery();
    } catch (err) {
        toast(err.message, "error");
    }
}

/* ================= EVENTS ================= */
async function addEvent() {
    try {
        const title = document.getElementById("eventTitle").value;
        const description = document.getElementById("eventDescription").value;
        const eventDate = document.getElementById("eventDate").value;

        if (!title) return toast("Enter title", "error");

        await api("/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, eventDate })
        });

        toast("Event added");
        loadEvents();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function loadEvents() {
    try {
        const data = await api("/events");

        document.getElementById("eventsList").innerHTML = data.map(i => `
            <div>
                <input id="event-${i.id}" value="${i.title}"/>
                <textarea id="event-desc-${i.id}">${i.description}</textarea>

                <button onclick="updateEvent(${i.id})">Update</button>
                <button onclick="deleteEvent(${i.id})">Delete</button>
            </div>
        `).join("");
    } catch (err) {
        toast(err.message, "error");
    }
}

async function updateEvent(id) {
    try {
        await api(`/events/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: document.getElementById(`event-${id}`).value,
                description: document.getElementById(`event-desc-${id}`).value
            })
        });

        toast("Updated");
        loadEvents();
    } catch (err) {
        toast(err.message, "error");
    }
}

async function deleteEvent(id) {
    try {
        await api(`/events/${id}`, { method: "DELETE" });
        toast("Deleted");
        loadEvents();
    } catch (err) {
        toast(err.message, "error");
    }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    setupMenu();

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => switchSection(btn.dataset.section));
    });

    document.getElementById("addHeroBtn")?.addEventListener("click", addHero);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);
    document.getElementById("addBgBtn")?.addEventListener("click", addBackground);
    document.getElementById("addGalleryBtn")?.addEventListener("click", addGallery);
    document.getElementById("addEventBtn")?.addEventListener("click", addEvent);

    loadHero();
    loadStaff();
    loadBackground();
    loadGallery();
    loadEvents();
});
