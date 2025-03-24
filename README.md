# Photography Portfolio & Admin Panel

A modern photo and video showcase built with React, Tailwind, Dropbox, Supabase, and Vercel. Includes a private admin dashboard to manage clients, projects, and call history with secure login.

---

## 🧱 Tech Stack

- **Frontend**: React + Tailwind CSS (via Vite)
- **Hosting**: Vercel
- **Image Storage**: Dropbox
- **Structured Data**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase (email OTP)
- **Video Integration**: YouTube playlists via YouTube Data API

---

## 📁 Project Structure

```
├── src/
│   ├── components/            # UI and admin views
│   ├── hooks/                 # Reusable data hooks
│   ├── styles/                # Tailwind entry point
│   └── App.jsx / main.jsx     # App entry
├── api/                       # Serverless API routes
├── public/                    # Static assets
└── .env                       # Config secrets
```

---

## 🔌 Integration Setup

### 1. 🔒 Supabase

- Create a project at [supabase.com](https://supabase.com)
- Enable Email OTP Auth (Authentication > Providers > Email)
- Create the following tables:

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text,
  mobile text,
  facebook text,
  instagram text,
  telegram text,
  whatsapp text,
  notes text,
  created_at timestamp default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  title text,
  location text,
  date date,
  status text,
  notes text,
  client_ids uuid[],
  created_at timestamp default now()
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  date date,
  note text,
  created_at timestamp default now()
);
```

- Add [row-level security](https://supabase.com/docs/guides/auth/row-level-security) policies as needed.

- In Storage, create any buckets if using (e.g. backups).

- Set the following environment variables:

```
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

---

### 2. 📷 Dropbox

Used for all client and project photos.

- Create a [Dropbox app](https://www.dropbox.com/developers/apps)
- Choose: Scoped Access / Full Dropbox / App Folder
- Generate access token via refresh token (server-side)

Add these to `.env`:

```
DROPBOX_APP_KEY=...
DROPBOX_APP_SECRET=...
DROPBOX_REFRESH_TOKEN=...
```

Photos are uploaded via:
- `POST /api/upload-to-dropbox` with image and `path`
- Images fetched via `GET /api/dropbox-url?path=...`

Uploaded file structure:
```
__clients/{client_id}.jpg
__projects/{project_id}.jpg
```

#### Refreshing Dropbox Tokens

To refresh your Dropbox refresh token (only required if permissions change or tokens expire):

1. Go to your Dropbox App Console and ensure correct permissions (scopes) are set.
2. Generate a temporary Access Token on the App Console.
3. Run the PowerShell script from your project root:

```powershell
pnpm dotenv -e .env -- pwsh ./scripts/getRefreshToken.ps1
```

### 3. 📺 YouTube (optional)

Used to load playlists.

- Create a Google Cloud project
- Enable YouTube Data API v3
- Generate API key

Set in `.env`:

```
YOUTUBE_API_KEY=your-api-key
```

Define playlist mapping in Dropbox: `/playlists.yml`
```yml
playlists:
  behind_the_scenes: YOUR_YOUTUBE_PLAYLIST_ID
```

---

### 4. ▲ Deploying to Vercel

1. [Create a Vercel account](https://vercel.com)
2. Import the GitHub repository
3. Set **Environment Variables** in project settings:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `DROPBOX_APP_KEY`
    - `DROPBOX_APP_SECRET`
    - `DROPBOX_REFRESH_TOKEN`
    - `YOUTUBE_API_KEY` *(optional)*
    - Note: to add to vercel environment run `vercel env add <VARIABLE>` it will prompt you for value and env
4. Set **Build Command** to: `pnpm run build`
5. Set **Output Directory** to: `dist`
6. Set **Install Command** to: `pnpm install`
7. For API routes (like /api/upload-to-dropbox), ensure they’re in root `/api/` and Vercel picks them up automatically

After deploy, your site is live and serverless functions are handled by Vercel.

---

## 🚀 Running Locally

```bash
pnpm install
pnpm dev
```

Add your `.env` with Supabase, Dropbox, and YouTube settings.

---

## 🔐 Admin Access

- Navigate to `/admin/login`
- Enter your email
- Confirm via login link
- Admin routes are protected via `useAuth()`

---

## ✅ Features

- Responsive slideshow + gallery
- YouTube playlist viewer
- Admin dashboard with:
    - Client + project creation
    - Call history
    - Project filtering
    - Photo upload to Dropbox
    - Secure login + logout

---

## ✨ Coming Soon

- Export to CSV/PDF
- Tag support
- PWA mobile support
- Automatic backups
- Dropbox photo sync UI

---

Made with ❤️ by Dmitry Likane
