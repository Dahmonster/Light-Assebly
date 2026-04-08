// Events Page Functionality

let events = [];

async function loadEvents() {
    events = await Utils.fetchAPI('/events') || [];
    // Sort by event date
    events.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
    renderEvents();
}

function renderEvents() {
    const grid = document.getElementById('eventsGrid');

    if (events.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No upcoming events at this time</p></div>';
        return;
    }

    grid.innerHTML = events.map(event => {
        const eventDate = new Date(event.eventDate);
        const isUpcoming = eventDate > new Date();

        return `
            <div class="event-card">
                ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title}" class="event-image">` : ''}
                <div class="event-content">
                    ${event.isUpcoming ? '<span class="event-badge">Upcoming</span>' : ''}
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-date">
                        📅 ${formatEventDate(event.eventDate)}
                    </div>
                    <p class="event-description">${event.description}</p>
                    <div class="event-footer">
                        <span class="event-time">${formatEventTime(event.eventDate)}</span>
                        <button class="event-button"><a href="contact.html" id="learn">Learn More</a></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatEventDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatEventTime(dateString) {
    const date = new Date(dateString);
    const options = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleTimeString('en-US', options);
}

// Initialize Events Page
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});
