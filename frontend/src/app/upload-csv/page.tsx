'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { Settings } from 'lucide-react';

import FileDropzone from '../components/FileDropZone';
import SettingsPanel from '../components/SettingPanels';

type UploadType = 'statistics' | 'predictions';

// Basic shapes for your settings (if you want to keep them)
interface OperationalUnit {
  name: string;
  deploymentTime: number; // in minutes
  costPerOperation: number;
  unitsAvailable: number;
}

interface DamageCosts {
  low: number;
  medium: number;
  high: number;
}

// Default settings for your panel
const DEFAULT_OPERATIONAL_UNITS: OperationalUnit[] = [
  { name: 'Smoke Jumpers', deploymentTime: 30, costPerOperation: 5000, unitsAvailable: 5 },
  { name: 'Fire Engines', deploymentTime: 60, costPerOperation: 2000, unitsAvailable: 10 },
  { name: 'Helicopters', deploymentTime: 45, costPerOperation: 8000, unitsAvailable: 3 },
  { name: 'Tanker Planes', deploymentTime: 120, costPerOperation: 15000, unitsAvailable: 2 },
  { name: 'Ground Crews', deploymentTime: 90, costPerOperation: 3000, unitsAvailable: 8 },
];

const DEFAULT_DAMAGE_COSTS: DamageCosts = {
  low: 50000,
  medium: 100000,
  high: 200000,
};

/** Renders a small table preview showing first 5 & last 5 rows (or all if <= 10). */
function DataPreviewTable({ data }: { data: any[] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }


  const totalRows = data.length;
  let previewRows: any[] = [];

  if (totalRows <= 10) {
    previewRows = data;
  } else {
    previewRows = [...data.slice(0, 5), ...data.slice(-5)];
  }

  const columns = Object.keys(previewRows[0]);

  return (
    <div className="my-4 overflow-x-auto">
      <h4 className="font-semibold mb-2">Data Preview</h4>
      <table className="min-w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-2 py-1 border-b border-gray-300 text-left">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {previewRows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-2 py-1 border-b border-gray-200">
                  {String(row[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {totalRows > 10 && (
        <p className="text-xs text-gray-500 mt-2">
          Showing first 5 and last 5 rows (total {totalRows} rows).
        </p>
      )}
    </div>
  );
}

export default function UploadPage() {
  // -----------------------------
  // Upload / Processing States
  // -----------------------------
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<UploadType>('statistics');
  const [error, setError] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Toast for "settings saved"
  const [settingsSaved, setSettingsSaved] = useState(false);

  // -----------------------------
  // Settings State
  // -----------------------------
  const [operationalUnits, setOperationalUnits] = useState<OperationalUnit[]>(DEFAULT_OPERATIONAL_UNITS);
  const [damageCosts, setDamageCosts] = useState<DamageCosts>(DEFAULT_DAMAGE_COSTS);

  // -----------------------------
  // Raw CSV Data
  // -----------------------------
  const [statisticsRawData, setStatisticsRawData] = useState<any[] | null>(null);
  const [predictionsRawData, setPredictionsRawData] = useState<any[] | null>(null);

  // -----------------------------
  // On mount, load from localStorage
  // -----------------------------
  useEffect(() => {
    // Load saved settings
    const storedUnits = localStorage.getItem('operationalUnits');
    const storedCosts = localStorage.getItem('damageCosts');
    if (storedUnits) setOperationalUnits(JSON.parse(storedUnits));
    if (storedCosts) setDamageCosts(JSON.parse(storedCosts));

    // Load raw CSV data if stored
    const storedStats = localStorage.getItem('statisticsData');
    const storedPred = localStorage.getItem('predictionsData');
    if (storedStats) setStatisticsRawData(JSON.parse(storedStats));
    if (storedPred) setPredictionsRawData(JSON.parse(storedPred));
  }, []);

  // -----------------------------
  // Save / Reset Settings
  // -----------------------------
  const handleSaveSettings = (newUnits: OperationalUnit[], newCosts: DamageCosts) => {
    setOperationalUnits(newUnits);
    setDamageCosts(newCosts);

    localStorage.setItem('operationalUnits', JSON.stringify(newUnits));
    localStorage.setItem('damageCosts', JSON.stringify(newCosts));

    // Show "saved" toast for a few seconds
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handleResetSettings = () => {
    setOperationalUnits(DEFAULT_OPERATIONAL_UNITS);
    setDamageCosts(DEFAULT_DAMAGE_COSTS);

    localStorage.removeItem('operationalUnits');
    localStorage.removeItem('damageCosts');
  };

  // -----------------------------
  // File Parsing
  // -----------------------------
  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setProcessing(true);
    setError('');
    setCompleted(false);

    Papa.parse(file, {
      complete: async (results) => {
        try {
          // Validate CSV headers
          const headers = results.meta.fields || [];
          const requiredStats = ['timestamp', 'fire_start_time', 'location', 'severity'];
          const requiredPred = [
            'timestamp',
            'temperature',
            'humidity',
            'wind_speed',
            'precipitation',
            'vegetation_index',
            'human_activity_index',
            'latitude',
            'longitude',
          ];

          const required = uploadType === 'statistics' ? requiredStats : requiredPred;
          const missing = required.filter((h) => !headers.includes(h));
          if (missing.length > 0) {
            throw new Error(`Missing required columns: ${missing.join(', ')}`);
          }

          // "rawData" from PapaParse
          const rawData = results.data as any[];

          // Store in local storage
          if (uploadType === 'statistics') {
            setStatisticsRawData(rawData);
            localStorage.setItem('statisticsData', JSON.stringify(rawData));
            console.log('Saved Statistics rawData:', rawData);
          } else {
            setPredictionsRawData(rawData);
            localStorage.setItem('predictionsData', JSON.stringify(rawData));
            console.log('Saved Predictions rawData:', rawData);
          }

          await new Promise((res) => setTimeout(res, 1000));

          setProcessing(false);
          setCompleted(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error processing file');
          setProcessing(false);
        }
      },
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFile(acceptedFiles[0]);
      }
    },
    [uploadType]
  );

  // -----------------------------
  // Remove Stored Data (Delete Button)
  // -----------------------------
  const handleRemoveStatisticsData = () => {
    localStorage.removeItem('statisticsData');
    setStatisticsRawData(null);
    setCompleted(false);
  };

  const handleRemovePredictionsData = () => {
    localStorage.removeItem('predictionsData');
    setPredictionsRawData(null);
    setCompleted(false);
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="flex flex-col items-center space-y-8 p-6">
      {/* Toast for "Settings Saved" - top right */}
      <div className="fixed top-4 right-4 z-50">
        <AnimatePresence>
          {settingsSaved && (
            <motion.div
              initial={{ x: 200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-green-100 text-green-700 py-2 px-4 rounded shadow"
            >
              Settings saved successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Upload CSV Data</h2>

        {/* Upload Type Selection */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => {
              setUploadType('statistics');
              setShowSettings(false);
            }}
            className={`px-4 py-2 rounded-lg transition ${
              uploadType === 'statistics'
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Statistics Data
          </button>
          <button
            onClick={() => {
              setUploadType('predictions');
              setShowSettings(false);
            }}
            className={`px-4 py-2 rounded-lg transition ${
              uploadType === 'predictions'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Predictions Data
          </button>
        </div>

        {/* If we already have *some* data for the type, show table + remove button */}
        {uploadType === 'statistics' && statisticsRawData ? (
          <div className="p-4 mb-4 border rounded bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Statistics Data Already Uploaded</h3>
            <DataPreviewTable data={statisticsRawData} />
            <button
              onClick={handleRemoveStatisticsData}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Remove Statistics Data
            </button>
          </div>
        ) : uploadType === 'predictions' && predictionsRawData ? (
          <div className="p-4 mb-4 border rounded bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Predictions Data Already Uploaded</h3>
            <DataPreviewTable data={predictionsRawData} />
            <button
              onClick={handleRemovePredictionsData}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Remove Predictions Data
            </button>
          </div>
        ) : (
          // Otherwise, show the "dropzone" if we do NOT have data for the chosen type
          !processing && (
            <FileDropzone onDrop={onDrop} />
          )
        )}

        {/* Settings Toggle (only for "statistics") */}
        {uploadType === 'statistics' && !processing && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <Settings size={20} />
              {showSettings ? 'Hide Settings' : 'Configure Default Values'}
            </button>
          </div>
        )}

        {/* Settings Panel (Statistics only) */}
        {uploadType === 'statistics' && showSettings && (
          <SettingsPanel
            initialOperationalUnits={operationalUnits}
            initialDamageCosts={damageCosts}
            defaultOperationalUnits={DEFAULT_OPERATIONAL_UNITS}
            defaultDamageCosts={DEFAULT_DAMAGE_COSTS}
            onSave={handleSaveSettings}
            onReset={handleResetSettings}
          />
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {/* Processing UI */}
        {processing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-4"
          >
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Processing {selectedFile?.name}...</p>
          </motion.div>
        )}

        {/* Success message if completed */}
        {!processing && completed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center p-4 text-green-600"
          >
            <div className="text-4xl mb-2">✓</div>
            <p>File processed successfully!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
