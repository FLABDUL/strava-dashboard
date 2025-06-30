import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const tokenData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "token.json"))
    );

    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
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
