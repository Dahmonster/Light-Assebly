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
 * FILE UPLOAD (CLOUDINARY)
 ***********************/
async function uploadFile(endpoint, file, extra = {}) {
    const form = new FormData();
    form.append("image", file);

    Object.entries(extra).forEach(([k, v]) => {
        form.append(k, v);
    });

    const res = await fetch(API_BASE + endpoint, {
        method: "POST",
        body: form
    });

    if (!res.ok) throw new Error("Upload failed");

    return res.json();
}

/***********************
 * HAMBURGER MENU
 ***********************/
document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebarNav").classList.toggle("active");
});

/***********************
 * NAVIGATION
 ***********************/
function switchSection(section) {

    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

    document.getElementById("sidebarNav")?.classList.remove("active");

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
 * NAV CLICK
 ***********************/
document.querySelectorAll(".nav-item:not(.logout)")
.forEach(btn => {
    btn.addEventListener("click", e => {
        switchSection(e.target.dataset.section);
    });
});

/***********************
 * LOGOUT
 ***********************/
document.getElementById("logoutBtn")
?.addEventListener("click", () => {
    localStorage.removeItem("adminUser");
    window.location.href = "login.html";
});

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
 * BACKGROUND
 ***********************/
async function loadBackground() {
    const items = await api("/background-images");

    document.getElementById("backgroundList").innerHTML =
        items.map(i => `<img src="${i.url}" width="120">`).join("");
}

async function addBackground() {
    const file = document.getElementById("bgFile").files[0];
    if (!file) return alert("Select image");

    await uploadFile("/background-images", file);
    loadBackground();
}

/***********************
 * HERO
 ***********************/
async function loadHero() {
    const items = await api("/hero-slides");

    document.getElementById("heroList").innerHTML =
        items.map(i => `
            <div>
                <img src="${i.imageUrl}" width="100">
                <p>${i.caption || ""}</p>
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

/***********************
 * STAFF
 ***********************/
async function loadStaff() {
    const items = await api("/staff-members");

    document.getElementById("staffList").innerHTML =
        items.map(i => `
            <div>
                <img src="${i.imageUrl}" width="80">
                <p>${i.name}</p>
                <p>${i.position}</p>
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

/***********************
 * NEWS
 ***********************/
async function loadNews() {
    const items = await api("/news-posts");

    document.getElementById("newsList").innerHTML =
        items.map(n => `<div>${n.title}</div>`).join("");
}

async function addNews() {
    const file = document.getElementById("newsFile").files[0];

    const data = {
        title: document.getElementById("newsTitle").value,
        slug: document.getElementById("newsSlug").value,
        previewText: document.getElementById("newsPreviewText").value,
        content: document.getElementById("newsContent").value
    };

    if (file) {
        await uploadFile("/news-posts", file, data);
    } else {
        await api("/news-posts", {
            method: "POST",
            body: JSON.stringify(data)
        });
    }

    loadNews();
}

/***********************
 * EVENTS
 ***********************/
async function loadEvents() {
    const items = await api("/events");

    document.getElementById("eventsList").innerHTML =
        items.map(e => `<div>${e.title}</div>`).join("");
}

async function addEvent() {
    const file = document.getElementById("eventFile").files[0];

    const data = {
        title: document.getElementById("eventTitle").value,
        description: document.getElementById("eventDescription").value,
        eventDate: document.getElementById("eventDate").value
    };

    if (file) {
        await uploadFile("/events", file, data);
    } else {
        await api("/events", {
            method: "POST",
            body: JSON.stringify(data)
        });
    }

    loadEvents();
}

/***********************
 * GALLERY
 ***********************/
async function loadGallery() {
    const items = await api("/gallery-items");

    document.getElementById("galleryList").innerHTML =
        items.map(i => `<div>${i.caption || ""}</div>`).join("");
}

async function addGallery() {
    const type = document.getElementById("galleryType").value;

    if (type === "image") {
        const file = document.getElementById("galleryFile").files[0];
        if (!file) return alert("Select image");

        await uploadFile("/gallery-items", file, {
            type,
            caption: document.getElementById("galleryCaption").value
        });
    } else {
        await api("/gallery-items", {
            method: "POST",
            body: JSON.stringify({
                type,
                videoUrl: document.getElementById("galleryVideoUrl").value,
                caption: document.getElementById("galleryCaption").value
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

    document.getElementById("messagesList").innerHTML =
        items.map(m => `<div>${m.name}</div>`).join("");
}

/***********************
 * BUTTON EVENTS (VERY IMPORTANT FIX)
 ***********************/
document.addEventListener("DOMContentLoaded", () => {

    switchSection("overview");

    document.getElementById("addBgBtn")?.addEventListener("click", addBackground);
    document.getElementById("addHeroBtn")?.addEventListener("click", addHero);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);
    document.getElementById("addNewsBtn")?.addEventListener("click", addNews);
    document.getElementById("addEventBtn")?.addEventListener("click", addEvent);
    document.getElementById("addGalleryBtn")?.addEventListener("click", addGallery);
});
