let galleryItems = [];
let currentLightboxIndex = 0;

async function loadGallery() {
    galleryItems = await Utils.fetchAPI('/gallery-items') || [];
    renderGallery();
    setupLightbox();
}

/***********************
 * RENDER GALLERY
 ***********************/
function renderGallery() {
    const grid = document.getElementById('galleryGrid');

    if (!grid) return;

    if (galleryItems.length === 0) {
        grid.innerHTML = '<p>No gallery items available</p>';
        return;
    }

    grid.innerHTML = galleryItems.map((item, index) => {
        const isVideo = item.type === 'video';

        return `
    <div class="gallery-item" data-index="${index}">
        ${isVideo ? `
            <img 
  src="https://img.youtube.com/vi/${convertYouTube(item.url)?.split('/embed/')[1]}/hqdefault.jpg" 
  class="gallery-item-image"
/>
        ` : `
            <img src="${item.url}" alt="${item.caption || 'Gallery item'}" class="gallery-item-image">
        `}

        <div class="gallery-item-caption">
            ${item.caption || ''}
        </div>
    </div>
`;
    }).join('');

    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            currentLightboxIndex = Number(item.dataset.index);
            openLightbox();
        });
    });
}

/***********************
 * LIGHTBOX SETUP
 ***********************/
function setupLightbox() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', prevLightbox);
    nextBtn?.addEventListener('click', nextLightbox);

    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'ArrowLeft') prevLightbox();
        if (e.key === 'ArrowRight') nextLightbox();
        if (e.key === 'Escape') closeLightbox();
    });
}

/***********************
 * OPEN LIGHTBOX (FIXED)
 ***********************/
function openLightbox() {
    const item = galleryItems[currentLightboxIndex];
    const lightbox = document.getElementById('lightbox');
    const container = document.getElementById('lightboxMedia');
    const caption = document.getElementById('lightboxCaption');

    if (!item || !container) return;

    // CLEAR previous media (VERY IMPORTANT FIX)
    container.innerHTML = '';

    let mediaEl;

     if (item.type === 'video') {

    if (item.url.includes("youtube.com") || item.url.includes("youtu.be")) {

        const embedUrl = convertYouTube(item.url);

        mediaEl = document.createElement('iframe');
        mediaEl.src = embedUrl;
        mediaEl.width = "100%";
        mediaEl.height = "100%";
        mediaEl.style.maxHeight = "80vh";
        mediaEl.frameBorder = "0";
        mediaEl.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        mediaEl.allowFullscreen = true;

    } else {

        // Local or Cloudinary video
        mediaEl = document.createElement('video');
        mediaEl.src = item.url;
        mediaEl.controls = true;
        mediaEl.style.maxWidth = "100%";
        mediaEl.style.maxHeight = "80vh";
    }

} else {

    // Image
    mediaEl = document.createElement('img');
    mediaEl.src = item.url;
    mediaEl.style.maxWidth = "100%";
    mediaEl.style.maxHeight = "80vh";
}

    container.appendChild(mediaEl);
    caption.textContent = item.caption || '';

    lightbox.style.display = "flex";
    lightbox.classList.add('active');
}

/***********************
 * CLOSE LIGHTBOX (FIXED)
 ***********************/
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const container = document.getElementById('lightboxMedia');

    lightbox.classList.remove('active');
        lightbox.style.display = "none";

    // STOP video/audio properly
    if (container) container.innerHTML = '';
}

/***********************
 * NAVIGATION
 ***********************/
function prevLightbox() {
    currentLightboxIndex =
        (currentLightboxIndex - 1 + galleryItems.length) % galleryItems.length;

    openLightbox();
}

function nextLightbox() {
    currentLightboxIndex =
        (currentLightboxIndex + 1) % galleryItems.length;

    openLightbox();
}

/***********************
 * YOUTUBE FIX (ROBUST)
 ***********************/
function convertYouTube(url) {
    if (!url) return "";

    if (url.includes("youtube.com/embed")) {
        return url;
    }

    let videoId = "";

    if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    }

    else if (url.includes("watch?v=")) {
        videoId = url.split("watch?v=")[1].split("&")[0];
    }

    return videoId 
        ? `https://www.youtube.com/embed/${videoId}` 
        : "";
}

/***********************
 * INIT
 ***********************/
document.addEventListener('DOMContentLoaded', loadGallery);
