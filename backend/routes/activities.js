import express from "express";
import axios from "axios";
import { getValidToken } from "../utils/tokenStore.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const accessToken = await getValidToken();

    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching activities", error.response?.data || error.message);
    res.status(500).json({ error: "Error fetching activities" });
  }
});

export default router;
