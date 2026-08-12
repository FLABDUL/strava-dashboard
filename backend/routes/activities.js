import express from "express";
import axios from "axios";
import { getValidToken } from "../utils/tokenStore.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const accessToken = await getValidToken();
    const apiBase = process.env.STRAVA_API_BASE || "https://www.strava.com/api/v3";

    const response = await axios.get(
      `${apiBase}/athlete/activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching activities", error.response?.data || error.message);
    const status = error.message.includes("No token found") ? 401 : (error.response?.status || 500);
    res.status(status).json({ error: status === 401 ? "Strava login required" : "Error fetching activities" });
  }
});

export default router;
