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

    // Set initial background
    updateBackground();

    // Change background every 5 seconds
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

    // Auto-advance slides every 3 seconds
    setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % heroSlides.length;
        updateHeroSlider();
    }, 3000);

    // Manual navigation
    document.getElementById('prevSlide').addEventListener('click', prevSlide);
    document.getElementById('nextSlide').addEventListener('click', nextSlide);
}

function renderHeroSlides() {
    const wrapper = document.getElementById('slidesWrapper');
    wrapper.innerHTML = heroSlides.map((slide, index) => `
        <div class="slide" style="background-image: url(${slide.imageUrl});">
            <div class="slide-caption">${slide.caption || ''}</div>
        </div>
    `).join('');
}

function renderSliderDots() {
    const dots = document.getElementById('sliderDots');
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
    const offset = currentSlideIndex * -100;
    wrapper.style.transform = `translateX(${offset}%)`;

    // Update active dot
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

// Director Card
async function setupDirectorCard() {
    const section = document.getElementById('directorSection');
    const director = await Utils.fetchAPI('/director-message');

    if (!director) {
        section.innerHTML = '<p>Director information not available</p>';
        return;
    }

    let isToggled = false;

    section.innerHTML = `
        <div class="director-container">
            <div class="director-card" id="directorCard">
                <div class="director-side director-text-side">
                    <h2 id="directorTitle">${director.title}</h2>
                    <p id="directorMessage">${director.message}</p>
                </div>
                <div class="director-side director-image-side" style="background-image: url(${director.imageUrl});">
                    <div class="director-colored-side">
                        <span id="directorAltText">MESSAGE FROM THE SENIOR PASTOR</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const card = document.getElementById('directorCard');
    card.addEventListener('click', () => {
        isToggled = !isToggled;
        card.classList.toggle('toggled');
    });
}

// Staff Slider
async function setupStaffSlider() {
    const staffData = await Utils.fetchAPI('/staff-members') || [];
    const slider = document.getElementById('staffSlider');

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

    startStaffAutoScroll()
}

function startStaffAutoScroll() {
    const slider = document.getElementById('staffSlider');

    setInterval(() => {

        slider.scrollBy({
            left: 250,
            behavior: "smooth"
        });

        // restart when reaching the end
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
            slider.scrollTo({
                left: 0,
                behavior: "smooth"
            });
        }

    }, 3000);
}


// News Section
async function setupNewsSection() {
    const newsData = await Utils.fetchAPI('/news-posts') || [];
    const latestNews = newsData.slice(0, 3);
    const grid = document.getElementById('newsGrid');

    if (latestNews.length === 0) {
        grid.innerHTML = '<p>No news available</p>';
        return;
    }

    grid.innerHTML = latestNews.map(post => `
        <a href="news.html?slug=${post.slug}" class="news-card">
            ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="news-image">` : ''}
            <div class="news-body">
                <div class="news-date">
                    📅 ${Utils.formatDate(post.createdAt)}
                </div>
                <h3 class="news-title">${post.title}</h3>
                <p class="news-excerpt">${post.previewText}</p>
                <div class="news-link">Read Article →</div>
            </div>
        </a>
    `).join('');
}

// Initialize Home Page
document.addEventListener('DOMContentLoaded', () => {
    setupDynamicBackground();
    setupHeroSlider();
    setupDirectorCard();
    setupStaffSlider();
    setupNewsSection();
});
