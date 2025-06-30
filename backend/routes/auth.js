// backend/routes/auth.js

import express from "express";
import axios from "axios";
import { saveToken, getValidToken } from "../utils/tokenStore.js";

const router = express.Router();

/**
 * Login route — redirects user to Strava consent screen
 */
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    approval_prompt: "auto",
    scope: "read,activity:read",
  });

  console.log("Using client_id", process.env.STRAVA_CLIENT_ID);
  res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

/**
 * Callback route — exchanges code for token and saves it
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No code provided");
  }
  try {
    const tokenResponse = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    });

    await saveToken({
      access_token: tokenResponse.data.access_token,
      refresh_token: tokenResponse.data.refresh_token,
      expires_at: tokenResponse.data.expires_at,
    });

    res.send("✅ Login successful! You can close this tab.");
  } catch (err) {
    console.error("Error exchanging code", err.response?.data || err.message);
    res.status(500).send("Error exchanging code");
  }
});

/**
 * Token refresh route — uses existing refresh_token to get new token
 */
router.get("/refresh", async (req, res) => {
  try {
    const currentToken = await getValidToken();

    if (!currentToken?.refresh_token) {
      return res.status(400).json({ error: "No refresh token found" });
    }

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: currentToken.refresh_token,
    });

    await saveToken({
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_at: response.data.expires_at,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error refreshing token", error.response?.data || error.message);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
