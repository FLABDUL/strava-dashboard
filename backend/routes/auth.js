// backend/routes/auth.js
import express from 'express';
import axios from 'axios';
import { saveToken } from '../utils/tokenStore.js';
import 'dotenv/config';

const router = express.Router();

router.get('/strava', (req, res) => {
  const client_id = process.env.STRAVA_CLIENT_ID;
  const redirect_uri = process.env.STRAVA_REDIRECT_URI;
  const scope = 'read,activity:read';
  res.redirect(`https://www.strava.com/oauth/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=${scope}`);
});

router.get('/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResp = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });
    await saveToken(tokenResp.data); // implement saveToken
    res.redirect('http://localhost:5173'); // Redirect to frontend
  } catch (error) {
    res.status(500).send('OAuth failed');
  }
});

export default router;
