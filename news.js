// News Page Functionality

let allNews = [];

async function loadNews() {
    allNews = await Utils.fetchAPI('/news-posts') || [];
    renderNewsList();
}

function renderNewsList() {
    const listView = document.getElementById('newsListView');
    
    if (allNews.length === 0) {
        listView.innerHTML = '<p>No news articles available</p>';
        return;
    }

    listView.innerHTML = allNews.map(post => `
        <a href="?slug=${post.slug}" class="news-list-card">
            ${post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="news-list-image">` : ''}
            <div class="news-list-body">
                <div class="news-list-date">${Utils.formatDate(post.createdAt)}</div>
                <h3 class="news-list-title">${post.title}</h3>
                <p class="news-list-excerpt">${post.previewText}</p>
                <div class="news-list-link">Read More →</div>
            </div>
        </a>
    `).join('');
}

async function renderNewsDetail(slug) {
    const article = allNews.find(n => n.slug === slug);
    
    if (!article) {
        document.getElementById('newsDetailView').innerHTML = '<p>Article not found</p>';
        return;
    }

    document.getElementById('newsListView').style.display = 'none';
    const detailView = document.getElementById('newsDetailView');
    detailView.style.display = 'block';

    detailView.innerHTML = `
        <a href="news.html" class="back-button">← Back to Sermons</a>
        <article class="news-article">
            ${article.featuredImage ? `<img src="${article.featuredImage}" alt="${article.title}" class="article-image">` : ''}
            <div class="article-content">
                <div class="article-meta">
                    <span class="article-date">📅 ${Utils.formatDate(article.createdAt)}</span>
                </div>
                <h1 class="article-title">${article.title}</h1>
                <div class="article-body">${article.content}</div>
                <div class="article-footer">
                    <a href="news.html" class="back-button">← Back to All Sermons</a>
                </div>
            </div>
        </article>
    `;

    window.scrollTo(0, 0);
}

// Check for slug parameter
function checkSlugParam() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (slug && allNews.length > 0) {
        renderNewsDetail(slug);
    }
}

// Initialize News Page
document.addEventListener('DOMContentLoaded', () => {
    loadNews().then(() => {
        checkSlugParam();
    });
});

// Monitor URL changes
window.addEventListener('popstate', () => {
    checkSlugParam();
});
