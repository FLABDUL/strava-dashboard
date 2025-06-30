import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const router = express.Router();

// helpers
function getRefreshTokenFromStorage() {
  try {
    const tokenData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "token.json"))
    );
    return tokenData.refresh_token;
  } catch (err) {
    console.error("Cannot read refresh token", err);
    return null;
  }
}

function saveTokens(tokens) {
  try {
    fs.writeFileSync(
      path.join(process.cwd(), "token.json"),
      JSON.stringify(tokens, null, 2)
    );
  } catch (err) {
    console.error("Cannot save tokens", err);
  }
}


// login
router.get("/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.STRAVA_REDIRECT_URI,
    approval_prompt: "auto",
    scope: "read,activity:read"
  });

  console.log("Using client_id", process.env.STRAVA_CLIENT_ID);
  res.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
});

// callback
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
    saveTokens(response.data);
    res.send("✅ Login successful! You can close this tab.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error exchanging code");
  }
});

// token refresh
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
    saveTokens(response.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error refreshing token", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

export default router;
