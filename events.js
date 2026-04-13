/***********************
 * EVENTS PAGE (CLOUDINARY READY)
 ***********************/

let events = [];

async function loadEvents() {
    try {
        events = await Utils.fetchAPI('/events') || [];

        // Safety: remove broken/null events
        events = events.filter(e => e && e.eventDate);

        // Sort by date (upcoming first)
        events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

        renderEvents();

    } catch (err) {
        console.error("Failed to load events:", err);
    }
}

function renderEvents() {
    const grid = document.getElementById('eventsGrid');

    if (!grid) return;

    if (!events.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No upcoming events at this time</p>
            </div>
        `;
        return;
    }

    const now = new Date();

    grid.innerHTML = events.map(event => {

        const eventDate = new Date(event.eventDate);
        const isUpcoming = eventDate >= now;

        return `
            <div class="event-card">

                ${event.imageUrl ? `
                    <img 
                        src="${event.imageUrl}" 
                        alt="${event.title}" 
                        class="event-image"
                    />
                ` : `
                    <div class="event-image-placeholder"></div>
                `}

                <div class="event-content">

                    <span class="event-badge ${isUpcoming ? '' : 'past'}">
                        ${isUpcoming ? 'Upcoming' : 'Past'}
                    </span>

                    <h3 class="event-title">
                        ${event.title || 'Untitled Event'}
                    </h3>

                    <div class="event-date">
                        📅 ${formatEventDate(event.eventDate)}
                    </div>

                    <p class="event-description">
                        ${event.description || "No description available"}
                    </p>

                    <div class="event-footer">
                        <span class="event-time">
                            🕒 ${formatEventTime(event.eventDate)}
                        </span>

                        <a href="contact.html" class="event-button">
                            Learn More
                        </a>
                    </div>

                </div>
            </div>
        `;
    }).join('');
}

/***********************
 * DATE FORMATTERS
 ***********************/
function formatEventDate(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatEventTime(dateString) {
    if (!dateString) return "";

    const date = new Date(dateString);

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/***********************
 * INIT
 ***********************/
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});
