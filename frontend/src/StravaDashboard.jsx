import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import { getISOWeek } from "date-fns";
import ActivityMapPreview from "./ActivityMapPreview";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export default function StravaDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [showMap, setShowMap] = useState({});

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE}/api/activities`);
        setActivities(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          await axios.get(`${import.meta.env.VITE_API_BASE}/auth/refresh`);
          const resp = await axios.get(`${import.meta.env.VITE_API_BASE}/api/activities`);
          setActivities(resp.data);
        } else {
          console.error("Error fetching activities", error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  if (loading) return <div className="p-8 text-center text-white">Loading your activities...</div>;

  // Filter activities
  const filteredActivities = filterType === "All" ? activities : activities.filter((a) => a.type === filterType);

  // Summaries
  const overall = filteredActivities.reduce(
    (acc, a) => {
      acc.count++;
      acc.distance += a.distance / 1000;
      acc.time += a.moving_time;
      return acc;
    },
    { count: 0, distance: 0, time: 0 }
  );

  const weeklySummary = filteredActivities.reduce((acc, a) => {
    const weekNum = getISOWeek(new Date(a.start_date));
    acc[weekNum] = acc[weekNum] || { distance: 0, time: 0, count: 0 };
    acc[weekNum].distance += a.distance / 1000;
    acc[weekNum].time += a.moving_time;
    acc[weekNum].count++;
    return acc;
  }, {});

  const weeklySummaryArray = Object.keys(weeklySummary).map((weekNum) => ({ week: `Week ${weekNum}`, ...weeklySummary[weekNum] }));

  const monthlySummary = filteredActivities.reduce((acc, a) => {
    const monthStr = new Date(a.start_date).toLocaleString('default', { month: 'short', year: 'numeric' });
    acc[monthStr] = acc[monthStr] || { distance: 0, time: 0, count: 0 };
    acc[monthStr].distance += a.distance / 1000;
    acc[monthStr].time += a.moving_time;
    acc[monthStr].count++;
    return acc;
  }, {});
  const monthlySummaryArray = Object.keys(monthlySummary).map((month) => ({ month, ...monthlySummary[month] }));

  // Graph Data
  const chartData = {
    labels: filteredActivities.map((a) => new Date(a.start_date).toLocaleDateString()),
    datasets: [
      {
        label: "Distance (km)",
        data: filteredActivities.map((a) => a.distance / 1000),
        borderColor: "#FC4C02",
        backgroundColor: "rgba(252,76,2,0.2)",
        tension: 0.1,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="min-h-screen bg-black p-8 flex flex-col items-center space-y-8 text-white">
      <h1 className="text-3xl font-bold text-white">Your Strava Activities</h1>

      {/* Filter */}
      <div className="w-full max-w-4xl flex items-center space-x-2">
        <span>Filter by Activity Type:</span>
        <select
          className="bg-black border border-orange-500 text-white rounded px-2"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option>All</option>
          <option>Run</option>
          <option>Ride</option>
          <option>Swim</option>
        </select>
      </div>

      {/* Overall Summary */}
      <div className="bg-black border border-orange-500 p-4 rounded shadow w-full max-w-4xl text-white">
        <h2 className="text-xl font-semibold mb-2 text-orange-500">Overall Summary</h2>
        <p>Total Activities: {overall.count}</p>
        <p>Total Distance: {overall.distance.toFixed(2)} km</p>
        <p>Total Time: {(overall.time / 3600).toFixed(2)} hrs</p>
      </div>

      {/* Weekly Summary */}
      <div className="bg-black border border-orange-500 p-4 rounded w-full max-w-4xl overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2 text-orange-500">Weekly Summary</h2>
        <table className="min-w-full border border-orange-500 text-white text-sm">
          <thead className="bg-orange-500 text-black font-bold">
            <tr>
              <th className="p-2">Week</th>
              <th className="p-2">Activities</th>
              <th className="p-2">Distance (km)</th>
              <th className="p-2">Time (hrs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-500">
            {weeklySummaryArray.map((w) => (
              <tr key={w.week}>
                <td className="p-2">{w.week}</td>
                <td className="p-2">{w.count}</td>
                <td className="p-2">{w.distance.toFixed(2)}</td>
                <td className="p-2">{(w.time / 3600).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly Summary */}
      <div className="bg-black border border-orange-500 p-4 rounded w-full max-w-4xl overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2 text-orange-500">Monthly Summary</h2>
        <table className="min-w-full border border-orange-500 text-white text-sm">
          <thead className="bg-orange-500 text-black font-bold">
            <tr>
              <th className="p-2">Month</th>
              <th className="p-2">Activities</th>
              <th className="p-2">Distance (km)</th>
              <th className="p-2">Time (hrs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-500">
            {monthlySummaryArray.map((m) => (
              <tr key={m.month}>
                <td className="p-2">{m.month}</td>
                <td className="p-2">{m.count}</td>
                <td className="p-2">{m.distance.toFixed(2)}</td>
                <td className="p-2">{(m.time / 3600).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Graph */}
      <div className="bg-black border border-orange-500 p-4 rounded w-full max-w-4xl">
        <h2 className="text-xl font-semibold mb-2 text-orange-500">Distance Over Time</h2>
        <div className="w-full h-64"> {/* fixed height */}
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-black border border-orange-500 p-4 rounded w-full max-w-4xl overflow-x-auto">
        <h2 className="text-xl font-semibold mb-2 text-orange-500">Activity List</h2>
        <table className="min-w-full border border-orange-500 text-white text-sm">
          <thead className="bg-orange-500 text-black font-bold">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Date</th>
              <th className="p-2">Distance (km)</th>
              <th className="p-2">Type</th>
              <th className="p-2">Map</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-500">
            {filteredActivities.map((a) => (
              <tr key={a.id}>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{new Date(a.start_date).toLocaleDateString()}</td>
                <td className="p-2">{(a.distance / 1000).toFixed(2)}</td>
                <td className="p-2">{a.type}</td>
                <td className="p-2">
                  {a.map.summary_polyline ? (
                    <>
                      <button
                        onClick={() => setShowMap((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                        className="bg-orange-500 text-black font-medium px-2 py-1 rounded hover:bg-orange-600"
                      >
                        {showMap[a.id] ? "Hide map" : "Show map"}
                      </button>
                      {showMap[a.id] && (
                        <div className="map-container mt-2 w-full h-64 border border-orange-500 rounded overflow-hidden">
                          <ActivityMapPreview summaryPolyline={a.map.summary_polyline} />
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
