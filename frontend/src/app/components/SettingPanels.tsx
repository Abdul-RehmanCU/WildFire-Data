'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface OperationalUnit {
  name: string;
  deploymentTime: number;
  costPerOperation: number;
  unitsAvailable: number;
}

interface DamageCosts {
  low: number;
  medium: number;
  high: number;
}

interface SettingsPanelProps {
  // Current user settings
  initialOperationalUnits: OperationalUnit[];
  initialDamageCosts: DamageCosts;

  // Defaults for "Reset"
  defaultOperationalUnits: OperationalUnit[];
  defaultDamageCosts: DamageCosts;

  // Callbacks to parent
  onSave: (newUnits: OperationalUnit[], newCosts: DamageCosts) => void;
  onReset: () => void;
}

export default function SettingsPanel({
  initialOperationalUnits,
  initialDamageCosts,
  defaultOperationalUnits,
  defaultDamageCosts,
  onSave,
  onReset,
}: SettingsPanelProps) {
  // Keep local copies so user can edit before "Save"
  const [units, setUnits] = useState<OperationalUnit[]>(() => [...initialOperationalUnits]);
  const [costs, setCosts] = useState<DamageCosts>(() => ({ ...initialDamageCosts }));

  // Helper to clamp values so they're never < 1
  const clampValue = (val: number) => (val < 1 ? 1 : val);

  // Update operational unit
  const handleUnitChange = (index: number, field: keyof OperationalUnit, value: number) => {
    const updated = [...units];
    updated[index] = { ...updated[index], [field]: clampValue(value) };
    setUnits(updated);
  };

  // Update damage costs
  const handleDamageCostChange = (severity: keyof DamageCosts, value: number) => {
    setCosts((prev) => ({ ...prev, [severity]: clampValue(value) }));
  };

  // "Save" => notify parent
  const handleSaveClick = () => {
    onSave(units, costs);
  };

  // "Reset" => revert to defaults, also notify parent
  const handleResetClick = () => {
    // Revert local copy
    setUnits(defaultOperationalUnits.map((u) => ({ ...u })));
    setCosts({ ...defaultDamageCosts });
    // Let parent clear from Local Storage
    onReset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operational Units */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Operational Units</h3>
          <div className="space-y-4">
            {units.map((unit, index) => (
              <div key={unit.name} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{unit.name}</h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* Deployment Time */}
                  <div>
                    <label className="text-sm text-gray-600">Deployment (min)</label>
                    <input
                      type="number"
                      min={1}
                      value={unit.deploymentTime}
                      onChange={(e) =>
                        handleUnitChange(index, 'deploymentTime', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  {/* Cost */}
                  <div>
                    <label className="text-sm text-gray-600">Cost ($)</label>
                    <input
                      type="number"
                      min={1}
                      value={unit.costPerOperation}
                      onChange={(e) =>
                        handleUnitChange(index, 'costPerOperation', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  {/* Units Available */}
                  <div>
                    <label className="text-sm text-gray-600">Units</label>
                    <input
                      type="number"
                      min={1}
                      value={unit.unitsAvailable}
                      onChange={(e) =>
                        handleUnitChange(index, 'unitsAvailable', parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Damage Costs */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Damage Costs</h3>
          <div className="space-y-4">
            {Object.entries(costs).map(([severity, costValue]) => (
              <div key={severity} className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm text-gray-600 mb-2">
                  {severity.charAt(0).toUpperCase() + severity.slice(1)} Severity
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    min={1}
                    value={costValue}
                    onChange={(e) =>
                      handleDamageCostChange(severity as keyof DamageCosts, parseInt(e.target.value))
                    }
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end mt-6 gap-4">
        <button
          onClick={handleResetClick}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSaveClick}
          className="px-4 py-2 rounded-md bg-orange-600 text-white hover:bg-orange-700"
        >
          Save Settings
        </button>
      </div>
    </motion.div>
  );
}
