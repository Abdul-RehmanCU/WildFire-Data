"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import PieChart from "@/app/components/PieChart";
import BarChart from "@/app/components/BarChart";
import GroupedBarChart from "@/app/components/StackedBarChart";
import { motion } from "framer-motion";

export default function StatisticsPage() {
  const router = useRouter()
  const [hasData, setHasData] = useState(false); // NEW: Tracks if we actually found data
  const [data, setData] = useState({
    total_events: 0,
    fires_addressed: 0,
    fires_missed: 0,
    operational_costs: 0,
    damage_costs: 0,
    severity_report: {
      addressed: { low: 0, medium: 0, high: 0 },
      missed: { low: 0, medium: 0, high: 0 },
    },
  });

  const [showDetails, setShowDetails] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  //
  // 1) On mount, read raw data from localStorage -> POST to backend for final report
  //
  useEffect(() => {
    const storedStats = localStorage.getItem("statisticsData");
    if (storedStats) {
      const rawData = JSON.parse(storedStats);
      setHasData(true); // We have data, so set to true

      // Call your backend with that rawData to get the final report
      fetchFinalReport(rawData);
    } else {
      // No data found
      console.log("No statistics raw data found in localStorage.");
    }
  }, []);

  function convertUnitsToPythonFormat(units: any[]): Record<string, any> {
    const result: Record<string, any> = {};
  
    units.forEach(unit => {
      // if userUnits might have .name like "Smoke Jumpers"
      // we create a key "smoke_jumpers"
      const key = unit.name.toLowerCase().replace(/\s+/g, "_");
  
      result[key] = {
        deployment_time_minutes: unit.deploymentTime || unit.deployment_time_minutes || 30,
        cost: unit.costPerOperation || unit.cost || 5000,
        total_units: unit.unitsAvailable || unit.total_units || 5
      };
    });
  
    return result;
  }

  //
  // 2) Fetch final report from the Flask backend
  //
  async function fetchFinalReport(rawDataFromCSV: any[]) {
    try {
      // 1) Load from localStorage
      const storedUnits = localStorage.getItem("operationalUnits");
      const storedCosts = localStorage.getItem("damageCosts");
  
      // 2) Parse them if they exist
      const userUnits = storedUnits ? JSON.parse(storedUnits) : null;
      const userCosts = storedCosts ? JSON.parse(storedCosts) : null;
  
      // 3) Convert userUnits into Python-compatible structure if needed
      //    For example, if your userUnits look like:
      //      { name: "Smoke Jumpers", deploymentTime: 30, costPerOperation: 5000, unitsAvailable: 5 }
      //    Then your Python expects:
      //      { "smoke_jumpers": { "deployment_time_minutes": 30, "cost": 5000, "total_units": 5 } }
      //    But if your userUnits already match the Python naming, skip this step.
  
      const customResources = userUnits ? convertUnitsToPythonFormat(userUnits) : undefined;
      const customDamageCosts = userCosts || undefined; // if already { low, medium, high }, that’s fine
  
      // 4) Build the body object
      const bodyObject: any = {
        rawData: rawDataFromCSV
      };
  
      if (customResources) {
        bodyObject.customResources = customResources;
      }
      if (customDamageCosts) {
        bodyObject.customDamageCosts = customDamageCosts;
      }
  
      // 5) Send the request
      const response = await fetch("http://localhost:5000/api/p1/get_final_report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyObject),
      });
  
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
  
      // 6) Final JSON with stats
      const finalJson = await response.json();
  
      setData({
        total_events: finalJson.total_events,
        fires_addressed: finalJson.fires_addressed,
        fires_missed: finalJson.fires_missed,
        operational_costs: finalJson.operational_costs,
        damage_costs: finalJson.damage_costs,
        severity_report: finalJson.severity_report,
      });
  
      console.log("Successfully fetched final report:", finalJson);
    } catch (error) {
      console.error("Error calling backend /api/p1/get_final_report:", error);
    }
  }

  //
  // 3) Toggle between "Show More" / "Hide" details
  //
  const handleViewDetails = () => {
    setShowDetails((prev) => {
      if (!prev) {
        // If opening details, scroll to table
        setTimeout(() => {
          tableRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else {
        // If hiding details, scroll to top
        setTimeout(() => {
          topRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
      return !prev;
    });
  };

  //
  // If we found no data in localStorage, show a simple message
  //
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-800">
        <h2 className="text-2xl font-bold mb-4">No Statistics Data Found</h2>
        <p>Please upload your CSV data first.</p>
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

  return (
    <div
    className="
      flex flex-col items-center space-y-8
      min-h-screen text-gray-900 p-6
      pt-16       /* So content doesn’t hide behind the mobile (top) navbar */
      lg:pt-6     /* (Optional) reduce top padding on medium+ screens */
      lg:ml-64    /* So content doesn’t hide behind the sidebar on medium+ screens */
    "
  >
      {/* Title */}
      <motion.h1
        ref={topRef}
        className="text-4xl font-bold text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Resource Deploying Optimizer
      </motion.h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
        {/* Pie Chart: Addressed vs Missed */}
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

        {/* Bar Chart: Operational vs Damage Costs */}
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

        {/* Fires Addressed by Severity */}
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

        {/* Fires Missed by Severity */}
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

      {/* View Details Button */}
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
          <h2 className="text-xl font-semibold mb-4">Detailed Wildfire Report</h2>
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
                <td colSpan={2} className="px-6 py-4 text-gray-800 font-semibold">
                  Overview
                </td>
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
                <td colSpan={2} className="px-6 py-4 text-gray-800 font-semibold">
                  Cost Analysis
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Operational Costs</td>
                <td className="px-6 py-4 text-gray-600">
                  ${data.operational_costs.toLocaleString()}
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium">Damage Costs</td>
                <td className="px-6 py-4 text-gray-600">
                  ${data.damage_costs.toLocaleString()}
                </td>
              </tr>

              {/* Severity Section Header */}
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-6 py-4 text-gray-800 font-semibold">
                  Severity Report
                </td>
              </tr>

              {/* Severity: Addressed (Low, Medium, High) */}
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f1d405] mr-3"></div>
                  Severity: Low (Addressed)
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {data.severity_report.addressed.low}
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f78a08] mr-3"></div>
                  Severity: Medium (Addressed)
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {data.severity_report.addressed.medium}
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#cc0000] mr-3"></div>
                  Severity: High (Addressed)
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {data.severity_report.addressed.high}
                </td>
              </tr>

              {/* Severity: Missed (Low, Medium, High) */}
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f1d405] mr-3"></div>
                  Severity: Low (Missed)
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {data.severity_report.missed.low}
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#f78a08] mr-3"></div>
                  Severity: Medium (Missed)
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {data.severity_report.missed.medium}
                </td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="px-6 py-4 text-gray-700 font-medium flex items-center">
                  <div className="w-4 h-4 rounded bg-[#cc0000] mr-3"></div>
                  Severity: High (Missed)
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {data.severity_report.missed.high}
                </td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
