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
        document.getElementById('newsListView').innerHTML =
            '<p>Failed to load news</p>';
    }
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
 * RENDER SINGLE ARTICLE
 ***********************/
function renderNewsDetail(slug) {
    const listView = document.getElementById('newsListView');
    const detailView = document.getElementById('newsDetailView');

    if (!detailView || !listView) return;

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
