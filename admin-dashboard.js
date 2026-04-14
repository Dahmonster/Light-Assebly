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
        throw new Error(data.message || "Request failed");
    }

    return data;
}

/* ================= DASHBOARD COUNTS ================= */
async function loadDashboardCounts() {
    try {
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

    } catch (err) {
        console.error(err);
    }
}

/* ================= LOGOUT ================= */
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

/* ================= NAV ================= */
function switchSection(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(`${section}-section`)?.classList.add("active");

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
    const form = new FormData();
    form.append("image", heroFile.files[0]);
    form.append("caption", heroCaption.value);

    await api("/hero-slides", { method: "POST", body: form });

    toast("Hero added");
    loadHero();
    loadDashboardCounts();
}

async function loadHero() {
    const data = await api("/hero-slides");

    heroList.innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="100"/>
            <input value="${i.caption}" id="hero-${i.id}" />
            <button onclick="updateHero(${i.id})">Edit</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateHero(id) {
    await api(`/hero-slides/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            caption: document.getElementById(`hero-${id}`).value
        })
    });

    toast("Updated");
    loadHero();
}

async function deleteHero(id) {
    await api(`/hero-slides/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadHero();
    loadDashboardCounts();
}

/* ================= STAFF ================= */
async function addStaff() {
    const form = new FormData();
    form.append("image", staffFile.files[0]);
    form.append("name", staffName.value);
    form.append("position", staffPosition.value);

    await api("/staff-members", { method: "POST", body: form });

    toast("Added");
    loadStaff();
    loadDashboardCounts();
}

async function loadStaff() {
    const data = await api("/staff-members");

    staffList.innerHTML = data.map(i => `
        <div>
            <input value="${i.name}" id="name-${i.id}" />
            <input value="${i.position}" id="pos-${i.id}" />
            <button onclick="updateStaff(${i.id})">Edit</button>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateStaff(id) {
    await api(`/staff-members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: document.getElementById(`name-${id}`).value,
            position: document.getElementById(`pos-${id}`).value
        })
    });

    toast("Updated");
    loadStaff();
}

async function deleteStaff(id) {
    await api(`/staff-members/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadStaff();
    loadDashboardCounts();
}

/* ================= NEWS ================= */
async function addNews() {
    const form = new FormData();
    form.append("title", newsTitle.value);
    form.append("slug", newsSlug.value);
    form.append("preview", newsPreviewText.value);
    form.append("content", newsContent.value);
    form.append("image", newsFile.files[0]);

    await api("/news", { method: "POST", body: form });

    toast("Added");
    loadNews();
    loadDashboardCounts();
}

async function loadNews() {
    const data = await api("/news");

    newsList.innerHTML = data.map(i => `
        <div>
            <input value="${i.title}" id="title-${i.id}" />
            <button onclick="updateNews(${i.id})">Edit</button>
            <button onclick="deleteNews(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateNews(id) {
    await api(`/news/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: document.getElementById(`title-${id}`).value
        })
    });

    toast("Updated");
    loadNews();
}

async function deleteNews(id) {
    await api(`/news/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadNews();
    loadDashboardCounts();
}

/* ================= EVENTS ================= */
async function addEvent() {
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
    loadDashboardCounts();
}

async function loadEvents() {
    const data = await api("/events");

    eventsList.innerHTML = data.map(i => `
        <div>
            <input value="${i.title}" id="event-${i.id}" />
            <button onclick="updateEvent(${i.id})">Edit</button>
            <button onclick="deleteEvent(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function updateEvent(id) {
    await api(`/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: document.getElementById(`event-${id}`).value
        })
    });

    toast("Updated");
    loadEvents();
}

async function deleteEvent(id) {
    await api(`/events/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadEvents();
    loadDashboardCounts();
}

/* ================= MESSAGES ================= */
async function loadMessages() {
    const data = await api("/messages");

    messagesList.innerHTML = data.map(i => `
        <div>
            <b>${i.name}</b>
            <p>${i.message}</p>
            <button onclick="deleteMessage(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function deleteMessage(id) {
    await api(`/messages/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadMessages();
    loadDashboardCounts();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.dataset.section) {
                switchSection(btn.dataset.section);
            }
        });
    });

    addHeroBtn.onclick = addHero;
    addStaffBtn.onclick = addStaff;
    addNewsBtn.onclick = addNews;
    addEventBtn.onclick = addEvent;
    logoutBtn.onclick = logout;

    loadHero();
    loadStaff();
    loadNews();
    loadEvents();
    loadMessages();
    loadDashboardCounts();
});
