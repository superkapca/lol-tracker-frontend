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
