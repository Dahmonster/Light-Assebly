/***********************
 * CONFIG + API WRAPPER
 ***********************/
const API_BASE = 'https://light-assembly.onrender.com/api';

async function api(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Request failed');
        }

        if (res.status === 204) return null;
        return await res.json();

    } catch (error) {
        console.error('API Error:', error.message);
        alert(error.message);
        throw error;
    }
}

/***********************
 * AUTH
 ***********************/
function checkAuth() {
    const user = localStorage.getItem('adminUser');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    document.getElementById('userName').textContent = user;
    return true;
}

function handleLogout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

/***********************
 * DIRECTOR MESSAGE
 ***********************/
document.addEventListener('DOMContentLoaded', initDirectorForm);

async function initDirectorForm() {
    const data = await api('/director-message');

    const titleEl = document.getElementById('directorTitle');
    const msgEl = document.getElementById('directorMessage');
    const imgEl = document.getElementById('directorImage');
    const form = document.getElementById('directorForm');

    if (titleEl) titleEl.value = data?.title || '';
    if (msgEl) msgEl.value = data?.message || '';
    if (imgEl) imgEl.value = data?.imageUrl || '';

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        await api('/director-message', {
            method: 'PUT',
            body: JSON.stringify({
                title: titleEl.value,
                message: msgEl.value,
                imageUrl: imgEl.value
            })
        });

        alert('Director message updated successfully');
    });
}

/***********************
 * SECTION MANAGEMENT
 ***********************/
let currentSection = 'overview';

const sectionLoaders = {
    overview: loadOverview,
    background: loadBackground,
    hero: loadHero,
    staff: loadStaff,
    news: loadNews,
    events: loadEvents,
    gallery: loadGallery,
    messages: loadMessages
};

function switchSection(section) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${section}-section`)?.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

    currentSection = section;
    sectionLoaders[section]?.();
}

/***********************
 * OVERVIEW
 ***********************/
async function loadOverview() {
    const [news, staff, events, messages] = await Promise.all([
        api('/news-posts'),
        api('/staff-members'),
        api('/events'),
        api('/contact-messages')
    ]);

    document.getElementById('newsCount').textContent = news.length;
    document.getElementById('staffCount').textContent = staff.length;
    document.getElementById('eventsCount').textContent = events.length;
    document.getElementById('messagesCount').textContent = messages.length;
}

/***********************
 * BACKGROUND IMAGES
 ***********************/
async function loadBackground() {
    const items = await api('/background-images');

    document.getElementById('backgroundList').innerHTML = items.map(item => `
        <div class="item-card">
            <img src="${item.url}" style="max-width:100px;border-radius:5px;" />
            <div class="item-info">
                <div>Background #${item.id}</div>
                <small>Order: ${item.orderIndex}</small>
            </div>
            <div class="item-actions">
                <button onclick="editBackground(${item.id})">Edit</button>
                <button onclick="deleteBackground(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * HERO SLIDES
 ***********************/
async function loadHero() {
    const items = await api('/hero-slides');

    document.getElementById('heroList').innerHTML = items.map(item => `
        <div class="item-card">
            <img src="${item.imageUrl}" style="max-width:100px;border-radius:5px;" />
            <div class="item-info">
                <div>${item.caption || 'No caption'}</div>
                <small>Order: ${item.orderIndex}</small>
            </div>
            <div class="item-actions">
                <button onclick="editHero(${item.id})">Edit</button>
                <button onclick="deleteHero(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * STAFF
 ***********************/
async function loadStaff() {
    const items = await api('/staff-members');

    document.getElementById('staffList').innerHTML = items.map(item => `
        <div class="item-card">
            <img src="${item.imageUrl}" style="max-width:80px;border-radius:50%;" />
            <div class="item-info">
                <div>${item.name}</div>
                <small>${item.position}</small>
            </div>
            <div class="item-actions">
                <button onclick="editStaff(${item.id})">Edit</button>
                <button onclick="deleteStaff(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * NEWS
 ***********************/
async function loadNews() {
    const items = await api('/news-posts');

    document.getElementById('newsList').innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-info">
                <div>${item.title}</div>
                <small>${item.slug}</small>
            </div>
            <div class="item-actions">
                <button onclick="editNews(${item.id})">Edit</button>
                <button onclick="deleteNews(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * EVENTS
 ***********************/
async function loadEvents() {
    const items = await api('/events');

    document.getElementById('eventsList').innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-info">
                <div>${item.title}</div>
                <small>${new Date(item.eventDate).toLocaleDateString()}</small>
            </div>
            <div class="item-actions">
                <button onclick="editEvent(${item.id})">Edit</button>
                <button onclick="deleteEvent(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * GALLERY
 ***********************/
async function loadGallery() {
    const items = await api('/gallery-items');

    document.getElementById('galleryList').innerHTML = items.map(item => `
        <div class="item-card">
            ${item.type === 'image'
                ? `<img src="${item.url}" style="max-width:100px;border-radius:5px;" />`
                : '🎬 Video'
            }
            <div class="item-info">
                <div>${item.caption || item.type}</div>
            </div>
            <div class="item-actions">
                <button onclick="editGallery(${item.id})">Edit</button>
                <button onclick="deleteGallery(${item.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * MESSAGES
 ***********************/
async function loadMessages() {
    const items = await api('/contact-messages');

    document.getElementById('messagesList').innerHTML = items.map(msg => `
        <div class="item-card ${msg.isRead ? '' : 'unread'}">
            <div class="item-info">
                <div>${msg.name}</div>
                <small>${msg.subject}</small>
                <p>${msg.message}</p>
            </div>
            <div class="item-actions">
                ${!msg.isRead ? `<button onclick="markRead(${msg.id})">Mark Read</button>` : ''}
                <button onclick="deleteMessage(${msg.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

/***********************
 * DELETE HELPERS
 ***********************/
async function deleteItem(endpoint, id, reload) {
    if (!confirm('Are you sure?')) return;
    await api(`${endpoint}/${id}`, { method: 'DELETE' });
    reload?.();
}

const deleteBackground = id => deleteItem('/background-images', id, loadBackground);
const deleteHero = id => deleteItem('/hero-slides', id, loadHero);
const deleteNews = id => deleteItem('/news-posts', id, loadNews);
const deleteStaff = id => deleteItem('/staff-members', id, loadStaff);
const deleteEvent = id => deleteItem('/events', id, loadEvents);
const deleteGallery = id => deleteItem('/gallery-items', id, loadGallery);
const deleteMessage = id => deleteItem('/contact-messages', id, loadMessages);

/***********************
 * MARK READ
 ***********************/
async function markRead(id) {
    await api(`/contact-messages/${id}/read`, { method: 'PATCH' });
    loadMessages();
}

/***********************
 * INIT APP
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    document.querySelectorAll('.nav-item:not(.logout)')
        .forEach(btn => btn.addEventListener('click', e =>
            switchSection(e.target.dataset.section)
        ));

    document.getElementById('logoutBtn')
        ?.addEventListener('click', handleLogout);

    loadOverview();
});
