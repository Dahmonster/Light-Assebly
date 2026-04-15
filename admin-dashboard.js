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

    modalTitle.value = item.title || item.name || "";
    modalSubtitle.value = item.position || item.slug || "";
    modalContent.value = item.description || item.content || "";
    modalDate.value = item.eventDate || "";

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
if (modalForm) {
    modalForm.onsubmit = async (e) => {
        e.preventDefault();

        try {
            const form = new FormData();

            form.append("title", modalTitle.value);
            form.append("name", modalTitle.value);
            form.append("position", modalSubtitle.value);
            form.append("description", modalContent.value);
            form.append("content", modalContent.value);
            form.append("eventDate", modalDate.value);

            if (modalImage.files[0]) {
                form.append("image", modalImage.files[0]);
            }

            await api(`/${currentEdit.type}/${currentEdit.id}`, {
                method: "PUT",
                body: form
            });

            toast("Updated successfully");
            closeModal();
            switchSection(currentEdit.type);

        } catch (err) {
            toast(err.message, "error");
        }
    };
}

/* ================= DASHBOARD ================= */
async function loadDashboardCounts() {
    const [news, staff, events, messages] = await Promise.all([
        api("/news"),
        api("/staff-members"),
        api("/events"),
        api("/messages")
    ]);

    newsCount.textContent = news.length;
    staffCount.textContent = staff.length;
    eventsCount.textContent = events.length;
    messagesCount.textContent = messages.length;
}

/* ================= HERO ================= */
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

/* ================= STAFF ================= */
async function loadStaff() {
    const data = await api("/staff-members");

    staffList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="80"/>
            <p>${i.name} - ${i.position}</p>
            <button onclick='openModal("staff-members", ${JSON.stringify(i)})'>Edit</button>
            <button onclick="deleteStaff('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteStaff(id) {
    if (!confirmDelete()) return;
    await api(`/staff-members/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadStaff();
}

/* ================= BACKGROUND ================= */
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
        <div>
            <b>${i.name}</b>
            <p>${i.message}</p>
            <button onclick="deleteMessage('${i._id}')">Delete</button>
        </div>
    `).join("");
}

async function deleteMessage(id) {
    if (!confirmDelete()) return;
    await api(`/messages/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadMessages();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    setupMenu();

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.onclick = () => switchSection(btn.dataset.section);
    });

    addEventBtn.onclick = addEvent;
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
