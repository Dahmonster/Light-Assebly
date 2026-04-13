// Events Page Functionality (CLOUDINARY READY FIXED)

let events = [];

async function loadEvents() {
    events = await Utils.fetchAPI('/events') || [];

    // Sort by date (upcoming first)
    events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    renderEvents();
}

function renderEvents() {
    const grid = document.getElementById('eventsGrid');

    if (!events.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No upcoming events at this time</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = events.map(event => {

        const eventDate = new Date(event.eventDate);
        const now = new Date();
        const isUpcoming = eventDate >= now;

        return `
            <div class="event-card">

                ${event.imageUrl
                    ? `<img src="${event.imageUrl}" alt="${event.title}" class="event-image">`
                    : `<div class="event-image-placeholder"></div>`
                }

                <div class="event-content">

                    ${isUpcoming
                        ? `<span class="event-badge">Upcoming</span>`
                        : `<span class="event-badge past">Past</span>`
                    }

                    <h3 class="event-title">${event.title}</h3>

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
    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatEventTime(dateString) {
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
