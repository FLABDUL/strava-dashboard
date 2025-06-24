import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export default function StravaDashboard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const dates = activities.map((a) => new Date(a.start_date).toLocaleDateString());
  const distances = activities.map((a) => a.distance / 1000);

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
        pointBackgroundColor: "rgba(75,192,192,1)"
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Your Strava Activities</h1>
      <div className="bg-white p-4 shadow rounded w-full max-w-2xl">
        <h2 className="text-lg font-medium mb-2 text-black">Distance Over Time</h2>
        <div style={{ width: "100%", height: "400px" }}>
          <Line data={data} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
      </div>
      <a href="/auth/strava">
        <button className="bg-blue-500 text-white px-4 py-2 mt-4 rounded">Connect to Strava</button>
      </a>
    </div>
  );
}
