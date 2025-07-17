import express from "express";
import axios from "axios";
import { getTokenFromDB, saveTokensToDB } from "../tokenService.js"; // one level up

const router = express.Router();

// login route
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    approval_prompt: "auto",
    scope: "read,activity:read"
  });

  console.log("Using client_id:", process.env.STRAVA_CLIENT_ID);
  res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

// callback route
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code"
    });

    const { access_token, refresh_token, expires_at } = response.data;
    await saveTokensToDB({ access_token, refresh_token, expires_at });

    res.send("✅ Login successful! Tokens stored in database.");
  } catch (err) {
    console.error("Error exchanging code:", err.response?.data || err.message);
    res.status(500).send("Error exchanging code with Strava.");
  }
});

// refresh token route
router.get("/refresh", async (req, res) => {
  try {
    const token = await getTokenFromDB();

    if (!token || !token.refresh_token) {
      return res.status(400).json({ error: "No refresh token found in DB" });
    }

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token
    });

    const { access_token, refresh_token, expires_at } = response.data;
    await saveTokensToDB({ access_token, refresh_token, expires_at });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error refreshing token:", error.response?.data || error.message);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
