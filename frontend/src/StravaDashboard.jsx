import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getISOWeek } from "date-fns";
import AIInsightsPanel from "./AIInsightsPanel";
import demoActivities from "./demoActivities";

const ActivityMapPreview = lazy(() => import("./ActivityMapPreview"));

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const apiBase = import.meta.env.VITE_API_BASE || "";
const liveMode = new URLSearchParams(window.location.search).get("live") === "1";
const demoMode = !liveMode;

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#a1a1aa", boxWidth: 12 } },
  },
  scales: {
    x: { ticks: { color: "#71717a" }, grid: { color: "rgba(63, 63, 70, 0.35)" } },
    y: { ticks: { color: "#71717a" }, grid: { color: "rgba(63, 63, 70, 0.35)" } },
  },
};

function hours(seconds) {
  return (seconds / 3600).toFixed(1);
}

export default function StravaDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [showMap, setShowMap] = useState({});

  useEffect(() => {
    async function fetchActivities() {
      if (demoMode) {
        setActivities(demoActivities);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${apiBase}/api/activities`);
        setActivities(response.data);
      } catch (requestError) {
        const status = requestError.response?.status;
        setErrorStatus(status || null);
        setError(
          status === 403
            ? "Strava has marked this Standard Tier application inactive because live API access now requires a subscription."
            : status === 401
              ? "Connect your Strava account to load your activities."
              : "The dashboard could not reach the local Strava service."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  const filteredActivities = useMemo(
    () => filterType === "All" ? activities : activities.filter((activity) => activity.type === filterType),
    [activities, filterType]
  );

  const overall = useMemo(
    () => filteredActivities.reduce(
      (summary, activity) => ({
        count: summary.count + 1,
        distance: summary.distance + activity.distance / 1000,
        time: summary.time + activity.moving_time,
      }),
      { count: 0, distance: 0, time: 0 }
    ),
    [filteredActivities]
  );

  const weeklySummary = useMemo(() => {
    const weeks = filteredActivities.reduce((summary, activity) => {
      const date = new Date(activity.start_date);
      const key = `${date.getUTCFullYear()}-${getISOWeek(date)}`;
      summary[key] ||= { label: `Week ${getISOWeek(date)}`, distance: 0, time: 0, count: 0 };
      summary[key].distance += activity.distance / 1000;
      summary[key].time += activity.moving_time;
      summary[key].count += 1;
      return summary;
    }, {});
    return Object.values(weeks);
  }, [filteredActivities]);

  const monthlySummary = useMemo(() => {
    const months = filteredActivities.reduce((summary, activity) => {
      const label = new Date(activity.start_date).toLocaleString("default", { month: "short", year: "numeric" });
      summary[label] ||= { label, distance: 0, time: 0, count: 0 };
      summary[label].distance += activity.distance / 1000;
      summary[label].time += activity.moving_time;
      summary[label].count += 1;
      return summary;
    }, {});
    return Object.values(months);
  }, [filteredActivities]);

  const chartData = {
    labels: [...filteredActivities].reverse().map((activity) => new Date(activity.start_date).toLocaleDateString()),
    datasets: [{
      label: "Distance (km)",
      data: [...filteredActivities].reverse().map((activity) => activity.distance / 1000),
      borderColor: "#fc4c02",
      backgroundColor: "rgba(252, 76, 2, 0.16)",
      pointBackgroundColor: "#fc4c02",
      tension: 0.32,
    }],
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-200">Loading activities…</div>;
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 px-6 text-white">
        <section className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-orange-600 text-2xl font-black">S</div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Developer integration mode</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Live sync is unavailable</h1>
          <p className="mt-3 leading-7 text-zinc-400">{error}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-500" href="/">
              Open interactive demo
            </a>
            {errorStatus === 401 ? (
              <a className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 hover:bg-zinc-800" href={`${apiBase}/auth/login`}>
                Connect with Strava
              </a>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 font-black shadow-lg shadow-orange-950/50">S</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-500">Activity intelligence</p>
              <h1 className="text-lg font-bold">Strava dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 sm:inline-flex">
              Interactive demo
            </span>
            <a
              className="rounded-xl border border-zinc-700 px-3.5 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
              href="https://github.com/FLABDUL/strava-dashboard"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8 sm:py-12">
        <PortfolioIntro />

        <section id="training-dashboard" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-orange-400">Representative activity data</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">Recent training momentum</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Eight synthetic sessions demonstrate the real filtering, aggregation, charting and route-map experience.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm text-zinc-400">
              Activity type
              <select
                className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
              >
                <option>All</option>
                <option>Run</option>
                <option>Ride</option>
                <option>Swim</option>
              </select>
            </label>
          </div>

          <section className="grid gap-4 sm:grid-cols-3" aria-label="Training totals">
            {[
              ["Activities", overall.count, "sessions"],
              ["Distance", overall.distance.toFixed(1), "kilometres"],
              ["Moving time", hours(overall.time), "hours"],
            ].map(([label, value, unit]) => (
              <article key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl shadow-black/10">
                <p className="text-sm text-zinc-400">{label}</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-orange-500">{unit}</p>
              </article>
            ))}
          </section>

          <AIInsightsPanel activities={activities} demoMode={demoMode} />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
            <div className="mb-5">
              <h3 className="text-lg font-semibold">Distance over time</h3>
              <p className="text-sm text-zinc-500">Training volume across the representative sessions</p>
            </div>
            <div className="h-72"><Line data={chartData} options={chartOptions} /></div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <SummaryTable title="Weekly summary" rows={weeklySummary} />
            <SummaryTable title="Monthly summary" rows={monthlySummary} />
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="text-lg font-semibold">Recent activities</h3>
              <p className="mt-1 text-sm text-zinc-500">Route geometry is illustrative and contains no personal location data.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-950/70 text-xs uppercase tracking-wider text-zinc-500">
                  <tr><th className="px-5 py-3">Activity</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Distance</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Route</th></tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredActivities.map((activity) => (
                    <tr key={activity.id} className="align-top hover:bg-zinc-800/40">
                      <td className="px-5 py-4 font-medium">{activity.name}</td>
                      <td className="px-5 py-4 text-zinc-400">{new Date(activity.start_date).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-zinc-300">{(activity.distance / 1000).toFixed(2)} km</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">{activity.type}</span></td>
                      <td className="min-w-52 px-5 py-4">
                        {activity.map?.summary_polyline ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowMap((current) => ({ ...current, [activity.id]: !current[activity.id] }))}
                              className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-500"
                            >
                              {showMap[activity.id] ? "Hide map" : "Show map"}
                            </button>
                            {showMap[activity.id] && (
                              <div className="mt-3 h-52 overflow-hidden rounded-xl border border-zinc-700">
                                <Suspense fallback={<div className="grid h-full place-items-center bg-zinc-950 text-xs text-zinc-500">Loading map…</div>}>
                                  <ActivityMapPreview summaryPolyline={activity.map.summary_polyline} />
                                </Suspense>
                              </div>
                            )}
                          </>
                        ) : <span className="text-zinc-600">No route</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <EngineeringCaseStudy />
      </main>

      <footer className="border-t border-zinc-800/80 px-6 py-8 text-center text-sm text-zinc-600">
        Independent portfolio project. Not affiliated with or endorsed by Strava. Demo activity and route data are synthetic.
      </footer>
    </div>
  );
}

function PortfolioIntro() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-zinc-900 px-6 py-8 shadow-2xl shadow-orange-950/10 sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-orange-600/15 blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">Interactive portfolio demo</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
            From activity history to a useful next week.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            A privacy-conscious training dashboard that turns activity records into trends, summaries and conservative AI-assisted guidance.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a className="rounded-xl bg-orange-600 px-5 py-3 text-center font-semibold text-white hover:bg-orange-500" href="#training-dashboard">
              Explore the dashboard
            </a>
            <a className="rounded-xl border border-zinc-700 px-5 py-3 text-center font-semibold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800" href="#architecture">
              Read the case study
            </a>
          </div>
        </div>

        <aside className="rounded-2xl border border-zinc-700/80 bg-zinc-950/70 p-5" aria-label="Demo environment">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">Demo environment</p>
          <ul className="mt-4 space-y-3 text-sm">
            <DemoStatus label="Activity source" value="Representative data" />
            <DemoStatus label="AI analysis" value="Cached response" />
            <DemoStatus label="External API calls" value="None" />
          </ul>
          <p className="mt-5 border-t border-zinc-800 pt-4 text-xs leading-5 text-zinc-600">
            Live Strava sync is disabled because Standard Tier API access now requires a paid Strava subscription.
          </p>
        </aside>
      </div>
    </section>
  );
}

function DemoStatus({ label, value }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="flex items-center gap-2 font-medium text-zinc-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
        {value}
      </span>
    </li>
  );
}

function EngineeringCaseStudy() {
  const capabilities = [
    ["OAuth lifecycle", "Authorization, short-lived access tokens, refresh-token rotation and an ignored local token store are implemented in the backend."],
    ["Privacy-first AI", "Only training metrics are prepared for analysis. Activity names and route geometry are excluded from model input."],
    ["Data transformation", "Raw activities become reusable weekly and monthly summaries, filters, totals, timelines and route previews."],
    ["Graceful degradation", "When provider access became subscription-gated, the product shifted to a transparent, cost-free demo instead of failing silently."],
  ];

  return (
    <section id="architecture" className="scroll-mt-24 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-400">Engineering case study</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">The integration is real. The public data is deliberately not.</h2>
        <p className="mt-4 leading-7 text-zinc-400">
          The original application connects a personal Strava account to a Node service and produces a React dashboard. The public experience preserves every meaningful interaction while protecting personal data, avoiding OpenAI spend and accurately disclosing Strava’s current access policy.
        </p>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {capabilities.map(([title, description], index) => (
          <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
            <span className="text-xs font-bold text-orange-500">0{index + 1}</span>
            <h3 className="mt-3 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-zinc-200">Provider constraint, handled honestly</p>
          <p className="mt-1 text-sm text-zinc-500">Live sync remains available to developers through the hidden local integration mode when an active Strava API application is configured.</p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
          Live API subscription-gated
        </span>
      </div>
    </section>
  );
}

function SummaryTable({ title, rows }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80">
      <h3 className="border-b border-zinc-800 px-5 py-4 text-lg font-semibold">{title}</h3>
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
          <tr><th className="px-5 py-3">Period</th><th className="px-3 py-3">Sessions</th><th className="px-3 py-3">Km</th><th className="px-5 py-3">Hours</th></tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.label}><td className="px-5 py-3 font-medium">{row.label}</td><td className="px-3 py-3 text-zinc-400">{row.count}</td><td className="px-3 py-3 text-zinc-400">{row.distance.toFixed(1)}</td><td className="px-5 py-3 text-zinc-400">{hours(row.time)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
