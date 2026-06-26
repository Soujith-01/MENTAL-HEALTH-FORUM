# Mental Health Forum — Local Run Instructions

This project has two parts: `Backend` (Express + MongoDB) and `Frontend` (Vite + React).

## Prerequisites
- Node.js (>=16)
- npm
- MongoDB running locally or a MongoDB URI

## Backend (local)
1. Copy example env and set values:

```bash
cd Backend
cp .env.example .env
# Edit .env and set DB_URL to your MongoDB URI
```

2. Install and start backend:

```bash
npm install
npm run dev   # uses nodemon, listens on PORT (default 3000)
# or: npm start for node server.js
```

The backend will run on http://localhost:3000 by default.

## Frontend (local)
1. Install and run frontend dev server:

```bash
cd Frontend
npm install
npm run dev
```

Vite dev server runs on http://localhost:5173 by default. The dev server proxies API requests starting with `/user-api`, `/common-api`, `/admin-api`, and `/message-api` to the backend at `http://localhost:3000`.

## Notes
- Ensure `DB_URL` in `Backend/.env` points to a running MongoDB instance.
- Backend CORS is already configured to allow `http://localhost:5173`.
- If you need to change ports, update `Backend/.env` and restart both servers.

Files changed:
- [Frontend/vite.config.js](Frontend/vite.config.js)
- [Backend/package.json](Backend/package.json)
- [Backend/.env.example](Backend/.env.example)

If you'd like, I can run the project commands here or add a single npm workspace root script to start both services together. Would you like that?