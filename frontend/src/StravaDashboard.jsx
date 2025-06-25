import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from "chart.js";
import { getISOWeek } from "date-fns";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

export default function StravaDashboard() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedSport, setSelectedSport] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showingMapIndex, setShowingMapIndex] = useState(null);

  useEffect(() => {
    async function fetchActivities() {
      setLoading(true);
      try {
        const response = await axios.get("/api/activities");
        setActivities(response.data);
        setFilteredActivities(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          await axios.get("/auth/refresh");
          const response = await axios.get("/api/activities");
          setActivities(response.data);
          setFilteredActivities(response.data);
        } else {
          console.error("Error fetching activities", error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, []);

  useEffect(() => {
    if (selectedSport === "All") {
      setFilteredActivities(activities);
    } else {
      setFilteredActivities(
        activities.filter((a) => a.type === selectedSport)
      );
    }
  }, [selectedSport, activities]);

  if (loading) return <div className="p-4 text-center">Loading your activities...</div>;

  // --- Overall summary ---
  const totalDistance = filteredActivities.reduce((sum, a) => sum + a.distance, 0) / 1000;
  const totalTime = filteredActivities.reduce((sum, a) => sum + a.moving_time, 0) / 3600;

  // --- Weekly summary ---
  const weeklySummary = filteredActivities.reduce((acc, a) => {
    const weekNum = getISOWeek(new Date(a.start_date));
    acc[weekNum] = acc[weekNum] || { distance: 0, time: 0, count: 0 };
    acc[weekNum].distance += a.distance / 1000;
    acc[weekNum].time += a.moving_time;
    acc[weekNum].count++;
    return acc;
  }, {});
  const weeklySummaryArray = Object.keys(weeklySummary).map((weekNum) => ({
    week: `Week ${weekNum}`,
    ...weeklySummary[weekNum],
  }));

  // --- Monthly summary ---
  const monthlySummary = filteredActivities.reduce((acc, a) => {
    const date = new Date(a.start_date);
    const month = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    acc[month] = acc[month] || { distance: 0, time: 0, count: 0 };
    acc[month].distance += a.distance / 1000;
    acc[month].time += a.moving_time;
    acc[month].count++;
    return acc;
  }, {});
  const monthlySummaryArray = Object.keys(monthlySummary).map((month) => ({
    month,
    ...monthlySummary[month],
  }));

  // Distance-over-time data
  const distanceData = {
    labels: filteredActivities.map((a) => new Date(a.start_date).toLocaleDateString()),
    datasets: [
      {
        label: "Distance (km)",
        data: filteredActivities.map((a) => a.distance / 1000),
        fill: false,
      },
    ],
  };

  const handleShowMap = (idx) => setShowingMapIndex(idx === showingMapIndex ? null : idx);

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center space-y-8">
      <h1 className="text-2xl font-bold">Your Strava Activities</h1>

      {/* Filter Dropdown */}
      <div>
        <label className="font-medium mr-2">Filter by Activity Type:</label>
        <select value={selectedSport} onChange={(e) => setSelectedSport(e.target.value)}>
          <option value="All">All</option>
          <option value="Run">Run</option>
          <option value="Ride">Ride</option>
          <option value="Swim">Swim</option>
        </select>
      </div>

      {/* Overall Summary */}
      <div className="bg-white p-4 rounded shadow w-full max-w-4xl overflow-x-auto text-black">
        <h2 className="text-lg font-medium mb-2">Overall Summary</h2>
        <p>Total Activities: {filteredActivities.length}</p>
        <p>Total Distance: {totalDistance.toFixed(2)} km</p>
        <p>Total Time: {totalTime.toFixed(2)} hrs</p>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white p-4 rounded shadow w-full max-w-4xl overflow-x-auto text-black">
        <h2 className="text-lg font-medium mb-2">Weekly Summary</h2>
        <table className="min-w-full border border-gray-200 text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Week</th>
              <th className="p-2 text-left">Activities</th>
              <th className="p-2 text-left">Distance (km)</th>
              <th className="p-2 text-left">Time (hrs)</th>
            </tr>
          </thead>
          <tbody>
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
      <div className="bg-white p-4 rounded shadow w-full max-w-4xl overflow-x-auto text-black">
        <h2 className="text-lg font-medium mb-2">Monthly Summary</h2>
        <table className="min-w-full border border-gray-200 text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Month</th>
              <th className="p-2 text-left">Activities</th>
              <th className="p-2 text-left">Distance (km)</th>
              <th className="p-2 text-left">Time (hrs)</th>
            </tr>
          </thead>
          <tbody>
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

      {/* Distance Over Time */}
      <div className="bg-white p-4 rounded shadow w-full max-w-4xl overflow-x-auto text-black">
        <h2 className="text-lg font-medium mb-2">Distance Over Time</h2>
        <div style={{ height: "300px", width: "100%" }}>
          <Line data={distanceData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>


      { }
      <div className="bg-white p-4 rounded shadow w-full max-w-4xl overflow-x-auto text-black">
        <h2 className="text-lg font-medium mb-2">Activity List</h2>
        <table className="min-w-full border border-gray-200 text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Distance (km)</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Map</th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((a, idx) => (
              <tr key={a.id || idx}>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{new Date(a.start_date).toLocaleDateString()}</td>
                <td className="p-2">{(a.distance / 1000).toFixed(2)}</td>
                <td className="p-2">{a.type}</td>
                <td className="p-2">
                  {a.map && a.map.summary_polyline ? (
                    <>
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded"
                        onClick={() => handleShowMap(idx)}
                      >
                        {showingMapIndex === idx ? "Hide map" : "Show map"}
                      </button>
                      {showingMapIndex === idx && (
                        <div className="h-64 mt-2">
                          <MapContainer
                            bounds={polyline.decode(a.map.summary_polyline)}
                            style={{ width: "100%", height: "250px" }}
                          >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Polyline
                              positions={polyline.decode(a.map.summary_polyline)}
                              color="blue"
                              weight={3}
                            />
                          </MapContainer>
                        </div>
                      )}
                    </>
                  ) : (
                    "N/A"
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
