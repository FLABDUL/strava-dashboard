import express from "express";
import axios from "axios";
import { getTokenFromDB, saveTokensToDB } from "../tokenService.js";

const router = express.Router();

// --- LOGIN ---
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    approval_prompt: "auto",
    scope: "read,activity:read"
  });

  console.log("🔐 Redirecting to Strava OAuth with client_id:", process.env.STRAVA_CLIENT_ID);
  res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

// --- CALLBACK ---
router.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("❌ No code provided by Strava.");
  }

  try {
    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.STRAVA_REDIRECT_URI
    });

    const { access_token, refresh_token, expires_at } = response.data;
    await saveTokensToDB({ access_token, refresh_token, expires_at });

    console.log("✅ Tokens successfully saved to DB.");
    res.send("✅ Login successful! Tokens stored.");
  } catch (err) {
    console.error("❌ Error during Strava token exchange:", err.response?.data || err.message);
    res.status(500).send("Error exchanging code with Strava.");
  }
});

// --- REFRESH ---
router.get("/refresh", async (req, res) => {
  try {
    const token = await getTokenFromDB();

    if (!token?.refresh_token) {
      return res.status(400).json({ error: "❌ No refresh token found in DB" });
    }

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token
    });

    const { access_token, refresh_token, expires_at } = response.data;
    await saveTokensToDB({ access_token, refresh_token, expires_at });

    console.log("🔄 Token refreshed successfully.");
    res.status(200).json(response.data);
  } catch (err) {
    console.error("❌ Token refresh failed:", err.response?.data || err.message);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
