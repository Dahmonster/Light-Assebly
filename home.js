// Home Page Specific Functionality

// Dynamic Background
let currentBgIndex = 0;
let backgroundImages = [];

async function setupDynamicBackground() {
    const bgElement = document.getElementById('dynamicBg');
    if (!bgElement) return;

    backgroundImages = await Utils.fetchAPI('/background-images') || [];
    
    if (backgroundImages.length === 0) {
        bgElement.style.backgroundImage = 'url(https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071)';
        return;
    }

    updateBackground();

    setInterval(() => {
        currentBgIndex = (currentBgIndex + 1) % backgroundImages.length;
        updateBackground();
    }, 5000);
}

function updateBackground() {
    const bgElement = document.getElementById('dynamicBg');
    if (backgroundImages[currentBgIndex]) {
        bgElement.style.backgroundImage = `url(${backgroundImages[currentBgIndex].url})`;
    }
}


// Hero Slider
let currentSlideIndex = 0;
let heroSlides = [];

async function setupHeroSlider() {
    heroSlides = await Utils.fetchAPI('/hero-slides') || [];
    
    if (heroSlides.length === 0) {
        document.getElementById('heroSlider').innerHTML = '<p>No slides available</p>';
        return;
    }

    renderHeroSlides();
    renderSliderDots();

    setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
        updateHeroSlider();
    }, 3000);

    document.getElementById('prevSlide')?.addEventListener('click', prevSlide);
    document.getElementById('nextSlide')?.addEventListener('click', nextSlide);
}

function renderHeroSlides() {
    const wrapper = document.getElementById('slidesWrapper');
    if (!wrapper) return;

    wrapper.innerHTML = heroSlides.map((slide) => `
        <div class="slide" style="background-image: url(${slide.imageUrl});">
            <div class="slide-caption">${slide.caption || ''}</div>
        </div>
    `).join('');
}

function renderSliderDots() {
    const dots = document.getElementById('sliderDots');
    if (!dots) return;

    dots.innerHTML = heroSlides.map((_, index) => `
        <div class="slider-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');

    document.querySelectorAll('.slider-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            currentSlideIndex = parseInt(dot.getAttribute('data-index'));
            updateHeroSlider();
        });
    });
}

function updateHeroSlider() {
    const wrapper = document.getElementById('slidesWrapper');
    if (!wrapper) return;

    const offset = currentSlideIndex * -100;
    wrapper.style.transform = `translateX(${offset}%)`;

    document.querySelectorAll('.slider-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex);
    });
}

function prevSlide() {
    currentSlideIndex = (currentSlideIndex - 1 + heroSlides.length) % heroSlides.length;
    updateHeroSlider();
}

function nextSlide() {
    currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
    updateHeroSlider();
}

document.querySelectorAll('.director-card').forEach(card => {
    card.addEventListener('click', () => {
        card.classList.toggle('toggled');
    });
});

// Staff Slider
async function setupStaffSlider() {
    const staffData = await Utils.fetchAPI('/staff-members') || [];
    const slider = document.getElementById('staffSlider');

    if (!slider) return;

    if (staffData.length === 0) {
        slider.innerHTML = '<p>No staff members available</p>';
        return;
    }

    slider.innerHTML = staffData.map(staff => `
        <div class="staff-card">
            <img src="${staff.imageUrl}" alt="${staff.name}" class="staff-image">
            <div class="staff-info">
                <div class="staff-name">${staff.name}</div>
                <div class="staff-position">${staff.position}</div>
            </div>
        </div>
    `).join('');

    startStaffAutoScroll();
}

function startStaffAutoScroll() {
    const slider = document.getElementById('staffSlider');
    if (!slider) return;

    setInterval(() => {
        slider.scrollBy({ left: 250, behavior: "smooth" });

        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
            slider.scrollTo({ left: 0, behavior: "smooth" });
        }

    }, 3000);
}


// ✅ FIXED NEWS SECTION
async function setupNewsSection() {
    try {
        const newsData = await Utils.fetchAPI('/news') || [];
        const latestNews = newsData.slice(0, 3);
        const grid = document.getElementById('newsGrid');

        if (!grid) return;

        if (latestNews.length === 0) {
            grid.innerHTML = '<p>No news available</p>';
            return;
        }

        grid.innerHTML = latestNews.map(post => `
            <a href="news.html?slug=${post.slug}" class="news-card">

                ${post.imageUrl
                    ? `<img src="${post.imageUrl}" alt="${post.title}" class="news-image">`
                    : ''
                }

                <div class="news-body">

                    <div class="news-date">
                        📅 ${post.createdAt ? Utils.formatDate(post.createdAt) : ''}
                    </div>

                    <h3 class="news-title">${post.title}</h3>

                    <p class="news-excerpt">
                        ${post.preview || ''}
                    </p>

                    <div class="news-link">Read Article →</div>

                </div>
            </a>
        `).join('');

    } catch (err) {
        console.error("News load error:", err);
    }
}


// INIT
document.addEventListener('DOMContentLoaded', () => {
    setupDynamicBackground();
    setupHeroSlider();
    setupStaffSlider();
    setupNewsSection();
});
