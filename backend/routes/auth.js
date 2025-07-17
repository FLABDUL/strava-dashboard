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
  const state = req.query.state;

  if (!code) {
    console.error("❌ No code provided in callback.");
    return res.status(400).send("❌ No code provided by Strava.");
  }

  console.log("🔁 Received code from Strava:", code);
  if (state) console.log("🔁 State param (if used):", state);

  try {
    const payload = {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.STRAVA_REDIRECT_URI
    };

    console.log("📡 Sending POST request to Strava /oauth/token with:", payload);

    const response = await axios.post("https://www.strava.com/oauth/token", payload, {
      headers: { "Content-Type": "application/json" }
    });

    const { access_token, refresh_token, expires_at } = response.data;

    await saveTokensToDB({ access_token, refresh_token, expires_at });
    console.log("✅ Tokens saved to DB successfully.");
    res.send("✅ Login successful! Tokens stored.");
  } catch (err) {
    console.error("❌ Error during Strava token exchange:");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Message:", err.message);
    }

    res.status(500).send("Error exchanging code with Strava.");
  }
});

// --- REFRESH ---
router.get("/refresh", async (req, res) => {
  try {
    const token = await getTokenFromDB();

    if (!token?.refresh_token) {
      console.error("❌ No refresh token found.");
      return res.status(400).json({ error: "❌ No refresh token found in DB" });
    }

    console.log("🔄 Refreshing token with refresh_token:", token.refresh_token);

    const response = await axios.post("https://www.strava.com/oauth/token", {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token
    });

    const { access_token, refresh_token, expires_at } = response.data;

    await saveTokensToDB({ access_token, refresh_token, expires_at });
    console.log("✅ Token refreshed and saved.");
    res.status(200).json(response.data);
  } catch (err) {
    console.error("❌ Token refresh failed:");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Message:", err.message);
    }

    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
