let allNews = [];

/***********************
 * LOAD NEWS LIST
 ***********************/
async function loadNews() {
    try {
        allNews = await fetch('https://light-assembly.onrender.com/api/news')
            .then(res => res.json());

        renderNewsList();
        checkSlugParam();

    } catch (err) {
        console.error(err);
        const el = document.getElementById('newsListView');
        if (el) el.innerHTML = '<p>Failed to load news</p>';
    }
}


/***********************
 * HANDLE CLICK (FIX)
 ***********************/
function handleNewsClick(e, slug) {
    e.preventDefault();

    // update URL without reload
    window.history.pushState({}, "", `?slug=${slug}`);

    // render article
    renderNewsDetail(slug);
}


/***********************
 * RENDER LIST (FIXED)
 ***********************/
function renderNewsList() {
    const listView = document.getElementById('newsListView');

    if (!listView) return;

    if (!allNews.length) {
        listView.innerHTML = '<p>No news articles available</p>';
        return;
    }

    listView.innerHTML = allNews.map(post => `
        <a href="?slug=${post.slug}" 
           class="news-list-card" 
           onclick="handleNewsClick(event, '${post.slug}')">

            ${post.imageUrl
                ? `<img src="${post.imageUrl}" class="news-list-image">`
                : ''
            }

            <div class="news-list-body">

                <h3 class="news-list-title">${post.title}</h3>

                <p class="news-list-excerpt">
                    ${post.preview || ''}
                </p>

                <div class="news-list-link">Read More →</div>
            </div>
        </a>
    `).join('');
}


/***********************
 * RENDER SINGLE ARTICLE (FIXED)
 ***********************/
async function renderNewsDetail(slug) {
    const listView = document.getElementById('newsListView');
    const detailView = document.getElementById('newsDetailView');

    if (!detailView || !listView) return;

    // ensure data exists (important for refresh/direct link)
    if (!allNews.length) {
        allNews = await fetch('https://light-assembly.onrender.com/api/news')
            .then(res => res.json());
    }

    const article = allNews.find(n => n.slug === slug);

    if (!article) {
        detailView.innerHTML = '<p>Article not found</p>';
        return;
    }

    listView.style.display = 'none';
    detailView.style.display = 'block';

    detailView.innerHTML = `
        <a href="news.html">← Back</a>

        <article>

            ${article.imageUrl
                ? `<img src="${article.imageUrl}" class="article-image">`
                : ''
            }

            <h1>${article.title}</h1>

            <div>
                ${article.content || ''}
            </div>

        </article>
    `;

    // scroll to top
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
document.addEventListener('DOMContentLoaded', loadNews);

window.addEventListener('popstate', checkSlugParam);
