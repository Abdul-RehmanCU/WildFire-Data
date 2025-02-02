"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dynamic from "next/dynamic";

// Leaflet components (dynamically loaded for Next.js)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

import L, { Map } from "leaflet";

type FirePrediction = {
  time: string;
  location: { latitude: number; longitude: number };
  risk_factors: {
    fire_probability: number;
    temperature: number;
    humidity: number;
    wind_speed: number;
  };
};

export default function FutureWildfires() {
  const [firePredictions, setFirePredictions] = useState<{ [key: string]: FirePrediction[] }>({});
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [noLocalData, setNoLocalData] = useState(false); // NEW: if "predictionsData" is missing

  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedFire, setSelectedFire] = useState<{ date: string; index: number } | null>(null);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        setLoading(true);

        // 1) Check localStorage for raw CSV
        const storedPred = localStorage.getItem("predictionsData");
        if (!storedPred) {
          console.log("No predictions data found in localStorage.");
          setNoLocalData(true);  // Mark that we have none
          setLoading(false);
          return;
        }

        // 2) Parse the CSV rows
        const rawData = JSON.parse(storedPred);

        // 3) Call Flask endpoint with the raw data
        const response = await fetch("http://localhost:5000/api/p2/get_predictions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawData }),
        });
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        // 4) Parse the JSON
        const finalJson = await response.json();
        setFirePredictions(finalJson.predictions || {});
      } catch (err) {
        console.error("Error fetching wildfire predictions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
  }, []);

  // Convert date string to Date object
  const parseDate = (dateString: string) => new Date(dateString);

  // Filter by start/end date
  const filteredPredictions = (startDate && endDate)
    ? Object.entries(firePredictions).filter(([date]) => {
        const d = parseDate(date);
        return d >= startDate && d <= endDate;
      })
    : Object.entries(firePredictions);

  // Reset filters
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedLocation(null);
    setSelectedFire(null);
  };

  // Leaflet icons
  const fireIcon = new L.Icon({
    iconUrl: "/fire-icon.png",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

  const highlightedFireIcon = new L.Icon({
    iconUrl: "/fire-icon.png",
    iconSize: [50, 50],
    iconAnchor: [17.5, 17.5],
  });

  // Card click => focus map
  const handleCardClick = (date: string, index: number, location: { latitude: number; longitude: number }) => {
    setSelectedLocation([location.latitude, location.longitude]);
    setSelectedFire({ date, index });
    setShowMap(true);
  };

  // 1) If still loading, just show "Loading..."
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-700">
        <p className="text-lg">Loading wildfire data...</p>
      </div>
    );
  }

  // 2) If not loading, but no local data => show message (like in StatisticsPage)
  if (!loading && noLocalData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-800">
        <h2 className="text-2xl font-bold mb-4">No Predictions Data Found</h2>
        <p>Please upload your CSV data first.</p>
      </div>
    );
  }

  // 3) Otherwise, we have data. Render the normal UI
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6 ml-64">
      {/* Title & Date Filters */}
      <motion.h1
        className="text-4xl font-bold text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Future Wildfire Predictions
      </motion.h1>

      <div className="mb-6 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
        <DatePicker
          selected={startDate}
          onChange={setStartDate}
          placeholderText="Start Date"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-md focus:outline-none"
        />
        <DatePicker
          selected={endDate}
          onChange={setEndDate}
          placeholderText="End Date"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-md focus:outline-none"
        />
        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300"
        >
          Reset
        </button>
        <button
          onClick={() => setShowMap(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          View Full Map 🗺️
        </button>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {filteredPredictions.length > 0 ? (
          filteredPredictions.map(([date, predictions]) =>
            predictions.map((prediction, index) => (
              <motion.div
                key={`${date}-${index}`}
                className={`bg-white shadow-lg rounded-lg p-6 flex flex-col items-center w-full border ${
                  selectedFire?.date === date && selectedFire?.index === index
                    ? "border-4 border-blue-500 scale-105"
                    : "border-gray-300"
                }`}
                onClick={() => handleCardClick(date, index, prediction.location)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-xl font-semibold mb-2">{`🔥 Wildfire Risk: ${(prediction.risk_factors.fire_probability * 100).toFixed(
                  1
                )}%`}</h2>
                <p className="text-gray-600 text-lg">{date}</p>

                <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md mt-4 text-gray-800">
                  <tbody>
                    <tr className="bg-gray-100">
                      <td className="px-4 py-2 font-semibold">Time</td>
                      <td className="px-4 py-2">{prediction.time}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold">Temperature</td>
                      <td className="px-4 py-2">{prediction.risk_factors.temperature}°C</td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td className="px-4 py-2 font-semibold">Humidity</td>
                      <td className="px-4 py-2">{prediction.risk_factors.humidity}%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold">Wind Speed</td>
                      <td className="px-4 py-2">{prediction.risk_factors.wind_speed} km/h</td>
                    </tr>
                  </tbody>
                </table>
              </motion.div>
            ))
          )
        ) : (
          <p className="text-gray-500 text-lg">No wildfire predictions found in this date range.</p>
        )}
      </motion.div>

      {/* Full Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col justify-center items-center">
          <button
            onClick={() => setShowMap(false)}
            className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 z-50"
          >
            Close Map
          </button>
          <MapContainer
            center={selectedLocation || [44.5, -72.5]}
            zoom={selectedLocation ? 10 : 8}
            style={{ width: "90%", height: "80%" }}
            whenReady={(mapInstance: { target: Map }) => {
              const map = mapInstance.target;
              const bounds = new L.LatLngBounds(
                filteredPredictions.flatMap(([_, preds]) =>
                  preds.map((p) => [p.location.latitude, p.location.longitude] as [number, number])
                )
              );

              if (selectedLocation) {
                map.setView(selectedLocation, 10, { animate: true });
              } else {
                map.fitBounds(bounds.pad(0.1));
              }
            }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredPredictions.map(([date, predictions]) =>
              predictions.map((prediction, index) => (
                <Marker
                  key={`${date}-${index}`}
                  position={[prediction.location.latitude, prediction.location.longitude]}
                  icon={
                    selectedFire?.date === date && selectedFire?.index === index
                      ? highlightedFireIcon
                      : fireIcon
                  }
                >
                  <Popup>
                    <div className="flex flex-col items-start space-y-2">
                      <h3 className="font-bold">🔥 Wildfire Info</h3>
                      <p>
                        <strong>Date:</strong> {date}
                      </p>
                      <p>
                        <strong>Time:</strong> {prediction.time}
                      </p>
                      <p>
                        <strong>Probability:</strong>{" "}
                        {(prediction.risk_factors.fire_probability * 100).toFixed(1)}%
                      </p>
                      <p>
                        <strong>Temperature:</strong> {prediction.risk_factors.temperature}°C
                      </p>
                      <p>
                        <strong>Humidity:</strong> {prediction.risk_factors.humidity}%
                      </p>
                      <p>
                        <strong>Wind Speed:</strong> {prediction.risk_factors.wind_speed} km/h
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))
            )}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
