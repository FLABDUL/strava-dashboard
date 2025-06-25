import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export default function StravaDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("All");

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const response = await axios.get("/api/activities");
        setActivities(response.data);
      } catch (error) {
        console.error("Error fetching activities", error);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading your activities...</div>;

  const types = Array.from(new Set(activities.map((a) => a.type)));
  const filteredActivities =
    selectedType === "All" ? activities : activities.filter((a) => a.type === selectedType);

  const totalDistanceKm = filteredActivities.reduce((sum, a) => sum + a.distance, 0) / 1000;
  const totalTimeSec = filteredActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0);
  const totalActivities = filteredActivities.length;
  const totalTimeHours = (totalTimeSec / 3600).toFixed(1);

  const dates = filteredActivities.map((a) => new Date(a.start_date).toLocaleDateString());
  const distances = filteredActivities.map((a) => a.distance / 1000);

  const data = {
    labels: dates,
    datasets: [
      {
        label: "Distance (km)",
        data: distances,
        fill: false,
        borderWidth: 2,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        pointRadius: 4,
        pointBackgroundColor: "rgba(75,192,192,1)",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Your Strava Activities</h1>

      {/* Summary */}
      <div className="bg-white p-4 shadow rounded w-full max-w-2xl mb-4">
        <h2 className="text-lg font-medium mb-2 text-black">Summary</h2>
        <div className="flex justify-between text-black text-center">
          <div>
            <p className="text-xl font-bold">{totalActivities}</p>
            <p className="text-sm">Activities</p>
          </div>
          <div>
            <p className="text-xl font-bold">{totalDistanceKm.toFixed(2)} km</p>
            <p className="text-sm">Distance</p>
          </div>
          <div>
            <p className="text-xl font-bold">{totalTimeHours} hrs</p>
            <p className="text-sm">Time</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 shadow rounded w-full max-w-2xl mb-4">
        <label className="block mb-2 font-medium text-black">Filter by Activity Type:</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="All">All</option>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Distance Chart */}
      <div className="bg-white p-4 shadow rounded w-full max-w-2xl mb-8">
        <h2 className="text-lg font-medium mb-2 text-black">Distance Over Time</h2>
        <div style={{ width: "100%", height: "400px" }}>
          <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white p-4 shadow rounded w-full max-w-2xl overflow-x-auto">
        <h2 className="text-lg font-medium mb-2 text-black">Activity List</h2>
        <table className="w-full border-collapse border border-gray-200 text-black text-sm">
          <thead>
            <tr>
              <th className="border border-gray-200 p-2 text-left">Name</th>
              <th className="border border-gray-200 p-2 text-left">Date</th>
              <th className="border border-gray-200 p-2 text-left">Distance (km)</th>
              <th className="border border-gray-200 p-2 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((a) => (
              <tr key={a.id || a.start_date}>
                <td className="border border-gray-200 p-2">{a.name}</td>
                <td className="border border-gray-200 p-2">{new Date(a.start_date).toLocaleDateString()}</td>
                <td className="border border-gray-200 p-2">{(a.distance / 1000).toFixed(2)}</td>
                <td className="border border-gray-200 p-2">{a.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a href="/auth/strava">
        <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded">Connect to Strava</button>
      </a>
    </div>
  );
}
