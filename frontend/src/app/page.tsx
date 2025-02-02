"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
      {/* Title Section */}
      <motion.h1 
        className="text-6xl font-extrabold text-gray-900 mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Wildfire Resource Deployer & Predictor
      </motion.h1>
      
      <motion.p 
        className="text-lg text-gray-600 max-w-3xl text-center leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        Analyze wildfire data, track operational efficiency, visualize key statistics, and predict potential wildfire events—all in one interactive dashboard.
      </motion.p>

      {/* Features Section */}
      <motion.div 
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[
          { icon: "🔥", title: "Upload Wildfire Data", description: "Easily upload CSV files to analyze wildfire incidents and severity levels." },
          { icon: "📊", title: "Visualize Key Statistics", description: "View detailed charts on fires addressed, operational costs, and damage estimates." },
          { icon: "📍", title: "Predict Future Wildfires", description: "Get forecasts of wildfire risks based on weather and historical data." }
        ].map((feature, index) => (
          <motion.div 
            key={index}
            className="bg-white shadow-md rounded-2xl p-6 flex flex-col items-center text-center transition-all"
            whileHover={{ scale: 1.05, boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" }}
          >
            <span className="text-4xl">{feature.icon}</span>
            <h3 className="text-xl font-semibold mt-4 text-gray-900">{feature.title}</h3>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* How it Works Section */}
      <motion.div 
        className="mt-16 max-w-3xl text-gray-800 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <h2 className="text-2xl font-bold text-gray-900">How it Works</h2>
        <div className="mt-4 flex flex-col space-y-4 text-lg text-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-green-600 text-2xl">✔</span>
            <p>Upload a CSV file with wildfire data.</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-green-600 text-2xl">✔</span>
            <p>View analyzed statistics on the dashboard.</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-green-600 text-2xl">✔</span>
            <p>Make data-driven decisions based on insights.</p>
          </div>
        </div>
      </motion.div>

      {/* Upload Button */}
      <motion.button
        className="mt-12 px-8 py-4 bg-orange-600 text-white font-semibold rounded-md shadow-lg hover:bg-orange-700 transition-transform transform hover:scale-105 text-lg"
        whileHover={{ scale: 1.05 }}
        onClick={() => router.push("/upload-csv")}
      >
        Upload CSV Data
      </motion.button>

    </div>
  );
}
