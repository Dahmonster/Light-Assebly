// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Common Utilities
const Utils = {
    async fetchAPI(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    slugToUrl(slug) {
        return `news.html?slug=${slug}`;
    }
};

// Header Setup
function setupHeader() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu on link click
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (href === 'index.html' && currentPage === '')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Footer Setup
async function setupFooter() {
    const footerEl = document.getElementById('footer');
    if (!footerEl) return;

    const year = new Date().getFullYear();
    const footerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h3>LIGHT ASSEMBLY INTERNATIONAL MINISTRY</h3>
                <p>Bringing you back to God’s original plan.</p>
            </div>
            
            <div class="footer-section">
                <h4 style="font-family: var(--font-display); margin-bottom: 1rem; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 0.5rem;">Quick Links</h4>
                <div class="footer-links">
                    <a href="index.html">Home</a>
                    <a href="news.html">Sermons</a>
                    <a href="gallery.html">Gallery</a>
                    <a href="events.html">Events</a>
                    <a href="contact.html">Contact</a>
                </div>
            </div>

            <div class="footer-section">
                <h4 style="font-family: var(--font-display); margin-bottom: 1rem; border-bottom: 2px solid rgba(255,255,255,0.2); padding-bottom: 0.5rem;">Follow Us</h4>
                <div class="social-links">
                    <a href="#" class="social-icon" title="Facebook">f</a>
                    <a href="#" class="social-icon" title="Twitter">𝕏</a>
                    <a href="#" class="social-icon" title="Instagram">📷</a>
                    <a href="#" class="social-icon" title="YouTube">▶</a>
                </div>
            </div>
        </div>
        
        <div class="footer-bottom">
            <p>&copy; ${year} Light Assembly International Ministry. All rights reserved.</p>
        </div>
    `;

    footerEl.innerHTML = footerHTML;
}

// Initialize common elements
document.addEventListener('DOMContentLoaded', () => {
    setupHeader();
    setupFooter();
});
