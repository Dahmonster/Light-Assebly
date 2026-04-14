const API_BASE = "https://light-assembly.onrender.com/api";

/* ======================
   HAMBURGER TOGGLE
====================== */
document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebarNav").classList.toggle("active");
});

/* ======================
   SECTION SWITCHER
====================== */
function switchSection(section) {

    document.querySelectorAll(".section")
        .forEach(s => s.classList.remove("active"));

    document.getElementById(`${section}-section`)
        ?.classList.add("active");

    document.querySelectorAll(".nav-item")
        .forEach(n => n.classList.remove("active"));

    document.querySelector(`[data-section="${section}"]`)
        ?.classList.add("active");

    document.getElementById("sidebarNav")?.classList.remove("active");
}

/* ======================
   NAV CLICK
====================== */
document.querySelectorAll(".nav-item:not(.logout)")
.forEach(btn => {
    btn.addEventListener("click", e => {
        switchSection(e.target.dataset.section);
    });
});

/* ======================
   LOGOUT
====================== */
document.getElementById("logoutBtn")
?.addEventListener("click", () => {
    localStorage.removeItem("adminUser");
    window.location.href = "login.html";
});

/* ======================
   SIMPLE LOADERS (PLACEHOLDERS)
====================== */
async function loadOverview() {}
async function loadBackground() {}
async function loadHero() {}
async function loadStaff() {}
async function loadNews() {}
async function loadEvents() {}
async function loadGallery() {}
async function loadMessages() {}

/* ======================
   INIT
====================== */
document.addEventListener("DOMContentLoaded", () => {
    switchSection("overview");
});
