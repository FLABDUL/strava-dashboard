# Activity Intelligence — Strava Dashboard

A React and Node.js portfolio project that turns activity history into training totals, weekly and monthly summaries, route previews, and conservative AI-assisted guidance.

## Public portfolio demo

The normal frontend URL opens an interactive demo using representative activity data and a cached AI response:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

The public demo deliberately makes no Strava or OpenAI API requests. Visitors can use the activity filter, charts, summary tables, route previews, and cached training analysis without exposing personal data or consuming API credit.

## Developer-only live integration

Live integration mode remains available at `http://localhost:5173/?live=1`. It requires:

- An active Strava API application owned by an account with the required Strava subscription
- A local backend configuration in `backend/.env`
- A local frontend API override in `frontend/.env.local`

Example frontend override:

```env
VITE_API_BASE=http://localhost:5000
```

Start both services in separate terminals:

```powershell
cd backend
npm install
npm start
```

```powershell
cd frontend
npm install
npm run dev
```

The backend stores the personal OAuth token in the ignored `backend/token.json` file. Never commit or share that file, `.env`, API keys, refresh tokens, or client secrets.

## AI training insights

Public demo mode replays a cached structured response, so it incurs no OpenAI API cost.

In live integration mode, the Generate insight button sends a minimized training dataset to the backend, which calls OpenAI's Responses API. Activity names and route geometry are excluded. The analysis uses dates, sport type, distance, moving time, and optional performance metrics such as elevation and heart rate.

The default model is `gpt-5.6-sol`. AI output is training guidance, not medical advice.

## Strava access policy

As of June 30, 2026, Strava requires existing Standard Tier developers to maintain a Strava subscription for API access. Without it, OAuth can complete but activity requests return an inactive-application response. The demo-first experience is the supported no-subscription presentation path for this project.

Free Strava accounts can still request a manual account export. A future enhancement could parse an exported `activities.csv` locally without using the API.

## Checks

```powershell
cd frontend
npm run lint
npm run build
```
