# 💍 Wedding Photo Gallery Web Application

A modern, responsive full-stack wedding photo gallery platform built with **React (Vite) + Tailwind CSS** on the frontend, and **Node.js / Express** on the backend, integrated with **Supabase (PostgreSQL)** for event metadata and lead capture, and **Google Drive API v3** for storing and streaming high-resolution wedding photography.

---

## 🌟 Key Architecture & Highlights

- **Frontend (`client/`)**:
  - React 18 + Vite with fast HMR.
  - Mobile-first, fully responsive design powered by **Tailwind CSS**.
  - Editorial luxury typography featuring Google Fonts (*Playfair Display* & *Inter*).
  - Categorized photo exploration ("Getting Ready", "Ceremony", "Portraits", "Reception").
  - Aspect ratio preservation, lazy loading, and loading shimmers.
  - Lightbox modal for full preview.
  - **Studio Admin Panel (`/admin`)**:
    - Protected by a 6-digit security PIN (`VITE_ADMIN_PIN`, default `252006`).
    - Event Creation Form verifying Google Drive permissions in real-time via API v3.
    - Generates unique client slugs (e.g., `ananya-karthik-9x7k2p`) and instant private shareable URLs (`${origin}/e/<slug>`).
    - Detected category folders badges.
    - Event management list with live lead counts, view leads modal (Name & Email), and delete action.
  - **Lead Generation Modal**: Collects visitor contact details before downloading high-res photos or albums.
  - Live **Health Badge** showing real-time connectivity to backend, Supabase DB, Google Drive, and in-memory cache statistics.

- **Backend (`server/`)**:
  - Express REST API with modular routing (`/api/events`, `/api/photos`, `/api/leads`, `/api/health`, `/api/admin`).
  - **Studio Admin Routes (`server/routes/admin.js`) mounted on `server/index.js` & `server/server.js`**:
    - `POST /api/admin/events`: Verifies Drive folder accessibility, detects child categories, generates slug, and inserts into Supabase.
    - `GET /api/admin/events`: Lists events ordered by `created_at` desc with aggregated `lead_count`.
    - `GET /api/admin/events/:slug/leads`: Lists all captured guest download leads for an event.
    - `DELETE /api/admin/events/:id`: Deletes event (with automatic cascade delete of leads).
  - **Google Drive Utility (`server/utils/drive.js`)**:
    - URL & Folder ID parsing from all standard Drive URLs (`/folders/`, `/u/0/folders/`, `?id=`, `/file/d/`, or raw ID).
    - Child folder category queries (`mimeType = 'application/vnd.google-apps.folder'`, `trashed = false`).
    - Paginated image queries (`mimeType contains 'image/'`, `trashed = false`) with `pageSize` and `pageToken` support.
    - Automatic high-resolution thumbnail resolution (`=s1600`).
    - Granular error translation for private/unshared folders (`403 FOLDER_ACCESS_DENIED`), missing folders (`404 FOLDER_NOT_FOUND`), rate limits (`429 RATE_LIMIT_EXCEEDED`), and bad inputs (`400 INVALID_FOLDER_ID`).
  - **In-Memory TTL Caching (`server/utils/cache.js`)**:
    - Low-latency, short-lived in-memory caching with configurable TTL (default 300s / 5 mins).
    - Prevents Google Drive API quota exhaustion.
    - Supports manual cache bypass (`?refresh=true`).
  - **Supabase Integration (`server/config/supabase.js`)**:
    - Fast lookup of wedding events by unique URL slug.
    - Storing download leads with schema validation.

- **Database (`schema.sql`)**:
  - PostgreSQL schema for Supabase with `events` and `download_leads` tables.
  - Indexes on slug, email, and created dates.
  - Row Level Security (RLS) policies configured following Supabase best practices.
  - Sample seed data for immediate demonstration.

---

## 📁 Directory Structure

```
photo_website/
├── schema.sql                     # Supabase PostgreSQL database schema migration
├── package.json                   # Root orchestrator scripts
├── .gitignore                     # Git ignore rules for node_modules, envs, builds
├── README.md                      # Comprehensive documentation
├── server/                        # Express API Backend
│   ├── .env.example               # Server environment variable template
│   ├── package.json               # Server dependencies (express, googleapis, @supabase/supabase-js)
│   ├── server.js                  # Express application setup & middleware
│   ├── config/
│   │   ├── supabase.js            # Supabase client initialization
│   │   └── googleDrive.js         # Google Drive API v3 client & authentication
│   ├── routes/
│   │   ├── health.js              # /api/health endpoint
│   │   ├── events.js              # /api/events routes (slug lookup & categories)
│   │   ├── photos.js              # /api/photos routes (paginated Drive images)
│   │   └── leads.js               # /api/leads routes (lead capture)
│   ├── utils/
│   │   ├── cache.js               # In-memory TTL cache with pruning & stats
│   │   └── drive.js               # Google Drive v3 extraction, query & error handling
│   └── tests/
│       └── drive-and-cache.test.js # Unit test suite for Drive utilities & TTL cache
└── client/                        # React + Vite + Tailwind CSS Frontend
    ├── .env.example               # Client environment variable template
    ├── index.html                 # HTML template with Google Fonts
    ├── package.json               # Client dependencies (react, lucide-react, tailwindcss)
    ├── vite.config.js             # Vite configuration with proxy to server
    ├── tailwind.config.js         # Tailwind typography, theme & luxury color palette
    ├── postcss.config.js          # PostCSS configuration
    └── src/
        ├── main.jsx               # React entry point
        ├── App.jsx                # Main gallery application orchestrator
        ├── index.css              # Tailwind directives & global styling
        ├── services/
        │   └── api.js             # API service for events, photos, leads, health
        └── components/
            ├── Navbar.jsx         # Header brand, download CTA & health badge
            ├── HeroBanner.jsx     # Wedding couple header & venue details
            ├── CategoryFilter.jsx # Responsive horizontal category pills & cache refresh
            ├── PhotoCard.jsx      # Image card with loading skeleton, hover actions & size
            ├── PhotoGrid.jsx      # Responsive grid (mobile 1-col, tablet 2-col, desktop 3-col) & lightbox
            ├── DownloadLeadModal.jsx # Lead capture dialog before downloading
            └── HealthBadge.jsx    # Real-time backend & service connection status
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20/v22/v26)
- **npm** or **pnpm**
- A **Supabase** account (Free tier)
- A **Google Cloud Platform (GCP)** project with Google Drive API v3 enabled

---

### 2. Setup the Database (Supabase)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. In the left navigation, click on **SQL Editor**.
3. Copy the entire contents of [`schema.sql`](file:///d:/photo_website/schema.sql) and paste into the SQL Editor.
4. Click **Run**. This will:
   - Enable `pgcrypto` for UUID generation.
   - Create the `events` table.
   - Create the `download_leads` table with cascade delete foreign keys.
   - Set up Row Level Security (RLS) policies.
   - Insert sample seed events (`elena-and-lucas-2026`).

---

### 3. Setup Google Drive API v3

You can authenticate with Google Drive in one of two ways:

#### Option A: Google Cloud API Key (Simplest)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Drive API**.
3. Under **APIs & Services > Credentials**, click **Create Credentials > API Key**.
4. Set `GOOGLE_DRIVE_API_KEY` in `server/.env`.
5. In Google Drive, ensure the wedding folder's sharing setting is set to:
   - **General Access**: *"Anyone with the link can view"*

#### Option B: Google Cloud Service Account (Recommended for Private Folders)
1. In Google Cloud Console, navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > Service Account**.
3. Create a JSON key for the service account and save it (e.g., `server/service-account.json`).
4. Set `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json` in `server/.env`.
5. In Google Drive, share your wedding photo folder with the Service Account email (e.g., `wedding-gallery@your-project.iam.gserviceaccount.com`).

---

### 4. Configure Environment Variables

#### Server Configuration (`server/.env`):
```bash
cp server/.env.example server/.env
```
Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Drive API
GOOGLE_DRIVE_API_KEY=AIzaSy...

# In-Memory Cache TTL (in seconds)
CACHE_TTL_SECONDS=300
```

#### Client Configuration (`client/.env`):
```bash
cp client/.env.example client/.env
```
Edit `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEFAULT_EVENT_SLUG=elena-and-lucas-2026
```

---

### 5. Install Dependencies & Run

#### Run Server:
```bash
cd server
npm install
npm run dev
```
The server will start at `http://localhost:5000`. Test the health route:
```bash
curl http://localhost:5000/api/health
```

#### Run Client:
```bash
cd client
npm install
npm run dev
```
The client will start at `http://localhost:5173`. Open in your browser.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, uptime, memory, and cache stats |
| `GET` | `/api/events` | List all available wedding events |
| `GET` | `/api/events/:slug` | Get event metadata and Google Drive child folder categories |
| `POST` | `/api/events` | Create a new wedding event with Drive folder URL / ID |
| `GET` | `/api/photos` | Fetch photos inside category (`?categoryId=...&pageSize=24&pageToken=...`) |
| `POST` | `/api/leads` | Capture guest download lead (`{ event_slug, visitor_name, visitor_email }`) |
| `POST` | `/api/admin/events` | Admin: Verify Google Drive folder, detect categories, generate unique slug, & insert event |
| `GET` | `/api/admin/events` | Admin: List all events with download lead counts (`lead_count`) |
| `GET` | `/api/admin/events/:slug/leads` | Admin: Retrieve visitor name, email, and timestamp for event |
| `DELETE` | `/api/admin/events/:id` | Admin: Delete event by UUID (cascades download leads) |

---

## 🧪 Running Automated Tests

Run the built-in Node.js test suite for Google Drive URL extraction, error mapping, and TTL caching:
```bash
cd server
npm test
```
