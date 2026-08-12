import { useState } from "react";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_BASE || "";

const demoAnalysis = {
  insights: {
    headline: "A consistent base with one sharp volume spike",
    summary: "Your recent training is varied and fairly consistent, with running forming the core of the week. The long ride creates a noticeable jump in total distance, so the strongest next step is consolidation rather than adding more volume immediately.",
    trend: "building",
    confidence: "medium",
    highlights: [
      "Six sessions in July provide a useful rhythm across running, riding and swimming.",
      "The long run and tempo session give the running week a clear endurance-plus-quality shape.",
      "Cross-training adds aerobic work without making every session another run.",
    ],
    risks: [
      "Weekly distance varies considerably, driven mainly by the 42.2 km ride.",
      "There is not enough heart-rate or effort data to judge intensity distribution confidently.",
    ],
    next_week: [
      {
        title: "Keep the rhythm",
        target: "4–5 sessions with at least one full rest day",
        rationale: "Consistency is the clearest positive signal in the available data.",
      },
      {
        title: "Hold volume steady",
        target: "Stay close to the latest complete week's total time",
        rationale: "Consolidating the recent load is more useful than chasing another abrupt increase.",
      },
      {
        title: "Make one session purposeful",
        target: "Choose one tempo or longer endurance session—not both hard",
        rationale: "A single clear quality stimulus leaves room for recovery around it.",
      },
    ],
  },
  meta: {
    model: "Cached OpenAI response",
    activity_count: 8,
    generated_at: "2026-08-06T12:00:00.000Z",
  },
};

const trendLabels = {
  building: "Building",
  maintaining: "Maintaining",
  recovering: "Recovering",
  inconsistent: "Inconsistent",
  insufficient_data: "More data needed",
};

export default function AIInsightsPanel({ activities, demoMode }) {
  const [analysis, setAnalysis] = useState(() => demoMode ? demoAnalysis : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoNotice, setDemoNotice] = useState("");

  async function generateInsights() {
    if (demoMode) {
      setAnalysis(demoAnalysis);
      setDemoNotice("Cached insight replayed—no API request or OpenAI credit used.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${apiBase}/api/insights`, { activities });
      setAnalysis(response.data);
    } catch (requestError) {
      const code = requestError.response?.data?.code;
      setError(
        code === "OPENAI_NOT_CONFIGURED"
          ? "Add OPENAI_API_KEY to backend/.env, restart the backend, and try again."
          : requestError.response?.data?.error || "The insight could not be generated. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950/30 shadow-2xl shadow-orange-950/10">
      <div className="flex flex-col gap-4 border-b border-zinc-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-400">AI insight</span>
            {demoMode ? <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">Cached demo output</span> : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold">Training review</h3>
          <p className="mt-1 text-sm text-zinc-400">Patterns, watch-outs and a conservative seven-day suggestion.</p>
        </div>
        <button
          type="button"
          onClick={generateInsights}
          disabled={loading || activities.length === 0}
          aria-busy={loading}
          className="rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analysing…" : demoMode ? "Replay cached insight" : analysis ? "Refresh insight" : "Generate insight"}
        </button>
      </div>

      <div aria-live="polite">
        {error ? (
          <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
        ) : null}

        {demoNotice ? (
          <div className="mx-6 mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{demoNotice}</div>
        ) : null}

        {!analysis && !error ? (
          <div className="px-6 py-10 text-center">
            <p className="text-zinc-300">Ready to analyse {activities.length} recent activities.</p>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Activity names and routes stay private. Only dates, sport type, distance, duration and available performance metrics are sent for analysis when you click the button.
            </p>
          </div>
        ) : null}

        {analysis ? <InsightResult analysis={analysis} demoMode={demoMode} /> : null}
      </div>
    </section>
  );
}

function InsightResult({ analysis, demoMode }) {
  const { insights, meta } = analysis;

  return (
    <div className="space-y-6 p-6">
      <div className="max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-orange-500/15 px-3 py-1 font-semibold text-orange-300">{trendLabels[insights.trend]}</span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-zinc-400">{insights.confidence} confidence</span>
          <span className="text-zinc-600">{meta.activity_count} activities analysed</span>
        </div>
        <h4 className="mt-4 text-2xl font-bold tracking-tight">{insights.headline}</h4>
        <p className="mt-3 max-w-3xl leading-7 text-zinc-300">{insights.summary}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <InsightList title="What looks good" items={insights.highlights} tone="positive" />
        <InsightList title="Keep an eye on" items={insights.risks} tone="caution" />
      </div>

      <div>
        <h5 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Suggested next seven days</h5>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {insights.next_week.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <span className="text-xs font-bold text-orange-500">0{index + 1}</span>
              <h6 className="mt-2 font-semibold">{item.title}</h6>
              <p className="mt-2 text-sm font-medium text-zinc-300">{item.target}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{item.rationale}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{demoMode ? "Cached portfolio response—no API credits used" : `Generated with ${meta.model}`}</span>
        <span>Training guidance only—not medical advice.</span>
      </div>
    </div>
  );
}

function InsightList({ title, items, tone }) {
  const markerClass = tone === "positive" ? "bg-emerald-400" : "bg-amber-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <h5 className="font-semibold">{title}</h5>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-zinc-400">
              <span aria-hidden="true" className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${markerClass}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-sm text-zinc-500">Nothing material was identified from the available data.</p>}
    </div>
  );
}
