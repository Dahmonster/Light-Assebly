const API = "https://light-assembly.onrender.com/api";

let token = localStorage.getItem("token");

/* ================= TOAST ================= */
function toast(msg, type = "success") {
    const el = document.createElement("div");

    el.textContent = msg;
    el.style.position = "fixed";
    el.style.bottom = "20px";
    el.style.right = "20px";
    el.style.padding = "12px";
    el.style.background = type === "success" ? "green" : "red";
    el.style.color = "white";
    el.style.borderRadius = "8px";
    el.style.zIndex = 9999;

    document.body.appendChild(el);

    setTimeout(() => el.remove(), 3000);
}

/* ================= FETCH WRAPPER ================= */
async function api(url, options = {}) {
    return fetch(API + url, {
        ...options,
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
            ...options.headers
        }
    });
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
        toast("Login successful");
        window.location.href = "dashboard.html";
    } else {
        toast("Login failed", "error");
    }
}

/* ================= HERO ================= */
async function addHero() {
    const file = document.getElementById("heroFile").files[0];
    const caption = document.getElementById("heroCaption").value;

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
    const res = await api("/hero-slides");
    const data = await res.json();

    document.getElementById("heroList").innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="100">
            <p>${i.caption}</p>
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
    const res = await api("/staff-members");
    const data = await res.json();

    document.getElementById("staffList").innerHTML = data.map(i => `
        <div>
            <img src="${i.imageUrl}" width="80">
            <p>${i.name}</p>
            <p>${i.position}</p>
            <button onclick="deleteStaff(${i.id})">Delete</button>
        </div>
    `).join("");
}

async function deleteStaff(id) {
    await api(`/staff-members/${id}`, { method: "DELETE" });
    toast("Deleted");
    loadStaff();
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addHeroBtn")?.addEventListener("click", addHero);
    document.getElementById("addStaffBtn")?.addEventListener("click", addStaff);

    loadHero();
    loadStaff();
});
