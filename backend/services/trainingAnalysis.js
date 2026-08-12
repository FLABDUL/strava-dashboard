const MAX_ACTIVITIES = 120;

const optionalNumberFields = {
  total_elevation_gain: "elevation_gain_m",
  average_heartrate: "average_heartrate_bpm",
  max_heartrate: "max_heartrate_bpm",
  average_speed: "average_speed_mps",
  max_speed: "max_speed_mps",
  suffer_score: "suffer_score",
};

function asFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function buildTrainingAnalysisInput(rawActivities) {
  if (!Array.isArray(rawActivities)) {
    throw new TypeError("activities must be an array");
  }

  const activities = rawActivities
    .slice(0, MAX_ACTIVITIES)
    .map((activity) => {
      const startDate = new Date(activity.start_date);
      const distance = asFiniteNumber(activity.distance);
      const movingTime = asFiniteNumber(activity.moving_time);

      if (Number.isNaN(startDate.getTime()) || distance === undefined || movingTime === undefined) {
        return null;
      }

      const safeActivity = {
        date: startDate.toISOString(),
        type: String(activity.sport_type || activity.type || "Other").slice(0, 40),
        distance_km: Number((distance / 1000).toFixed(2)),
        moving_minutes: Number((movingTime / 60).toFixed(1)),
      };

      for (const [sourceField, safeField] of Object.entries(optionalNumberFields)) {
        const value = asFiniteNumber(activity[sourceField]);
        if (value !== undefined) safeActivity[safeField] = value;
      }

      return safeActivity;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (activities.length === 0) {
    throw new TypeError("at least one valid activity is required");
  }

  const weekly = new Map();
  const totalsByType = new Map();

  for (const activity of activities) {
    const date = new Date(activity.date);
    const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = monday.getUTCDay() || 7;
    monday.setUTCDate(monday.getUTCDate() - day + 1);
    const week = monday.toISOString().slice(0, 10);

    const weekSummary = weekly.get(week) || { week_start: week, activities: 0, distance_km: 0, moving_minutes: 0 };
    weekSummary.activities += 1;
    weekSummary.distance_km += activity.distance_km;
    weekSummary.moving_minutes += activity.moving_minutes;
    weekly.set(week, weekSummary);

    const typeSummary = totalsByType.get(activity.type) || { type: activity.type, activities: 0, distance_km: 0, moving_minutes: 0 };
    typeSummary.activities += 1;
    typeSummary.distance_km += activity.distance_km;
    typeSummary.moving_minutes += activity.moving_minutes;
    totalsByType.set(activity.type, typeSummary);
  }

  const roundSummary = (summary) => ({
    ...summary,
    distance_km: Number(summary.distance_km.toFixed(1)),
    moving_minutes: Number(summary.moving_minutes.toFixed(0)),
  });

  return {
    activity_count: activities.length,
    period_start: activities.at(-1).date,
    period_end: activities[0].date,
    totals_by_type: [...totalsByType.values()].map(roundSummary),
    weekly_summary: [...weekly.values()]
      .sort((a, b) => a.week_start.localeCompare(b.week_start))
      .map(roundSummary),
    activities,
  };
}

export const trainingInsightsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "summary", "trend", "confidence", "highlights", "risks", "next_week"],
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    trend: {
      type: "string",
      enum: ["building", "maintaining", "recovering", "inconsistent", "insufficient_data"],
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    highlights: {
      type: "array",
      items: { type: "string" },
    },
    risks: {
      type: "array",
      items: { type: "string" },
    },
    next_week: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "target", "rationale"],
        properties: {
          title: { type: "string" },
          target: { type: "string" },
          rationale: { type: "string" },
        },
      },
    },
  },
};
