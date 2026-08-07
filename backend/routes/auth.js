import express from "express";
import axios from "axios";
import { getTokenFromDB, saveTokensToDB } from "../tokenService.js";

const router = express.Router();

function hasStravaConfig() {
  return Boolean(
    process.env.STRAVA_CLIENT_ID &&
    process.env.STRAVA_CLIENT_SECRET &&
    process.env.STRAVA_REDIRECT_URI
  );
}

router.get("/login", (req, res) => {
  if (!hasStravaConfig()) {
    return res.status(503).json({
      error: "Strava OAuth is not configured. Copy backend/.env.example to backend/.env and add your app credentials.",
    });
  }

  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    approval_prompt: "auto",
    scope: "read activity:read",
  });

  res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No authorization code was provided by Strava.");
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.STRAVA_REDIRECT_URI,
    });

    const response = await axios.post("https://www.strava.com/oauth/token", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, refresh_token, expires_at } = response.data;
    await saveTokensToDB({ access_token, refresh_token, expires_at });
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  } catch (error) {
    console.error("Strava token exchange failed", error.response?.data || error.message);
    res.status(500).send("Error exchanging the authorization code with Strava.");
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const token = await getTokenFromDB();

    if (!token?.refresh_token) {
      return res.status(401).json({ error: "No Strava refresh token was found." });
    }

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    });

    const { access_token, refresh_token, expires_at } = response.data;
    await saveTokensToDB({ access_token, refresh_token, expires_at });
    res.status(200).json({ expires_at });
  } catch (error) {
    console.error("Strava token refresh failed", error.response?.data || error.message);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
