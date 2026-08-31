# Development guide

## Supported scope

The maintained path is the frontend's synthetic demo. Live Strava and OpenAI integration is preserved for local study and possible future revival, but requires credentials, provider eligibility and separate verification.

## Prerequisites

- Node.js 18 or later
- npm
- two terminals for live mode
- an active Strava subscription and registered API application for live activity access
- an OpenAI API key only if live AI insights are required

The repository does not declare a Node `engines` range. Node 18 is the documented baseline inherited from the original frontend setup.

## Repository layout

```text
strava-dashboard/
├── backend/
│   ├── routes/                 # OAuth, activities and AI endpoints
│   ├── services/               # Training-data minimisation and schema
│   ├── utils/                  # Local token persistence and refresh
│   ├── .env.example            # Server configuration template
│   └── app.js                  # Express entry point
├── frontend/
│   ├── src/                    # React components and demo fixtures
│   ├── public/
│   └── vite.config.js          # Development proxy
├── docs/
└── README.md
```

The root `package.json` contains historical mapping dependencies but no scripts. Run npm commands inside `frontend` or `backend` as documented below.

## Public demo setup

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

Vite proxies `/auth` and `/api` to `http://localhost:5000` during local development, but public demo mode does not use those routes.

## Live integration setup

### 1. Configure Strava

Create or update a Strava API application using Strava's current developer instructions. The preserved local callback is:

```text
http://localhost:5000/auth/callback
```

Provider eligibility, URLs and OAuth requirements may change. Recheck the [Strava developer documentation](https://developers.strava.com/docs/) rather than relying only on this archived project.

### 2. Configure the backend

Copy the template:

```powershell
cd backend
Copy-Item .env.example .env
```

Populate only your local `backend/.env`. Do not paste real values into issues, documentation, commits or screenshots.

| Variable | Required for | Purpose |
| --- | --- | --- |
| `STRAVA_CLIENT_ID` | Live Strava | API application identifier |
| `STRAVA_CLIENT_SECRET` | Live Strava | Server-side OAuth secret |
| `STRAVA_REDIRECT_URI` | Live Strava | Must match the callback configured with Strava |
| `STRAVA_API_BASE` | Optional | Overrides the activities API base URL for migration or testing |
| `FRONTEND_URL` | Live Strava | OAuth callback destination after token exchange |
| `CORS_ORIGINS` | Backend | Comma-separated allowed browser origins |
| `OPENAI_API_KEY` | Live AI only | Server-side OpenAI credential |
| `OPENAI_MODEL` | Live AI only | Model override; verify availability before revival |
| `AI_INSIGHTS_MAX_REQUESTS_PER_HOUR` | Optional | In-memory per-IP limit, defaulting to 10 |

### 3. Configure the frontend

Create `frontend/.env.local`:

```env
VITE_API_BASE=http://localhost:5000
```

Only variables prefixed with `VITE_` are exposed to browser code. Never put a provider secret in a Vite environment variable.

### 4. Start both services

Terminal one:

```powershell
cd backend
npm install
npm start
```

Terminal two:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/?live=1`.

### 5. Authorise the account

If no token exists, live mode returns a login-required message and offers **Connect with Strava**. The callback saves OAuth data to `backend/token.json`. This file is ignored by Git but still contains sensitive credentials and should be deleted or revoked when no longer needed.

## Backend endpoints

| Method and path | Behaviour |
| --- | --- |
| `GET /` | Plain-text health response |
| `GET /auth/login` | Redirects to Strava consent when configured |
| `GET /auth/callback` | Exchanges an authorisation code and saves tokens |
| `POST /auth/refresh` | Explicitly refreshes the stored token |
| `GET /api/activities` | Loads or refreshes a token and retrieves recent activities |
| `POST /api/insights` | Validates activities and returns structured OpenAI analysis |

## Token lifecycle

`backend/utils/tokenStore.js` reads and writes `backend/token.json` synchronously. Before an activity request it:

1. loads the stored token;
2. returns the access token if it has not expired;
3. otherwise exchanges the refresh token;
4. replaces the local token file; and
5. returns the rotated access token.

This design is suitable only for one trusted local user. It has no encryption, user separation, locking or distributed persistence.

## AI request lifecycle

The browser posts activity objects to `/api/insights`. The backend:

1. accepts at most 120 records;
2. rejects a request without a valid date, distance and moving time;
3. removes names and routes;
4. builds sport and weekly totals;
5. applies an in-memory request limit;
6. requests strict JSON from the configured OpenAI model; and
7. returns the structured insight plus non-sensitive metadata.

## Commands

### Frontend

```powershell
cd frontend
npm run dev       # Vite development server
npm test          # Synthetic route fixture tests
npm run lint      # ESLint
npm run build     # Production bundle
npm run preview   # Preview the production bundle
```

### Backend

```powershell
cd backend
npm start
```

There is currently no backend automated test suite. Its package's placeholder `npm test` command exits unsuccessfully by design.

## Troubleshooting

### `401 Strava login required`

No readable `backend/token.json` exists. Start the OAuth flow through `/auth/login`.

### `403` or inactive application

Check the API application status and the subscription of the Strava account that owns the application. Do not assume a successful OAuth screen guarantees activity API access.

### `503 Strava OAuth is not configured`

Confirm all three Strava OAuth variables are present in `backend/.env`, then restart the backend.

### `503 OPENAI_NOT_CONFIGURED`

Add a valid `OPENAI_API_KEY` to `backend/.env`, or use the public demo's cached response instead.

### `429` from insights

The application or OpenAI has reached a request limit. The local application limit resets as its one-hour entries expire and resets completely when the backend process restarts.

### Browser CORS failure

Add the exact frontend origin to `CORS_ORIGINS`. Origins are compared as complete strings, including scheme and port.

### Blank route map

Confirm that the activity contains `map.summary_polyline` and that OpenStreetMap tile requests are permitted by the browser and network.

### Live mode retrieves too few activities

The preserved endpoint makes one unpaginated activities request. Historical pagination and backfill were never implemented.

## Validation before changing or reviving the project

```powershell
cd frontend
npm test
npm run lint
npm run build
```

Then start the backend, request `http://localhost:5000/`, and visually check both `/` and `/?live=1`. Record Strava and OpenAI integration as unverified unless real eligible credentials were used during that specific validation.
