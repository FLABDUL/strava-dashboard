import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import activitiesRouter from './routes/activities.js';
import dotenv from "dotenv-safe";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",                 // allow local frontend
    "https://strava-dashboard-production.up.railway.app"  // allow deployed frontend
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
