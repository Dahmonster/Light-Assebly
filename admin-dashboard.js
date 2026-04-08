document.addEventListener('DOMContentLoaded', () => {

    async function loadDirectorForm() {
        const res = await fetch(`${API_BASE}/director-message`);
        const data = await res.json();
    
        document.getElementById('directorTitle').value = data.title || '';
        document.getElementById('directorMessage').value = data.message || '';
        document.getElementById('directorImage').value = data.imageUrl || '';
    }
    
    loadDirectorForm();


    const directorForm = document.getElementById('directorForm');

    if (directorForm) {
        directorForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = document.getElementById('directorTitle').value;
            const message = document.getElementById('directorMessage').value;
            const imageUrl = document.getElementById('directorImage').value;

            await fetch(`${API_BASE}/director-message`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    message,
                    imageUrl
                })
            });

            alert('Director message saved successfully');
        });
    }

});




const API_BASE = 'http://localhost:5000/api';
let currentSection = 'overview';
let editingId = null;
let editingType = null;

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('adminUser');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    document.getElementById('userName').textContent = user;
    return true;
}

// Logout
function handleLogout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}

// Section Navigation
function switchSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelector(`#${sectionName}-section`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
    
    // Load data for specific sections
    if (sectionName === 'overview') loadOverview();
    else if (sectionName === 'background') loadBackground();
    else if (sectionName === 'hero') loadHero();
    else if (sectionName === 'staff') loadStaff();
    else if (sectionName === 'news') loadNews();
    else if (sectionName === 'events') loadEvents();
    else if (sectionName === 'gallery') loadGallery();
    else if (sectionName === 'messages') loadMessages();
}

// Load Overview Data
async function loadOverview() {
    try {
        const news = await fetch(`${API_BASE}/news-posts`).then(r => r.json());
        const staff = await fetch(`${API_BASE}/staff-members`).then(r => r.json());
        const events = await fetch(`${API_BASE}/events`).then(r => r.json());
        const messages = await fetch(`${API_BASE}/contact-messages`).then(r => r.json());
        
        document.getElementById('newsCount').textContent = news.length;
        document.getElementById('staffCount').textContent = staff.length;
        document.getElementById('eventsCount').textContent = events.length;
        document.getElementById('messagesCount').textContent = messages.length;
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

// Load Background Images
async function loadBackground() {
    try {
        const items = await fetch(`${API_BASE}/background-images`).then(r => r.json());
        const list = document.getElementById('backgroundList');
        
        list.innerHTML = items.map(item => `
            <div class="item-card">
                <img src="${item.url}" alt="Background" style="max-width: 100px; max-height: 80px; object-fit: cover; border-radius: 4px;">
                <div class="item-info">
                    <div class="item-title">Background Image #${item.id}</div>
                    <div class="item-detail">Order: ${item.orderIndex}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary" onclick="editBackground(${item.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteBackground(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading background:', error);
    }
}

// Load Hero Slides
async function loadHero() {
    try {
        const items = await fetch(`${API_BASE}/hero-slides`).then(r => r.json());
        const list = document.getElementById('heroList');
        
        list.innerHTML = items.map(item => `
            <div class="item-card">
                <img src="${item.imageUrl}" alt="${item.caption}" style="max-width: 100px; max-height: 80px; object-fit: cover; border-radius: 4px;">
                <div class="item-info">
                    <div class="item-title">${item.caption || 'Slide #' + item.id}</div>
                    <div class="item-detail">Order: ${item.orderIndex}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary" onclick="editHero(${item.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteHero(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading hero:', error);
    }
}

// Load News
async function loadNews() {
    try {
        const news = await fetch(`${API_BASE}/news-posts`).then(r => r.json());
        const list = document.getElementById('newsList');
        
        list.innerHTML = news.map(post => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${post.title}</div>
                    <div class="item-detail">Slug: ${post.slug}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary" onclick="editNews(${post.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteNews(${post.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading news:', error);
    }
}

// Load Staff
async function loadStaff() {
    try {
        const staff = await fetch(`${API_BASE}/staff-members`).then(r => r.json());
        const list = document.getElementById('staffList');
        
        list.innerHTML = staff.map(member => `
            <div class="item-card">
                <img src="${member.imageUrl}" alt="${member.name}" style="max-width: 80px; max-height: 80px; object-fit: cover; border-radius: 50%;">
                <div class="item-info">
                    <div class="item-title">${member.name}</div>
                    <div class="item-detail">${member.position}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary" onclick="editStaff(${member.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteStaff(${member.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading staff:', error);
    }
}

// Load Events
async function loadEvents() {
    try {
        const events = await fetch(`${API_BASE}/events`).then(r => r.json());
        const list = document.getElementById('eventsList');
        
        list.innerHTML = events.map(event => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-title">${event.title}</div>
                    <div class="item-detail">${new Date(event.eventDate).toLocaleDateString()}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary" onclick="editEvent(${event.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

// Load Gallery
async function loadGallery() {
    try {
        const items = await fetch(`${API_BASE}/gallery-items`).then(r => r.json());
        const list = document.getElementById('galleryList');
        
        list.innerHTML = items.map(item => `
            <div class="item-card">
                ${item.type === 'image' ? 
                    `<img src="${item.url}" alt="${item.caption}" style="max-width: 100px; max-height: 80px; object-fit: cover; border-radius: 4px;">` :
                    `<div style="max-width: 100px; max-height: 80px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center;">🎬 Video</div>`
                }
                <div class="item-info">
                    <div class="item-title">${item.caption || item.type.toUpperCase()}</div>
                    <div class="item-detail">Type: ${item.type}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-secondary" onclick="editGallery(${item.id})">Edit</button>
                    <button class="btn-danger" onclick="deleteGallery(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

// Load Messages
async function loadMessages() {
    try {
        const messages = await fetch(`${API_BASE}/contact-messages`).then(r => r.json());
        const list = document.getElementById('messagesList');
        
        list.innerHTML = messages.map(msg => `
            <div class="item-card" style="${msg.isRead ? '' : 'background: #f0f4ff;'}">
                <div class="item-info">
                    <div class="item-title">${msg.name}</div>
                    <div class="item-detail">From: ${msg.email} | Subject: ${msg.subject}</div>
                    <div class="item-detail">${msg.message}</div>
                </div>
                <div class="item-actions">
                    ${!msg.isRead ? `<button class="btn-secondary" onclick="markRead(${msg.id})">Mark Read</button>` : ''}
                    <button class="btn-danger" onclick="deleteMessage(${msg.id})">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Edit Background
async function editBackground(id) {
    const items = await fetch(`${API_BASE}/background-images`).then(r => r.json());
    const item = items.find(i => i.id === id);
    
    openModal('Edit Background Image', [
        { label: 'Image URL', name: 'url', value: item.url, type: 'url' },
        { label: 'Order Index', name: 'orderIndex', value: item.orderIndex, type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/background-images/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadBackground();
    });
}

// Edit Hero
async function editHero(id) {
    const items = await fetch(`${API_BASE}/hero-slides`).then(r => r.json());
    const item = items.find(i => i.id === id);
    
    openModal('Edit Hero Slide', [
        { label: 'Image URL', name: 'imageUrl', value: item.imageUrl, type: 'url' },
        { label: 'Caption', name: 'caption', value: item.caption || '', type: 'text' },
        { label: 'Order Index', name: 'orderIndex', value: item.orderIndex, type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/hero-slides/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadHero();
    });
}

// Edit News
async function editNews(id) {
    const items = await fetch(`${API_BASE}/news-posts`).then(r => r.json());
    const item = items.find(i => i.id === id);
    
    openModal('Edit News Post', [
        { label: 'Title', name: 'title', value: item.title, type: 'text' },
        { label: 'Slug', name: 'slug', value: item.slug, type: 'text' },
        { label: 'Preview Text', name: 'previewText', value: item.previewText, type: 'textarea' },
        { label: 'Content', name: 'content', value: item.content, type: 'textarea' },
        { label: 'Featured Image URL', name: 'featuredImage', value: item.featuredImage || '', type: 'url' }
    ], async (formData) => {
        await fetch(`${API_BASE}/news-posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadNews();
    });
}

// Edit Staff
async function editStaff(id) {
    const items = await fetch(`${API_BASE}/staff-members`).then(r => r.json());
    const item = items.find(i => i.id === id);
    
    openModal('Edit Staff Member', [
        { label: 'Name', name: 'name', value: item.name, type: 'text' },
        { label: 'Position', name: 'position', value: item.position, type: 'text' },
        { label: 'Image URL', name: 'imageUrl', value: item.imageUrl, type: 'url' },
        { label: 'Order Index', name: 'orderIndex', value: item.orderIndex, type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/staff-members/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadStaff();
    });
}

// Edit Event
async function editEvent(id) {
    const items = await fetch(`${API_BASE}/events`).then(r => r.json());
    const item = items.find(i => i.id === id);
    
    openModal('Edit Event', [
        { label: 'Title', name: 'title', value: item.title, type: 'text' },
        { label: 'Description', name: 'description', value: item.description, type: 'textarea' },
        { label: 'Event Date', name: 'eventDate', value: item.eventDate, type: 'datetime-local' },
        { label: 'Image URL', name: 'imageUrl', value: item.imageUrl || '', type: 'url' },
        { label: 'Is Upcoming', name: 'isUpcoming', value: item.isUpcoming, type: 'checkbox' }
    ], async (formData) => {
        await fetch(`${API_BASE}/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadEvents();
    });
}

// Edit Gallery
async function editGallery(id) {
    const items = await fetch(`${API_BASE}/gallery-items`).then(r => r.json());
    const item = items.find(i => i.id === id);
    
    openModal('Edit Gallery Item', [
        { label: 'Type', name: 'type', value: item.type, type: 'select', options: ['image', 'video'] },
        { label: 'URL (Image or Video)', name: 'url', value: item.url, type: 'url' },
        { label: 'Caption', name: 'caption', value: item.caption || '', type: 'text' },
        { label: 'Order Index', name: 'orderIndex', value: item.orderIndex, type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/gallery-items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadGallery();
    });
}

// Modal Functions
function openModal(title, fields, onSubmit) {
    const modal = document.getElementById('itemModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalFields = document.getElementById('modalFields');
    const itemForm = document.getElementById('itemForm');
    
    modalTitle.textContent = title;
    
    modalFields.innerHTML = fields.map(field => {
        if (field.type === 'select') {
            return `
                <div class="form-group">
                    <label>${field.label}</label>
                    <select name="${field.name}">
                        ${field.options.map(opt => `<option value="${opt}" ${field.value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                </div>
            `;
        } else if (field.type === 'checkbox') {
            return `
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="${field.name}" ${field.value ? 'checked' : ''}>
                        ${field.label}
                    </label>
                </div>
            `;
        } else if (field.type === 'textarea') {
            return `
                <div class="form-group">
                    <label>${field.label}</label>
                    <textarea name="${field.name}" rows="4">${field.value}</textarea>
                </div>
            `;
        } else {
            return `
                <div class="form-group">
                    <label>${field.label}</label>
                    <input type="${field.type}" name="${field.name}" value="${field.value || ''}">
                </div>
            `;
        }
    }).join('');
    
    itemForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(itemForm);
        const data = Object.fromEntries(formData);
        data.isUpcoming = data.isUpcoming === 'on' ? 1 : 0;
        data.orderIndex = parseInt(data.orderIndex || 0);
        await onSubmit(data);
        modal.style.display = 'none';
    };
    
    modal.style.display = 'flex';
}

// Delete functions
async function deleteBackground(id) {
    if (confirm('Delete this background image?')) {
        await fetch(`${API_BASE}/background-images/${id}`, { method: 'DELETE' });
        loadBackground();
    }
}

async function deleteHero(id) {
    if (confirm('Delete this hero slide?')) {
        await fetch(`${API_BASE}/hero-slides/${id}`, { method: 'DELETE' });
        loadHero();
    }
}

async function deleteNews(id) {
    if (confirm('Delete this news post?')) {
        await fetch(`${API_BASE}/news-posts/${id}`, { method: 'DELETE' });
        loadNews();
    }
}

async function deleteStaff(id) {
    if (confirm('Delete this staff member?')) {
        await fetch(`${API_BASE}/staff-members/${id}`, { method: 'DELETE' });
        loadStaff();
    }
}

async function deleteEvent(id) {
    if (confirm('Delete this event?')) {
        await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
        loadEvents();
    }
}

async function deleteGallery(id) {
    if (confirm('Delete this gallery item?')) {
        await fetch(`${API_BASE}/gallery-items/${id}`, { method: 'DELETE' });
        loadGallery();
    }
}

async function deleteMessage(id) {
    if (confirm('Delete this message?')) {
        await fetch(`${API_BASE}/contact-messages/${id}`, { method: 'DELETE' });
        loadMessages();
    }
}

async function markRead(id) {
    await fetch(`${API_BASE}/contact-messages/${id}/read`, { method: 'PATCH' });
    loadMessages();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    // Setup navigation
    document.querySelectorAll('.nav-item:not(.logout)').forEach(btn => {
        btn.addEventListener('click', (e) => switchSection(e.target.dataset.section));
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Modal close
    const modal = document.getElementById('itemModal');
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebarNav.classList.toggle('active');
        });
    }
    
    document.querySelectorAll('.nav-item:not(.logout)').forEach(btn => {
        btn.addEventListener('click', (e) => {
    
            switchSection(e.target.dataset.section);
    
            document.querySelector('.sidebar-nav')
                .classList.remove('active');
        });
    });

    // ADD BACKGROUND
document.getElementById('addBgBtn')?.addEventListener('click', () => {
    openModal('Add Background Image', [
        { label: 'Image URL', name: 'url', type: 'url' },
        { label: 'Order Index', name: 'orderIndex', type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/background-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadBackground();
    });
});


// ADD HERO SLIDE
document.getElementById('addHeroBtn')?.addEventListener('click', () => {
    openModal('Add Hero Slide', [
        { label: 'Image URL', name: 'imageUrl', type: 'url' },
        { label: 'Caption', name: 'caption', type: 'text' },
        { label: 'Order Index', name: 'orderIndex', type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/hero-slides`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadHero();
    });
});


// ADD STAFF
document.getElementById('addStaffBtn')?.addEventListener('click', () => {
    openModal('Add Staff Member', [
        { label: 'Name', name: 'name', type: 'text' },
        { label: 'Position', name: 'position', type: 'text' },
        { label: 'Image URL', name: 'imageUrl', type: 'url' },
        { label: 'Order Index', name: 'orderIndex', type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/staff-members`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadStaff();
    });
});


// ADD NEWS
document.getElementById('addNewsBtn')?.addEventListener('click', () => {
    openModal('Add News Post', [
        { label: 'Title', name: 'title', type: 'text' },
        { label: 'Slug', name: 'slug', type: 'text' },
        { label: 'Preview Text', name: 'previewText', type: 'textarea' },
        { label: 'Content', name: 'content', type: 'textarea' },
        { label: 'Featured Image URL', name: 'featuredImage', type: 'url' }
    ], async (formData) => {
        await fetch(`${API_BASE}/news-posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadNews();
    });
});


// ADD EVENT
document.getElementById('addEventBtn')?.addEventListener('click', () => {
    openModal('Add Event', [
        { label: 'Title', name: 'title', type: 'text' },
        { label: 'Description', name: 'description', type: 'textarea' },
        { label: 'Event Date', name: 'eventDate', type: 'datetime-local' },
        { label: 'Image URL', name: 'imageUrl', type: 'url' }
    ], async (formData) => {
        await fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadEvents();
    });
});


// ADD GALLERY
document.getElementById('addGalleryBtn')?.addEventListener('click', () => {
    openModal('Add Gallery Item', [
        { label: 'Type', name: 'type', type: 'select', options: ['image', 'video'] },
        { label: 'URL', name: 'url', type: 'url' },
        { label: 'Caption', name: 'caption', type: 'text' },
        { label: 'Order Index', name: 'orderIndex', type: 'number' }
    ], async (formData) => {
        await fetch(`${API_BASE}/gallery-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        loadGallery();
    });
});


    loadOverview();
});
