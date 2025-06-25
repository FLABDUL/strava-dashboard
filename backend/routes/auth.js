// ============================
// backend/routes/auth.js
// ============================
import express from "express";
import axios from "axios";

const router = express.Router();

// Helper to read refresh token
function getRefreshTokenFromStorage() {
  // Implement this to read your saved refresh token (e.g. from token.json file)
}

// Helper to save new tokens
function saveTokens(tokens) {
  // Implement this to persist new tokens (e.g. to token.json file)
}

// Token refresh endpoint
router.get("/refresh", async (req, res) => {
  try {
    const refreshToken = getRefreshTokenFromStorage();
    const response = await axios.post(
      "https://www.strava.com/oauth/token",
      {
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }
    );

    saveTokens(response.data); // save new tokens to file
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error refreshing token", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
