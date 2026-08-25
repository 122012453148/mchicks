import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { logService } from '../services/api';
import { Thermometer, Wind, CloudRain, AlertTriangle, CheckCircle, Save } from 'lucide-react';

export default function Environment() {
  const { activeBatch, weather, stats, loading, refreshData } = useActiveBatch();
  const [shedTemp, setShedTemp] = useState('');
  const [shedHumid, setShedHumid] = useState('');
  const [litter, setLitter] = useState('Good');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(shedTemp) <= 0 || Number(shedHumid) <= 0) {
      setError('Temperature and humidity values must be positive');
      return;
    }

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      await logService.createLog(activeBatch.batchId, {
        date: todayDate,
        birdAge: stats.currentAge,
        shedTemperature: Number(shedTemp),
        shedHumidity: Number(shedHumid),
        litterCondition: litter,
        remarks: remarks
      });
      setSuccess('Shed environment logged successfully!');
      refreshData();
      setShedTemp('');
      setShedHumid('');
      setRemarks('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record environment log.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weather details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section A: Outdoor Environment */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-2.5 flex items-center">
            <Wind className="w-5 h-5 mr-2 text-brand-highlight" />
            Outdoor Weather (API Feed)
          </h3>
          {weather ? (
            <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
              <div className="bg-brand-bg p-3 rounded-xl border border-red-50">
                <span className="text-[10px] text-gray-400 uppercase font-black">Location</span>
                <p className="text-brand-primary font-black mt-0.5">{weather.address}</p>
              </div>
              <div className="bg-brand-bg p-3 rounded-xl border border-red-50">
                <span className="text-[10px] text-gray-400 uppercase font-black">Temperature</span>
                <p className="text-brand-primary font-black mt-0.5">{weather.temperature}°C</p>
              </div>
              <div className="bg-brand-bg p-3 rounded-xl border border-red-50">
                <span className="text-[10px] text-gray-400 uppercase font-black">Humidity</span>
                <p className="text-brand-primary font-black mt-0.5">{weather.humidity}% RH</p>
              </div>
              <div className="bg-brand-bg p-3 rounded-xl border border-red-50">
                <span className="text-[10px] text-gray-400 uppercase font-black">Condition</span>
                <p className="text-brand-primary font-black mt-0.5">{weather.condition}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Unable to load weather stream.</p>
          )}
        </div>

        {/* Section B: Shed Environment targets */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-2.5 flex items-center">
            <Thermometer className="w-5 h-5 mr-2 text-brand-primary" />
            Shed vs Target Targets (Age: Day {stats?.currentAge})
          </h3>
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-red-50 pb-1.5">
              <span className="font-bold text-gray-400">Current Shed Temp</span>
              <span className="font-extrabold text-brand-primary">{stats?.shedTemp}°C</span>
            </div>
            <div className="flex justify-between border-b border-red-50 pb-1.5">
              <span className="font-bold text-gray-400">Target Range</span>
              <span className="font-extrabold text-gray-700">
                {stats?.targetObj?.targetTempMin}°C - {stats?.targetObj?.targetTempMax}°C
              </span>
            </div>
            <div className="flex justify-between border-b border-red-50 pb-1.5">
              <span className="font-bold text-gray-400">Shed Humidity</span>
              <span className="font-extrabold text-brand-primary">{stats?.shedHumidity}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-400">Target Humidity Range</span>
              <span className="font-extrabold text-gray-700">
                {stats?.targetObj?.targetHumidityMin}% - {stats?.targetObj?.targetHumidityMax}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual log entry & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
          <h3 className="text-lg font-extrabold text-brand-primary mb-4">Record Shed Environment</h3>
          {error && <div className="bg-red-50 p-2.5 text-red-700 text-xs font-bold rounded mb-3">{error}</div>}
          {success && <div className="bg-green-50 p-2.5 text-green-700 text-xs font-bold rounded mb-3">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Shed Temperature (°C)</label>
              <input
                type="number"
                required
                value={shedTemp}
                onChange={(e) => setShedTemp(e.target.value)}
                placeholder="e.g. 28"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Shed Humidity (%)</label>
              <input
                type="number"
                required
                value={shedHumid}
                onChange={(e) => setShedHumid(e.target.value)}
                placeholder="e.g. 65"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Litter Condition</label>
              <select
                value={litter}
                onChange={(e) => setLitter(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="Good">Good</option>
                <option value="Wet">Wet</option>
                <option value="Caked">Caked</option>
                <option value="Dry">Dry</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-4 h-4 mr-2 inline" /> Log Environment
            </button>
          </form>
        </div>

        {/* Safety Warnings banner */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-2.5">
            Shed Stress Alarms
          </h3>
          <div className="space-y-4">
            {stats?.envStatus === 'Good' ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-green-800">Environment Normal</span>
                  <p className="text-xs text-green-700 mt-1">
                    Shed environment variables conform to target breed guidelines for this age bracket.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-orange-800">Shed Conditions Require Attention</span>
                  <p className="text-xs text-orange-700 mt-1">
                    Current shed parameters are running outside standard ranges. Please verify fan operations, clean water line supplies, and check chick distributions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
