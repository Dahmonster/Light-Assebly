const API_BASE = "https://light-assembly.onrender.com/api";

/***********************
 * TOAST
 ***********************/
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/***********************
 * HELPERS
 ***********************/
async function api(endpoint, options = {}) {
    try {
        const res = await fetch(API_BASE + endpoint, {
            ...options,
            headers: options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }
        });

        if (!res.ok) throw new Error("Request failed");

        if (res.status === 204) return null;
        return res.json();
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function uploadFile(endpoint, file, extra = {}) {
    try {
        const form = new FormData();
        form.append("image", file);

        Object.entries(extra).forEach(([k, v]) => form.append(k, v));

        const res = await fetch(API_BASE + endpoint, {
            method: "POST",
            body: form
        });

        if (!res.ok) throw new Error("Upload failed");

        showToast("Upload successful ✅");
        return res.json();
    } catch (err) {
        showToast(err.message, "error");
    }
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
 * NAVIGATION + HAMBURGER
 ***********************/
function switchSection(section) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    document.getElementById(section + "-section")?.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`)?.classList.add("active");

    document.querySelector(".sidebar-nav").classList.remove("active");

    const loaders = {
        overview: loadOverview,
        background: loadBackground,
        hero: loadHero,
        staff: loadStaff,
        gallery: loadGallery
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

    setText("newsCount", news?.length || 0);
    setText("staffCount", staff?.length || 0);
    setText("eventsCount", events?.length || 0);
    setText("messagesCount", messages?.length || 0);
}

function setText(id, val) {
    document.getElementById(id).textContent = val;
}

/***********************
 * CLEAR INPUTS
 ***********************/
function clearInputs(...ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        if (el.type === "file") el.value = "";
        else el.value = "";
    });
}

/***********************
 * BACKGROUND
 ***********************/
async function loadBackground() {
    const items = await api("/background-images");

    document.getElementById("backgroundList").innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.url}" width="120"/>

            <button onclick="deleteBackground(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addBackground() {
    const file = document.getElementById("bgFile").files[0];
    if (!file) return showToast("Select image", "error");

    await uploadFile("/background-images", file);

    clearInputs("bgFile");
    loadBackground();
}

async function deleteBackground(id) {
    if (!confirm("Delete this image?")) return;

    await api(`/background-images/${id}`, { method: "DELETE" });
    showToast("Deleted successfully");
    loadBackground();
}

/***********************
 * HERO
 ***********************/
async function loadHero() {
    const items = await api("/hero-slides");

    document.getElementById("heroList").innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="100"/>

            <input type="text" id="cap-${i.id}" value="${i.caption || ""}">

            <button onclick="updateHero(${i.id})">Edit</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addHero() {
    const file = document.getElementById("heroFile").files[0];
    const caption = document.getElementById("heroCaption").value;

    if (!file) return showToast("Select image", "error");

    await uploadFile("/hero-slides", file, { caption });

    clearInputs("heroFile", "heroCaption");
    loadHero();
}

async function updateHero(id) {
    const caption = document.getElementById(`cap-${id}`).value;

    await api(`/hero-slides/${id}`, {
        method: "PUT",
        body: JSON.stringify({ caption })
    });

    showToast("Updated successfully");
    loadHero();
}

async function deleteHero(id) {
    if (!confirm("Delete this?")) return;

    await api(`/hero-slides/${id}`, { method: "DELETE" });
    showToast("Deleted");
    loadHero();
}

/***********************
 * STAFF
 ***********************/
async function loadStaff() {
    const items = await api("/staff-members");

    document.getElementById("staffList").innerHTML = items.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="80"/>

            <input id="name-${i.id}" value="${i.name}">
            <input id="pos-${i.id}" value="${i.position}">

            <button onclick="updateStaff(${i.id})">Edit</button>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addStaff() {
    const file = document.getElementById("staffFile").files[0];
    const name = document.getElementById("staffName").value;
    const position = document.getElementById("staffPosition").value;

    if (!file) return showToast("Select image", "error");

    await uploadFile("/staff-members", file, { name, position });

    clearInputs("staffFile", "staffName", "staffPosition");
    loadStaff();
}

async function updateStaff(id) {
    const name = document.getElementById(`name-${id}`).value;
    const position = document.getElementById(`pos-${id}`).value;

    await api(`/staff-members/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, position })
    });

    showToast("Updated");
    loadStaff();
}

async function deleteStaff(id) {
    if (!confirm("Delete this?")) return;

    await api(`/staff-members/${id}`, { method: "DELETE" });
    showToast("Deleted");
    loadStaff();
}

/***********************
 * INIT
 ***********************/
document.addEventListener("DOMContentLoaded", () => {
    if (!checkAuth()) return;

    document.querySelectorAll(".nav-item:not(.logout)")
        .forEach(btn =>
            btn.addEventListener("click", e =>
                switchSection(e.target.dataset.section)
            )
        );

    document.getElementById("logoutBtn")
        ?.addEventListener("click", handleLogout);

    document.getElementById("menuToggle")
        ?.addEventListener("click", () =>
            document.querySelector(".sidebar-nav")
                .classList.toggle("active")
        );

    // BUTTONS
    document.getElementById("addBgBtn")?.addEventListener("click", addBackground);
    document.getElementById("addHeroBtn")?.addEventListener("click", addHero);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);

    loadOverview();
});
