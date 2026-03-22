# Admin Portal (Next.js)

Admin-only frontend for the Patent IPR backend, built with Next.js.

## Features

- Admin login via `/api/auth/login`
- Create agents via `/api/admin/create-agent`
- Create clients via `/api/admin/create-client`
- View all users via `/api/admin/users`
- Delete user via `/api/admin/user/:id`
- Assign patent to agent via `/api/admin/assign-patent`

## Default Backend URL

- `/backend` (Next.js rewrite proxy)
- The proxy forwards to `https://patent-ipr-backend-express.onrender.com`
- This avoids browser CORS issues that can show as `Failed to fetch`.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Easy Vercel Deploy

1. Import this `admin-portal` folder as a Vercel project.
2. Framework preset: `Next.js`.
3. Build command: `npm run build`.
4. Output directory: leave default (Next.js managed).
