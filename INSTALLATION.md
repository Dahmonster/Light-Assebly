# Installation & Setup Guide

## Project Structure

```
Az/
├── index.html, news.html, gallery.html, events.html, contact.html
├── admin/
│   ├── login.html      - Admin login page
│   └── dashboard.html  - Admin dashboard
├── css/
│   ├── common.css, home.css, news.css, gallery.css, events.css, contact.css
│   ├── admin-login.css
│   └── admin-dashboard.css
├── js/
│   ├── common.js, home.js, news.js, gallery.js, events.js, contact.js
│   ├── admin-login.js
│   └── admin-dashboard.js
├── server/
│   └── index.js        - Express server (SQLite backend)
├── package.json
└── school.db           - SQLite database (auto-created)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd Az
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Access the Website

- **Public Website**: Open `index.html` in your browser (or serve via a web server)
- **Admin Panel**: Go to `admin/login.html`
  - Username: `admin`
  - Password: `admin`

## Features

### Public Website
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Home page with hero slider, director card, staff carousel
- ✅ News page with article listings and detail views
- ✅ Gallery with lightbox viewer
- ✅ Events listing
- ✅ Contact form
- ✅ Dynamic background rotation

### Admin Dashboard
- ✅ Secure login (session-based)
- ✅ Manage background images
- ✅ Manage hero slides with captions
- ✅ Edit director message
- ✅ Manage staff members
- ✅ Create/edit/delete news posts
- ✅ Manage events
- ✅ Upload gallery items
- ✅ View & respond to contact messages
- ✅ Site settings

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (username/password)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Content Management
- `GET/POST /api/background-images`
- `GET/POST/PUT/DELETE /api/hero-slides/:id`
- `GET/PUT /api/director-message`
- `GET/POST/PUT/DELETE /api/staff-members/:id`
- `GET/POST/PUT/DELETE /api/news-posts/:id`
- `GET/POST/PUT/DELETE /api/events/:id`
- `GET/POST/PUT/DELETE /api/gallery-items/:id`
- `GET/POST/PATCH/DELETE /api/contact-messages/:id`
- `GET/PUT /api/site-settings/:key`

## Database

The server uses SQLite (`better-sqlite3`) with auto-initialization:
- Database file: `school.db`
- Tables: 8 (background_images, hero_slides, director_message, staff_members, news_posts, events, gallery_items, contact_messages, site_settings)
- Initial data: Automatically seeded on first run

## Deployment

### To Deploy Frontend (Static)
1. Copy HTML, CSS, and JS files to your web server
2. Update `API_BASE` in JS files to point to your server
3. Serve via HTTP/HTTPS

### To Deploy Backend
1. Install Node.js on your server
2. Copy the `server/` folder and `package.json`
3. Run `npm install` and `npm start`
4. Configure environment variables if needed
5. Use a process manager (PM2, systemd, etc.) to keep it running

## Customization

### Change API URL
Edit the `API_BASE` constant in:
- `js/common.js`
- `js/admin-login.js`
- `js/admin-dashboard.js`

### Change Colors
Edit CSS variables in `css/admin-login.css` and `css/admin-dashboard.css`

### Add New Features
1. Create new API endpoints in `server/index.js`
2. Create new HTML pages in `Az/`
3. Create CSS files in `css/`
4. Create JS files in `js/` (with API calls)

## Troubleshooting

### Server won't start
- Check if port 5000 is in use
- Ensure Node.js is installed
- Check for errors in `server/index.js`

### API calls failing
- Verify server is running on `http://localhost:5000`
- Check CORS is enabled in server
- Verify API endpoints exist

### Database issues
- Delete `school.db` to reset database
- Server will recreate it on next start
- Check database permissions in file system

## Support

For issues or questions, check:
1. Browser console for JavaScript errors
2. Server terminal for API errors
3. Network tab in browser DevTools for API responses

---

**Version 1.0.0**
Last updated: March 2026
