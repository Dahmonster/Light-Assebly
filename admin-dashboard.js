const API = "https://light-assembly.onrender.com/api";

/* ================= DOM ================= */
const modalImage = document.getElementById("modalImageInput");
const modalPreview = document.getElementById("imagePreview");
const uploadBox = document.getElementById("uploadBox");

const modalTitle = document.getElementById("modalTitleInput");
const modalSubtitle = document.getElementById("modalSubtitleInput");
const modalContent = document.getElementById("modalContentInput");
const modalDate = document.getElementById("modalDateInput");
const modalForm = document.getElementById("modalForm");

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

    if (!res.ok) throw new Error(data.message || "Request failed");

    return data;
}

/* ================= LOGOUT ================= */
function logout() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "login.html";
}

/* ================= CONFIRM ================= */
function confirmDelete() {
    return confirm("Are you sure?");
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

    if (section === "overview") return;

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

/* ================= MODAL ================= */
let currentEdit = {};

function openModal(type, item) {
    currentEdit = { type, id: item._id };

    // Reset all fields first
    modalTitle.value = "";
    modalSubtitle.value = "";
    modalContent.value = "";
    modalDate.value = "";

    // Hide all inputs first
    modalTitle.style.display = "none";
    modalSubtitle.style.display = "none";
    modalContent.style.display = "none";
    modalDate.style.display = "none";

    // ===== HERO =====
    if (type === "hero-slides") {
        modalTitle.style.display = "block";
        modalTitle.placeholder = "Caption";
        modalTitle.value = item.caption || "";
    }

    // ===== STAFF =====
    if (type === "staff-members") {
        modalTitle.style.display = "block";
        modalSubtitle.style.display = "block";

        modalTitle.placeholder = "Name";
        modalSubtitle.placeholder = "Position";

        modalTitle.value = item.name || "";
        modalSubtitle.value = item.position || "";
    }

    // ===== EVENTS =====
    if (type === "events") {
        modalTitle.style.display = "block";
        modalContent.style.display = "block";
        modalDate.style.display = "block";

        modalTitle.placeholder = "Title";

        modalTitle.value = item.title || "";
        modalContent.value = item.description || "";
        modalDate.value = item.eventDate || "";
    }

    // ===== NEWS =====
    if (type === "news") {
        modalTitle.style.display = "block";
        modalSubtitle.style.display = "block";
        modalContent.style.display = "block";

        modalTitle.placeholder = "Title";
        modalSubtitle.placeholder = "Slug";

        modalTitle.value = item.title || "";
        modalSubtitle.value = item.slug || "";
        modalContent.value = item.content || "";
    }

    // ===== GALLERY =====
    if (type === "gallery-items") {
        modalContent.style.display = "block";
        modalContent.placeholder = "Caption";

        modalContent.value = item.caption || "";
    }

    // Image preview
    modalPreview.src = item.imageUrl || item.url || "";
    modalPreview.style.display = modalPreview.src ? "block" : "none";

    document.getElementById("editModal").classList.add("active");
}

function closeModal() {
    document.getElementById("editModal").classList.remove("active");
}

/* ================= IMAGE UPLOAD ================= */
if (uploadBox) {
    uploadBox.onclick = () => modalImage.click();
}

if (modalImage) {
    modalImage.onchange = () => {
        const file = modalImage.files[0];
        if (file) {
            modalPreview.src = URL.createObjectURL(file);
            modalPreview.style.display = "block";
        }
    };
}

/* ================= SAVE EDIT ================= */
modalForm.onsubmit = async (e) => {
    e.preventDefault();

    try {
        const form = new FormData();

        const type = currentEdit.type;

        // ===== HERO =====
        if (type === "hero-slides") {
            form.append("caption", modalTitle.value);
        }

        // ===== STAFF =====
        if (type === "staff-members") {
            form.append("name", modalTitle.value);
            form.append("position", modalSubtitle.value);
        }

        // ===== EVENTS =====
        if (type === "events") {
            form.append("title", modalTitle.value);
            form.append("description", modalContent.value);
            form.append("eventDate", modalDate.value);
        }

        // ===== NEWS =====
        if (type === "news") {
            form.append("title", modalTitle.value);
            form.append("slug", modalSubtitle.value);
            form.append("content", modalContent.value);
        }

        // ===== GALLERY =====
        if (type === "gallery-items") {
            form.append("caption", modalContent.value);
            form.append("type", "image");
        }

        // Image (for ALL types)
        if (modalImage.files[0]) {
            form.append("image", modalImage.files[0]);
        }

        await api(`/${type}/${currentEdit.id}`, {
            method: "PUT",
            body: form
        });

        toast("Updated successfully");
        closeModal();

        // reload correct section
        const reloadMap = {
            "hero-slides": loadHero,
            "staff-members": loadStaff,
            "events": loadEvents,
            "news": loadNews,
            "gallery-items": loadGallery
        };

        reloadMap[type]?.();

    } catch (err) {
        toast(err.message, "error");
    }
};

/* ================= DASHBOARD ================= */
async function loadDashboardCounts() {
    const [news, staff, events, messages] = await Promise.all([
        api("/news"),
        api("/staff-members"),
        api("/events"),
        api("/messages")
    ]);

    document.getElementById("newsCount").textContent = news.length;
    document.getElementById("staffCount").textContent = staff.length;
    document.getElementById("eventsCount").textContent = events.length;
    document.getElementById("messagesCount").textContent = messages.length;
}

/* ================= HERO ================= */
async function addHero() {
    try {
        const file = document.getElementById("heroFile").files[0];
        const caption = document.getElementById("heroCaption").value;

        const form = new FormData();
        form.append("image", file);
        form.append("caption", caption);

        await api("/hero-slides", { method: "POST", body: form });

        toast("Hero added");
        loadHero();
        loadDashboardCounts();

    } catch (e) {
        toast(e.message, "error");
    }
}

async function loadHero() {
    const data = await api("/hero-slides");

    heroList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="100"/>
            <p>${i.caption || ""}</p>
            <button onclick='openModal("hero-slides", ${JSON.stringify(i)})'>Edit</button>
            <button onclick="deleteHero('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteHero(id) {
    if (!confirmDelete()) return;
    await api(`/hero-slides/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadHero();
}

/* ================= BACKGROUND ================= */
async function addBg() {
    try {
        const file = document.getElementById("bgFile").files[0];

        const form = new FormData();
        form.append("image", file);

        await api("/background-images", { method: "POST", body: form });

        toast("Background uploaded");
        loadBackground();

    } catch (e) {
        toast(e.message, "error");
    }
}

async function loadBackground() {
    const data = await api("/background-images");

    backgroundList.innerHTML = data.map(i => `
        <div>
            <img src="${i.url}" width="100"/>
            <button onclick="deleteBg('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteBg(id) {
    if (!confirmDelete()) return;
    await api(`/background-images/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadBackground();
}

/* ================= GALLERY ================= */
async function addGallery() {
    try {
        const type = document.getElementById("galleryType").value;
        const file = document.getElementById("galleryFile").files[0];
        const url = document.getElementById("galleryVideoUrl").value;
        const caption = document.getElementById("galleryCaption").value;

        const form = new FormData();
        form.append("type", type);
        form.append("caption", caption);

        if (type === "video") {
            form.append("url", url);
        } else {
            form.append("image", file);
        }

        await api("/gallery-items", { method: "POST", body: form });

        toast("Gallery added");
        loadGallery();

    } catch (e) {
        toast(e.message, "error");
    }
}

async function loadGallery() {
    const data = await api("/gallery-items");

    galleryList.innerHTML = data.map(i => `
        <div>
            ${i.type === "video"
                ? `<a href="${i.url}" target="_blank">Video</a>`
                : `<img src="${i.url}" width="100"/>`}
            <button onclick='openModal("gallery-items", ${JSON.stringify(i)})'>Edit</button>
            <button onclick="deleteGallery('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteGallery(id) {
    if (!confirmDelete()) return;
    await api(`/gallery-items/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadGallery();
}

/* ================= EVENTS ================= */
async function addEvent() {
    try {
        const file = document.getElementById("eventFile").files[0];

        const form = new FormData();
        form.append("title", eventTitle.value);
        form.append("description", eventDescription.value);
        form.append("eventDate", eventDate.value);

        if (file) form.append("image", file);

        await api("/events", { method: "POST", body: form });

        toast("Event added");
        loadEvents();
        loadDashboardCounts();

    } catch (e) {
        toast(e.message, "error");
    }
}

async function loadEvents() {
    const data = await api("/events");

    eventsList.innerHTML = data.map(i => `
        <div>
            ${i.imageUrl ? `<img src="${i.imageUrl}" width="80"/>` : ""}
            <p>${i.title}</p>
            <button onclick='openModal("events", ${JSON.stringify(i)})'>Edit</button>
            <button onclick="deleteEvent('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteEvent(id) {
    if (!confirmDelete()) return;
    await api(`/events/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadEvents();
}

/* ================= NEWS ================= */
async function addNews() {
    try {
        const file = document.getElementById("newsFile").files[0];

        const form = new FormData();
        form.append("title", newsTitle.value);
        form.append("slug", newsSlug.value);
        form.append("preview", newsPreviewText.value);
        form.append("content", newsContent.value);

        if (file) form.append("image", file);

        await api("/news", { method: "POST", body: form });

        toast("News added");
        loadNews();
        loadDashboardCounts();

    } catch (e) {
        toast(e.message, "error");
    }
}

async function loadNews() {
    const data = await api("/news");

    newsList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="80"/>
            <p>${i.title}</p>
            <button onclick='openModal("news", ${JSON.stringify(i)})'>Edit</button>
            <button onclick="deleteNews('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteNews(id) {
    if (!confirmDelete()) return;
    await api(`/news/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadNews();
}

/* ================= MESSAGES ================= */
async function loadMessages() {
    const data = await api("/messages");

    messagesList.innerHTML = data.map(i => `
    <div class="message-card">
        <div class="message-header">
            <h4>${i.name}</h4>
            <span class="message-email">${i.email}</span>
        </div>

        <div class="message-subject">
            ${i.subject}
        </div>

        <p class="message-body">${i.message}</p>

        <div class="message-actions">
            <a href="mailto:${i.email}?subject=${encodeURIComponent(i.subject)}">
                Reply
            </a>
            <button onclick="deleteMessage('${i._id}')">Delete</button>
        </div>
    </div>
`).join("");
}

async function deleteMessage(id) {
    if (!confirmDelete()) return;
    await api(`/messages/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadMessages();
}

async function addStaff() {
    try {
        const name = document.getElementById("staffName").value.trim();
        const position = document.getElementById("staffPosition").value.trim();
        const file = document.getElementById("staffFile").files[0];

        if (!name || !position) {
            return toast("Name and position required", "error");
        }

        const form = new FormData();
        form.append("name", name);
        form.append("position", position);

        if (file) {
            form.append("image", file); // 🔥 change to "file" if it fails
        }

        console.log("Sending staff:", name, position, file);

        await api("/staff-members", {
            method: "POST",
            body: form
        });

        toast("Staff added successfully");

        // Clear form (important)
        document.getElementById("staffName").value = "";
        document.getElementById("staffPosition").value = "";
        document.getElementById("staffFile").value = "";

        loadStaff();
        loadDashboardCounts();

    } catch (e) {
        console.error(e);
        toast(e.message, "error");
    }
    }

/* ================= STAFF ================= */
async function loadStaff() {
    try {
        const data = await api("/staff-members");

        const staffList = document.getElementById("staffList");

        if (!staffList) return;

        staffList.innerHTML = data.map(i => `
            <div>
                <img src="${i.imageUrl}" width="80"/>
                <p>${i.name} - ${i.position}</p>
                <button onclick='openModal("staff-members", ${JSON.stringify(i)})'>Edit</button>
                <button onclick="deleteStaff('${i._id}')">Delete</button>
            </div>
        `).join("");

    } catch (e) {
        toast("Failed to load staff", "error");
        console.error(e);
    }
}

async function deleteStaff(id) {
    if (!confirmDelete()) return;

    try {
        await api(`/staff-members/${id}`, { method: "DELETE" });

        toast("Staff deleted");
        loadStaff();
        loadDashboardCounts();

    } catch (e) {
        toast(e.message, "error");
    }
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    setupMenu();

    document.querySelectorAll(".nav-item").forEach(btn => {
    btn.onclick = () => {
        switchSection(btn.dataset.section);

        if (window.innerWidth < 768) {
            document.getElementById("sidebarNav")?.classList.remove("active");
        }
    };
});

    document.getElementById("addHeroBtn").onclick = addHero;
    document.getElementById("addBgBtn").onclick = addBg;
    document.getElementById("addGalleryBtn").onclick = addGallery;
    document.getElementById("addNewsBtn").onclick = addNews;
    document.getElementById("addEventBtn").onclick = addEvent;
    document.getElementById("addStaffBtn").onclick = addStaff;

    logoutBtn.onclick = logout;

    loadHero();
    loadStaff();
    loadBackground();
    loadGallery();
    loadEvents();
    loadNews();
    loadMessages();
    loadDashboardCounts();
});
