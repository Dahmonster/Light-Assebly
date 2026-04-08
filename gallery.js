// Gallery Page Functionality

let galleryItems = [];
let currentLightboxIndex = 0;

async function loadGallery() {
    galleryItems = await Utils.fetchAPI('/gallery-items') || [];
    renderGallery();
    setupLightbox();
}

function renderGallery() {
    const grid = document.getElementById('galleryGrid');

    if (galleryItems.length === 0) {
        grid.innerHTML = '<p>No gallery items available</p>';
        return;
    }

    grid.innerHTML = galleryItems.map((item, index) => {
        const isVideo = item.type === 'video';
        return `
            <div class="gallery-item" data-index="${index}">
                ${isVideo ? 
    (item.url.includes("youtube.com") || item.url.includes("youtu.be") 
        ? `<iframe 
                class="gallery-item-video"
                src="${item.url.replace("watch?v=", "embed/")}" 
                frameborder="0"
                allowfullscreen>
           </iframe>`
        : `<video class="gallery-item-video" controls>
                <source src="${item.url}" type="video/mp4">
           </video>`
    )
    :
    `<img src="${item.url}" alt="${item.caption || 'Gallery item'}" class="gallery-item-image">`
}
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            currentLightboxIndex = parseInt(item.getAttribute('data-index'));
            openLightbox();
        });
    });
}

function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', prevLightbox);
    nextBtn.addEventListener('click', nextLightbox);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') prevLightbox();
            if (e.key === 'ArrowRight') nextLightbox();
            if (e.key === 'Escape') closeLightbox();
        }
    });
}

function openLightbox() {
    const item = galleryItems[currentLightboxIndex];
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    const lightbox = document.getElementById('lightbox');

    if (item.type === 'video') {
        image.style.display = 'none';
        // Create video element
        const video = document.createElement('video');
        video.src = item.url;
        video.controls = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '80vh';
        image.parentNode.replaceChild(video, image);
    } else {
        image.src = item.url;
        image.style.display = 'block';
    }

    caption.textContent = item.caption || '';
    lightbox.classList.add('active');
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('active');
}

function prevLightbox() {
    currentLightboxIndex = (currentLightboxIndex - 1 + galleryItems.length) % galleryItems.length;
    openLightbox();
}

function nextLightbox() {
    currentLightboxIndex = (currentLightboxIndex + 1) % galleryItems.length;
    openLightbox();
}

// Initialize Gallery Page
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
});
