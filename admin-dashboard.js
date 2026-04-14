const API_BASE = "https://light-assembly.onrender.com/api";

// =====================
// TOAST
// =====================
function toast(msg, type = "success") {
    const div = document.createElement("div");
    div.textContent = msg;
    div.style.position = "fixed";
    div.style.bottom = "20px";
    div.style.right = "20px";
    div.style.padding = "10px 15px";
    div.style.background = type === "success" ? "green" : "red";
    div.style.color = "white";
    div.style.borderRadius = "6px";
    div.style.zIndex = "9999";
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3000);
}

// =====================
// API
// =====================
async function api(url, options = {}) {
    const res = await fetch(API_BASE + url, {
        ...options,
        headers: options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }
    });

    if (!res.ok) throw new Error("Request failed");
    return res.json();
}

// =====================
// AUTH
// =====================
function checkAuth() {
    const user = localStorage.getItem("adminUser");
    if (!user) window.location.href = "login.html";

    document.getElementById("userName").textContent = user;
}

// =====================
// LOADERS
// =====================
async function loadHero() {
    const data = await api("/hero-slides");

    document.getElementById("heroList").innerHTML = data.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="100"/>
            <input value="${i.caption}" id="cap-${i.id}" />
            <button onclick="updateHero(${i.id})">Update</button>
            <button onclick="deleteHero(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addHero() {
    const file = document.getElementById("heroFile").files[0];
    const caption = document.getElementById("heroCaption").value;

    const form = new FormData();
    form.append("image", file);
    form.append("caption", caption);

    await fetch(API_BASE + "/hero-slides", { method: "POST", body: form });

    document.getElementById("heroFile").value = "";
    document.getElementById("heroCaption").value = "";

    toast("Hero added");
    loadHero();
}

async function updateHero(id) {
    const caption = document.getElementById(`cap-${id}`).value;

    await api(`/hero-slides/${id}`, {
        method: "PUT",
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

// =====================
// STAFF
// =====================
async function loadStaff() {
    const data = await api("/staff-members");

    document.getElementById("staffList").innerHTML = data.map(i => `
        <div class="item-card">
            <img src="${i.imageUrl}" width="80"/>
            <input value="${i.name}" id="name-${i.id}" />
            <input value="${i.position}" id="pos-${i.id}" />
            <button onclick="updateStaff(${i.id})">Update</button>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function addStaff() {
    const file = document.getElementById("staffFile").files[0];
    const name = document.getElementById("staffName").value;
    const position = document.getElementById("staffPosition").value;

    const form = new FormData();
    form.append("image", file);
    form.append("name", name);
    form.append("position", position);

    await fetch(API_BASE + "/staff-members", { method: "POST", body: form });

    document.getElementById("staffFile").value = "";
    document.getElementById("staffName").value = "";
    document.getElementById("staffPosition").value = "";

    toast("Staff added");
    loadStaff();
}

async function updateStaff(id) {
    const name = document.getElementById(`name-${id}`).value;
    const position = document.getElementById(`pos-${id}`).value;

    await api(`/staff-members/${id}`, {
        method: "PUT",
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

// =====================
// BACKGROUND
// =====================
async function addBackground() {
    const file = document.getElementById("bgFile").files[0];

    const form = new FormData();
    form.append("image", file);

    await fetch(API_BASE + "/background-images", { method: "POST", body: form });

    document.getElementById("bgFile").value = "";

    toast("Uploaded");
    loadBackground();
}

async function loadBackground() {
    const data = await api("/background-images");

    document.getElementById("backgroundList").innerHTML =
        data.map(i => `<img src="${i.url}" width="120"/>`).join("");
}

// =====================
// INIT
// =====================
document.addEventListener("DOMContentLoaded", () => {
    checkAuth();

    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const section = btn.dataset.section;

            document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
            document.getElementById(section + "-section")?.classList.add("active");
        });
    });

    // attach buttons
    document.getElementById("addHeroBtn")?.addEventListener("click", addHero);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);
    document.getElementById("addBgBtn")?.addEventListener("click", addBackground);

    loadHero();
    loadStaff();
    loadBackground();
});
