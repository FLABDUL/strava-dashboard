import crypto from "node:crypto";
import express from "express";
import OpenAI from "openai";
import { buildTrainingAnalysisInput, trainingInsightsSchema } from "../services/trainingAnalysis.js";

const router = express.Router();
const requestsByIp = new Map();
const oneHour = 60 * 60 * 1000;

const analystInstructions = `You are a cautious endurance-training analyst. Analyze only the supplied activity data.

Identify clear volume, consistency, recovery, and intensity patterns. Never invent goals, injuries, fitness levels, pace zones, diagnoses, or data that is not present. Treat heart-rate and suffer-score data as optional. If the dataset is small or lacks intensity data, lower confidence and say what is uncertain.

Recommendations must be conservative, practical, and appropriate for the next seven days. Return at most three highlights, at most three risks, and two or three next-week actions. Do not give medical advice. Flag abrupt load changes as observations, not diagnoses. Use plain English and metric units.`;

function safetyIdentifier() {
  return crypto
    .createHash("sha256")
    .update(`strava-dashboard:${process.env.STRAVA_CLIENT_ID || "personal-athlete"}`)
    .digest("hex")
    .slice(0, 32);
}

function isRateLimited(ip) {
  const now = Date.now();
  const limit = Number(process.env.AI_INSIGHTS_MAX_REQUESTS_PER_HOUR) || 10;
  const recentRequests = (requestsByIp.get(ip) || []).filter((time) => now - time < oneHour);

  if (recentRequests.length >= limit) {
    requestsByIp.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestsByIp.set(ip, recentRequests);
  return false;
}

router.post("/", async (req, res) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key") {
    return res.status(503).json({
      code: "OPENAI_NOT_CONFIGURED",
      error: "OpenAI insights are not configured on the server.",
    });
  }

  let analysisInput;
  try {
    analysisInput = buildTrainingAnalysisInput(req.body?.activities);
  } catch (error) {
    return res.status(400).json({ code: "INVALID_ACTIVITIES", error: error.message });
  }

  if (isRateLimited(req.ip)) {
    return res.status(429).json({
      code: "AI_INSIGHTS_RATE_LIMITED",
      error: "The hourly insight limit has been reached. Please try again later.",
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-5.6-sol";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45_000, maxRetries: 2 });

  try {
    const response = await client.responses.create({
      model,
      instructions: analystInstructions,
      input: JSON.stringify(analysisInput),
      reasoning: { effort: "low" },
      max_output_tokens: 1200,
      store: false,
      safety_identifier: safetyIdentifier(),
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "training_insights",
          description: "Evidence-based observations and a conservative seven-day training suggestion.",
          strict: true,
          schema: trainingInsightsSchema,
        },
      },
    });

    if (!response.output_text) {
      throw new Error("OpenAI returned no insight text");
    }

    const insights = JSON.parse(response.output_text);
    res.json({
      insights,
      meta: {
        model,
        activity_count: analysisInput.activity_count,
        period_start: analysisInput.period_start,
        period_end: analysisInput.period_end,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("OpenAI training insight failed", {
      status: error.status,
      code: error.code,
      requestId: error.request_id,
      message: error.message,
    });

    const status = error.status === 429 ? 429 : 502;
    res.status(status).json({
      code: status === 429 ? "OPENAI_RATE_LIMITED" : "OPENAI_REQUEST_FAILED",
      error: status === 429
        ? "OpenAI is temporarily rate-limited. Please try again shortly."
        : "The training analysis could not be generated.",
    });
  }
});

export default router;
