"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-6">
      {/* Title Section */}
      <motion.h1 
        className="text-5xl font-bold text-gray-900 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Welcome to Wildfire Visualizer
      </motion.h1>
      
      <motion.p 
        className="text-lg text-gray-700 max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        A powerful tool to analyze wildfire data, track operational efficiency, 
        and visualize key statistics in an interactive dashboard.
      </motion.p>

      {/* Features Section */}
      <motion.div 
        className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Feature 1 */}
        <motion.div 
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center text-center"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl">🔥</span>
          <h3 className="text-xl font-semibold mt-3">Upload Wildfire Data</h3>
          <p className="text-gray-600 text-sm mt-2">
            Easily upload CSV files to analyze wildfire incidents and severity levels.
          </p>
        </motion.div>

        {/* Feature 2 */}
        <motion.div 
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center text-center"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl">📊</span>
          <h3 className="text-xl font-semibold mt-3">Visualize Key Statistics</h3>
          <p className="text-gray-600 text-sm mt-2">
            View detailed charts on fires addressed, operational costs, and damage estimates.
          </p>
        </motion.div>

        {/* Feature 3 */}
        <motion.div 
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center text-center"
          whileHover={{ scale: 1.05 }}
        >
          <span className="text-3xl">📍</span>
          <h3 className="text-xl font-semibold mt-3">Track Resource Usage</h3>
          <p className="text-gray-600 text-sm mt-2">
            Monitor firefighting resources like helicopters, crews, and smoke jumpers.
          </p>
        </motion.div>
      </motion.div>

      {/* How it Works Section */}
      <motion.div 
        className="mt-16 max-w-4xl text-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900">How it Works</h2>
        <ul className="mt-4 space-y-3 text-lg text-gray-700">
          <li>✅ Step 1: Upload a CSV file with wildfire data.</li>
          <li>✅ Step 2: View analyzed statistics on the dashboard.</li>
          <li>✅ Step 3: Make data-driven decisions based on insights.</li>
        </ul>
      </motion.div>

      {/* Upload Button */}
      <motion.button
        className="mt-12 px-8 py-4 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700 transition duration-300 text-lg"
        whileHover={{ scale: 1.1 }}
        onClick={() => router.push("/upload-csv")}
      >
        Upload a CSV File
      </motion.button>
    </div>
  );
}
