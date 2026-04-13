// News Page Functionality (FIXED + CLOUDINARY SAFE)

let allNews = [];

/***********************
 * LOAD NEWS LIST
 ***********************/
async function loadNews() {
    allNews = await Utils.fetchAPI('/news-posts') || [];
    renderNewsList();
    checkSlugParam();
}

/***********************
 * RENDER LIST
 ***********************/
function renderNewsList() {
    const listView = document.getElementById('newsListView');

    if (!listView) return;

    if (!allNews.length) {
        listView.innerHTML = '<p>No news articles available</p>';
        return;
    }

    listView.innerHTML = allNews.map(post => `
        <a href="?slug=${post.slug}" class="news-list-card">
            ${post.featuredImage
                ? `<img src="${post.featuredImage}" alt="${post.title}" class="news-list-image">`
                : ''
            }

            <div class="news-list-body">
                <div class="news-list-date">
                    ${post.createdAt ? Utils.formatDate(post.createdAt) : ''}
                </div>

                <h3 class="news-list-title">${post.title}</h3>

                <p class="news-list-excerpt">
                    ${post.previewText || ''}
                </p>

                <div class="news-list-link">Read More →</div>
            </div>
        </a>
    `).join('');
}

/***********************
 * RENDER SINGLE ARTICLE
 ***********************/
async function renderNewsDetail(slug) {
    const listView = document.getElementById('newsListView');
    const detailView = document.getElementById('newsDetailView');

    if (!detailView || !listView) return;

    // 🔥 FIX: if data not loaded yet, fetch again
    if (!allNews.length) {
        allNews = await Utils.fetchAPI('/news-posts') || [];
    }

    const article = allNews.find(n => n.slug === slug);

    if (!article) {
        detailView.innerHTML = '<p>Article not found</p>';
        return;
    }

    listView.style.display = 'none';
    detailView.style.display = 'block';

    detailView.innerHTML = `
        <a href="news.html" class="back-button">← Back to Sermons</a>

        <article class="news-article">

            ${article.featuredImage
                ? `<img src="${article.featuredImage}" alt="${article.title}" class="article-image">`
                : ''
            }

            <div class="article-content">

                <div class="article-meta">
                    <span class="article-date">
                        📅 ${article.createdAt ? Utils.formatDate(article.createdAt) : ''}
                    </span>
                </div>

                <h1 class="article-title">${article.title}</h1>

                <div class="article-body">
                    ${article.content || ''}
                </div>

                <div class="article-footer">
                    <a href="news.html" class="back-button">← Back to All Sermons</a>
                </div>

            </div>
        </article>
    `;

    window.scrollTo(0, 0);
}

/***********************
 * SLUG CHECK
 ***********************/
function checkSlugParam() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (slug) {
        renderNewsDetail(slug);
    }
}

/***********************
 * INIT
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
    loadNews();
});

window.addEventListener('popstate', () => {
    checkSlugParam();
});
