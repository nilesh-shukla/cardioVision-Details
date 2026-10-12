# CardioVision AI frontend

React + TypeScript + Vite interface for the CardioVision AI educational prototype.

## Setup

```powershell
cd D:\Projects\Mini_Project\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The app expects the FastAPI backend at `VITE_API_BASE_URL`, defaulting to `http://127.0.0.1:8000`.

## Scripts

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run preview` — preview the production build
