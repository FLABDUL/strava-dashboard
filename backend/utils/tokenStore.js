import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const tokenFile = new URL("../token.json", import.meta.url);

export function loadToken() {
  try {
    const data = JSON.parse(fs.readFileSync(tokenFile, "utf8"));
    return data;
  } catch {
    return null;
  }
}

export function saveToken(tokenData) {
  fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 2));
}

export async function getValidToken() {
  let token = loadToken();
  if (!token) throw new Error("No token found — please login first.");

  const now = Math.floor(Date.now() / 1000);
  if (token.expires_at > now) {
    return token.access_token; // token still good
  }

  // expired — refresh
  console.log("Access token expired, refreshing...");
  const response = await axios.post("https://www.strava.com/oauth/token", {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
  });

  saveToken(response.data);
  console.log("Refreshed token ok");
  return response.data.access_token;
}
