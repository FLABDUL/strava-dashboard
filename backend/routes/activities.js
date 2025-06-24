// backend/routes/activities.js
import express from 'express';
import axios from 'axios';
import { getToken } from '../utils/tokenStore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const token = await getToken();
    const resp = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    res.json(resp.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching activities' });
  }
});

export default router;
