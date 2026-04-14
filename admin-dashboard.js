const API = "https://light-assembly.onrender.com/api";

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

/* ================= API ================= */
async function api(url, options = {}) {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    console.log("TOKEN:", token);

    const res = await fetch(API + url, {
        ...options,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    let data;
    try {
        data = await res.json();
    } catch {
        data = {};
    }

    // 🚨 NO AUTO LOGOUT ANYMORE
    if (res.status === 403) {
        console.error("403 ERROR:", data);
        throw new Error(data.message || "Forbidden");
    }

    if (!res.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

/* ================= MENU ================= */
function setupMenu() {
    document.getElementById("menuToggle")?.addEventListener("click", () => {
        document.getElementById("sidebarNav")?.classList.toggle("active");
    });
}

/* ================= NAV ================= */
function switchSection(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

    ({
        hero: loadHero,
        staff: loadStaff,
        background: loadBackground,
        gallery: loadGallery,
        events: loadEvents
    })[section]?.();
}

/* ================= HERO ================= */
async function addHero() {
    try {
        const file = heroFile.files[0];
        if (!file) return toast("Select image", "error");

        const form = new FormData();
        form.append("image", file);
        form.append("caption", heroCaption.value);

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

        heroList.innerHTML = data.map(i => `
            <div>
                <img src="${i.imageUrl}" width="100"/>
                <input id="hero-${i.id}" value="${i.caption || ""}"/>
                <button onclick="updateHero(${i.id})">Update</button>
                <button onclick="deleteHero(${i.id})">Delete</button>
            </div>
        `).join("");

    } catch {
        toast("Failed to load hero", "error");
    }
}

async function updateHero(id) {
    try {
        await api(`/hero-slides/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caption: document.getElementById(`hero-${id}`).value })
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
        const file = staffFile.files[0];
        if (!file || !staffName.value) return toast("Fill fields", "error");

        const form = new FormData();
        form.append("image", file);
        form.append("name", staffName.value);
        form.append("position", staffPosition.value);

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

        staffList.innerHTML = data.map(i => `
            <div>
                <img src="${i.imageUrl}" width="80"/>
                <input id="staff-name-${i.id}" value="${i.name}"/>
                <input id="staff-position-${i.id}" value="${i.position}"/>
                <button onclick="updateStaff(${i.id})">Update</button>
                <button onclick="deleteStaff(${i.id})">Delete</button>
            </div>
        `).join("");

    } catch {
        toast("Failed to load staff", "error");
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
        const file = bgFile.files[0];
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

        backgroundList.innerHTML = data.map(i => `
            <div>
                <img src="${i.url}" width="120"/>
                <button onclick="deleteBackground(${i.id})">Delete</button>
            </div>
        `).join("");

    } catch {
        toast("Failed to load background", "error");
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
        const file = galleryFile.files[0];
        const type = galleryType.value;

        if (type === "image" && !file) return toast("Select image", "error");
        if (type === "video" && !galleryVideoUrl.value) return toast("Enter video URL", "error");

        const form = new FormData();
        form.append("type", type);
        form.append("caption", galleryCaption.value);

        if (type === "video") form.append("url", galleryVideoUrl.value);
        else form.append("image", file);

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

        galleryList.innerHTML = data.map(i => `
            <div>
                ${i.type === "video"
                    ? `<a href="${i.url}" target="_blank">▶ Video</a>`
                    : `<img src="${i.url}" width="100"/>`}
                <input id="gallery-${i.id}" value="${i.caption || ""}"/>
                <button onclick="updateGallery(${i.id})">Update</button>
                <button onclick="deleteGallery(${i.id})">Delete</button>
            </div>
        `).join("");

    } catch {
        toast("Failed to load gallery", "error");
    }
}

async function updateGallery(id) {
    try {
        await api(`/gallery-items/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caption: document.getElementById(`gallery-${id}`).value })
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
        await api("/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: eventTitle.value,
                description: eventDescription.value,
                eventDate: eventDate.value
            })
        });

        toast("Added");
        loadEvents();

    } catch (err) {
        toast(err.message, "error");
    }
}

async function loadEvents() {
    try {
        const data = await api("/events");

        eventsList.innerHTML = data.map(i => `
            <div>
                <input id="event-${i.id}" value="${i.title}"/>
                <textarea id="event-desc-${i.id}">${i.description}</textarea>
                <button onclick="updateEvent(${i.id})">Update</button>
                <button onclick="deleteEvent(${i.id})">Delete</button>
            </div>
        `).join("");

    } catch {
        toast("Failed to load events", "error");
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
