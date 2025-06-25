**Root README.md**

# 🏃‍♂️ Personal Strava Dashboard

A personal dashboard built with React and Node.js that integrates with the Strava API to visualize your running, cycling, and swimming activities.

---

## ✨ Features

* 🔐 OAuth2 login with your Strava account
* 📊 Fetch and display your activities (distance, time, etc.)
* 📈 Chart your activity trends over time
* 🛠 Backend in Node.js/Express, Frontend in React with Vite and Chart.js
* 🐳 (Optional) Docker Compose for easy deployment

---

## 🧭 Project Structure

```
strava-dashboard/
├─ frontend/         # React app
├─ backend/          # Express app + OAuth handling
├─ README.md
├─ docker-compose.yml (optional)
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/strava-dashboard.git
cd strava-dashboard
```

### 2. Backend setup

* Copy `.env.example` to `backend/.env` and add:

```
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret
STRAVA_REDIRECT_URI=http://localhost:5000/auth/callback
```

* Install dependencies:

```bash
cd backend
npm install
```

* Run the backend:

```bash
npm start
```

### 3. Frontend setup

* Install dependencies:

```bash
cd ../frontend
npm install
```

* Run the frontend:

```bash
npm run dev
```

Your app will be at [http://localhost:5173](http://localhost:5173).

---

### 4. (Optional) Run with Docker Compose

Make sure you have Docker installed, then:

```bash
docker-compose up --build
```

---

## 🔐 OAuth Flow

Clicking "Connect to Strava" will send you to the Strava authorization page. Once authorized, you’ll be redirected back and your token will be saved.

---

## 🧪 Tech Stack

* Backend: Node.js, Express.js, Axios
* Frontend: React, Vite, TailwindCSS, Chart.js
* Auth: OAuth2
* Deployment: Vercel/Netlify (frontend), Railway/Fly.io (backend)

---

## 🤝 Contributing

Issues and PRs are welcome!

---