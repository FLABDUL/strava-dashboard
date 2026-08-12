// backend/app.js
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import activitiesRouter from './routes/activities.js';
import insightsRouter from './routes/insights.js';
import dotenv from "dotenv";
dotenv.config();

const app = express();
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
}));
app.use(express.json({ limit: '200kb' }));

// Use the correctly named authRouter
app.use('/auth', authRouter); 
app.use('/api/activities', activitiesRouter);
app.use('/api/insights', insightsRouter);

app.listen(5000, () => {
  console.log('Backend listening on http://localhost:5000');
});

// healthcheck
app.get('/', (req, res) => {
  res.send('Strava Backend is up and running 🚀');
});
