// backend/app.js
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import activitiesRouter from './routes/activities.js';
import dotenv from "dotenv-safe";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Use the correctly named authRouter
app.use('/auth', authRouter); 
app.use('/api/activities', activitiesRouter);

app.listen(5000, () => {
  console.log('Backend listening on http://localhost:5000');
});

// healthcheck
app.get('/', (req, res) => {
  res.send('Strava Backend is up and running 🚀');
});
