# LOL Tracker Frontend

Vue + Tailwind CSS frontend for the LOL Tracker Flask backend.

## Run Locally

Install Node.js first if `node --version` or `npm --version` does not work.

```bash
npm install
npm run dev
```

The frontend runs at:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies `/matches` and `/health` to the Flask backend at:

```text
http://127.0.0.1:6767
```

## Backend

Run the Flask backend from the `LOL_tracker` folder:

```bash
python riot_api.py
```

## Build

```bash
npm run build
```

The Flask backend can serve the production build from this folder's `dist/` directory.

## Cloudflare Pages Deployment

Recommended Cloudflare Pages settings:

```text
Framework preset: Vue / Vite
Build command: npm run build
Build output directory: dist
Root directory: lol_tracker_frontend
```

Set this environment variable in Cloudflare Pages before deploying:

```text
VITE_API_BASE_URL=https://your-backend-api-host
```

## Cloudflare Wrangler Deployment

This frontend can also be deployed as a Cloudflare Worker with static assets.

1. Install dependencies:

```bash
npm install
```

2. Build the app:

```bash
npm run build
```

3. Deploy with Wrangler:

```bash
npm run deploy:wrangler
```

For Cloudflare Pages from the terminal:

```bash
npm run deploy:pages
```

If you want to deploy to a specific account/route, add your Cloudflare account settings to `wrangler.toml` or configure them in the Cloudflare dashboard.

## Notes

- The frontend is static and requires the backend API to run separately.
- Set `VITE_API_BASE_URL` to your API host before deploying if your Flask backend is not on the same origin.
