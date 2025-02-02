"use client";

import { useState, useRef, useEffect } from "react";
import PieChart from "@/app/components/PieChart";
import BarChart from "@/app/components/BarChart";
import GroupedBarChart from "@/app/components/StackedBarChart";
import { motion } from "framer-motion";

export default function StatisticsPage() {
  // State initialized with default values
  const [data, setData] = useState({
    total_events: 32,
    fires_addressed: 28,
    fires_missed: 4,
    operational_costs: 123000,
    damage_costs: 550000,
    severity_report: {
      addressed: { low: 13, medium: 10, high: 5 },
      missed: { low: 1, medium: 1, high: 2 },
    },
  });

  useEffect(() => {
    // Fetch data from final_data.json
    fetch('/data/final_data.json')
      .then(response => response.json())
      .then(jsonData => {
        setData({
          total_events: jsonData.total_events,
          fires_addressed: jsonData.fires_addressed,
          fires_missed: jsonData.fires_missed,
          operational_costs: jsonData.operational_costs,
          damage_costs: jsonData.damage_costs,
          severity_report: jsonData.severity_report
        });
      })
      .catch(error => console.error('Error loading data:', error));
  }, []);

  const [showDetails, setShowDetails] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null); // Reference to the table section
  const topRef = useRef<HTMLDivElement>(null); // Reference to the top section

  // Handle toggling view details and scrolling
  const handleViewDetails = () => {
    setShowDetails((prev) => {
      if (!prev) {
        // If opening details, scroll to table
        setTimeout(() => {
          tableRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else {
        // If hiding details, scroll back to top
        setTimeout(() => {
          topRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
      return !prev;
    });
  };

  return (
    <div className="flex flex-col items-center space-y-8 min-h-screen text-gray-900 p-6">
      {/* Page Title */}
      <motion.h1
        ref={topRef}
        className="text-4xl font-bold text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Wildfire Statistics
      </motion.h1>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
        {/* Pie Chart */}
        <motion.div
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center md:col-span-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">Fires Addressed vs Missed</h2>
          <PieChart
            data={[
              { label: "Addressed", value: data.fires_addressed },
              { label: "Missed", value: data.fires_missed },
            ]}
          />
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center md:col-span-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-xl font-semibold mb-4">Operational & Damage Costs</h2>
          <BarChart
            data={[
              { label: "Operational Costs", value: data.operational_costs },
              { label: "Damage Costs", value: data.damage_costs },
            ]}
          />
        </motion.div>

        {/* Grouped Bar Charts */}
        <motion.div
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center md:col-span-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-xl font-semibold mb-4">Fires Addressed by Severity</h2>
          <GroupedBarChart
            data={[
              {
                category: "Fires Addressed",
                low: data.severity_report.addressed.low,
                medium: data.severity_report.addressed.medium,
                high: data.severity_report.addressed.high,
              },
            ]}
          />
        </motion.div>

        <motion.div
          className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center md:col-span-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-xl font-semibold mb-4">Fires Missed by Severity</h2>
          <GroupedBarChart
            data={[
              {
                category: "Fires Missed",
                low: data.severity_report.missed.low,
                medium: data.severity_report.missed.medium,
                high: data.severity_report.missed.high,
              },
            ]}
          />
        </motion.div>
      </div>

      {/* View More Details Button */}
      <button
        className="mt-8 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-300"
        onClick={handleViewDetails}
      >
        {showDetails ? "Hide Details" : "View More Details"}
      </button>

      {/* Detailed Table */}
      {showDetails && (
        <motion.div
          ref={tableRef}
          className="bg-white shadow-lg rounded-lg p-6 max-w-6xl w-full mt-6 overflow-x-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">Detailed Wildfire Statistics</h2>
          <table className="w-full border-collapse shadow-lg overflow-hidden rounded-lg">
            <thead className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 text-gray-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-white">
              {/* Overview Section */}
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-6 py-4 text-gray-800 font-semibold">Overview</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Total Events</td>
                <td className="px-6 py-4 text-gray-600">{data.total_events}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Fires Addressed</td>
                <td className="px-6 py-4 text-gray-600">{data.fires_addressed}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Fires Missed</td>
                <td className="px-6 py-4 text-gray-600">{data.fires_missed}</td>
              </tr>

              {/* Cost Analysis Section */}
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-6 py-4 text-gray-800 font-semibold">Cost Analysis</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Operational Costs</td>
                <td className="px-6 py-4 text-gray-600">${data.operational_costs.toLocaleString()}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Damage Costs</td>
                <td className="px-6 py-4 text-gray-600">${data.damage_costs.toLocaleString()}</td>
              </tr>

              {/* Severity Section Header */}
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-6 py-4 text-gray-800 font-semibold">Severity Report</td>
              </tr>

              {/* Severity (Addressed) */}
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f1d405] mr-3"></div>
                  Severity: Low (Addressed)
                </td>
                <td className="px-6 py-4 text-gray-600">{data.severity_report.addressed.low}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f78a08] mr-3"></div>
                  Severity: Medium (Addressed)
                </td>
                <td className="px-6 py-4 text-gray-600">{data.severity_report.addressed.medium}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#cc0000] mr-3"></div>
                  Severity: High (Addressed)
                </td>
                <td className="px-6 py-4 text-gray-600">{data.severity_report.addressed.high}</td>
              </tr>

              {/* Severity (Missed) */}
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f1d405] mr-3"></div>
                  Severity: Low (Missed)
                </td>
                <td className="px-6 py-4 text-gray-600">{data.severity_report.missed.low}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f78a08] mr-3"></div>
                  Severity: Medium (Missed)
                </td>
                <td className="px-6 py-4 text-gray-600">{data.severity_report.missed.medium}</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#cc0000] mr-3"></div>
                  Severity: High (Missed)
                </td>
                <td className="px-6 py-4 text-gray-600">{data.severity_report.missed.high}</td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}