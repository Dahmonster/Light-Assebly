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
        color: "#fff",
        padding: "12px 16px",
        borderRadius: "8px",
        zIndex: 99999
    });

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

/* ================= API ================= */
async function api(url, options = {}) {
    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    const res = await fetch(API + url, {
        ...options,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    let data = {};
    try { data = await res.json(); } catch {}

    if (!res.ok) {
        console.error("API ERROR:", data);
        throw new Error(data.message || "Request failed");
    }

    return data;
}

/* ================= LOGOUT ================= */
function logout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
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
        events: loadEvents,
        news: loadNews,
        messages: loadMessages
    })[section]?.();
}

/* ================= HERO ================= */
async function addHero() {
    try {
        const file = heroFile.files[0];
        const form = new FormData();
        form.append("image", file);
        form.append("caption", heroCaption.value);

        await api("/hero-slides", { method: "POST", body: form });

        toast("Hero added");
        loadHero();
    } catch (e) { toast(e.message, "error"); }
}

async function loadHero() {
    const data = await api("/hero-slides");
    heroList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="100"/>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function deleteHero(id) {
    await api(`/hero-slides/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadHero();
}

/* ================= STAFF ================= */
async function addStaff() {
    try {
        const file = staffFile.files[0];

        const form = new FormData();
        form.append("image", file);
        form.append("name", staffName.value);
        form.append("position", staffPosition.value);

        await api("/staff-members", { method: "POST", body: form });

        toast("Staff added");
        loadStaff();
    } catch (e) { toast(e.message, "error"); }
}

async function loadStaff() {
    const data = await api("/staff-members");
    staffList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="80"/>
            <p>${i.name} - ${i.position}</p>
        </div>
    `).join("");
}

/* ================= BACKGROUND ================= */
async function addBackground() {
    try {
        const file = bgFile.files[0];
        const form = new FormData();
        form.append("image", file);

        await api("/background-images", { method: "POST", body: form });

        toast("Uploaded");
        loadBackground();
    } catch (e) { toast(e.message, "error"); }
}

async function loadBackground() {
    const data = await api("/background-images");
    backgroundList.innerHTML = data.map(i => `
        <img src="${i.url}" width="100"/>
    `).join("");
}

/* ================= GALLERY ================= */
async function addGallery() {
    try {
        const type = galleryType.value;
        const file = galleryFile.files[0];

        const form = new FormData();
        form.append("type", type);
        form.append("caption", galleryCaption.value);

        if (type === "video") form.append("url", galleryVideoUrl.value);
        else form.append("image", file);

        await api("/gallery-items", { method: "POST", body: form });

        toast("Gallery added");
        loadGallery();
    } catch (e) { toast(e.message, "error"); }
}

async function loadGallery() {
    const data = await api("/gallery-items");
    galleryList.innerHTML = data.map(i => `
        <div>
            ${i.type === "video"
                ? `<a href="${i.url}" target="_blank">Video</a>`
                : `<img src="${i.url}" width="100"/>`}
        </div>
    `).join("");
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

        toast("Event added");
        loadEvents();
    } catch (e) { toast(e.message, "error"); }
}

async function loadEvents() {
    const data = await api("/events");
    eventsList.innerHTML = data.map(i => `
        <div>
            <p>${i.title}</p>
        </div>
    `).join("");
}

/* ================= NEWS ================= */
async function addNews() {
    try {
        const file = newsFile.files[0];

        const form = new FormData();
        form.append("title", newsTitle.value);
        form.append("slug", newsSlug.value);
        form.append("preview", newsPreviewText.value);
        form.append("content", newsContent.value);
        form.append("image", file);

        await api("/news", { method: "POST", body: form });

        toast("News added");
        loadNews();
    } catch (e) { toast(e.message, "error"); }
}

async function loadNews() {
    const data = await api("/news");
    newsList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="80"/>
            <p>${i.title}</p>
        </div>
    `).join("");
}

/* ================= MESSAGES ================= */
async function loadMessages() {
    try {
        const data = await api("/messages");

        const container = document.getElementById("messagesList");

        if (!container) return;

        if (!data.length) {
            container.innerHTML = "<p>No messages yet</p>";
            return;
        }

        container.innerHTML = data.map(i => `
            <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
                <b>${i.name}</b>
                <p><strong>Email:</strong> ${i.email}</p>
                ${i.subject ? `<p><strong>Subject:</strong> ${i.subject}</p>` : ""}
                <p>${i.message}</p>
            </div>
        `).join("");

    } catch (err) {
        console.error(err);
        toast("Failed to load messages", "error");
    }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    setupMenu();

    // NAV
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.dataset.section) {
                switchSection(btn.dataset.section);
            }
        });
    });

    // BUTTONS
    addHeroBtn.onclick = addHero;
    addStaffBtn.onclick = addStaff;
    addBgBtn.onclick = addBackground;
    addGalleryBtn.onclick = addGallery;
    addEventBtn.onclick = addEvent;
    addNewsBtn.onclick = addNews;

    // LOGOUT
    logoutBtn.onclick = logout;

    // LOAD
    loadHero();
    loadStaff();
    loadBackground();
    loadGallery();
    loadEvents();
    loadNews();
    loadMessages();
});
