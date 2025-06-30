import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import activitiesRouter from './routes/activities.js';
import dotenv from "dotenv-safe";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",                                // local dev
    "https://strava-dashboard-zeta.vercel.app",             // vercel production frontend
    "https://strava-dashboard-production.up.railway.app"    // if backend itself might test from there
  ],
  credentials: true
}));


app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/activities', activitiesRouter);

app.get('/', (req, res) => {
  res.send('Strava Backend is up and running 🚀');
});

app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log(`Server listening on port ${process.env.PORT || 5000}`);
});
