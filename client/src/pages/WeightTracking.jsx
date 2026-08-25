import React, { useState, useEffect } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { weightService } from '../services/api';
import { Scale, HelpCircle, Save, Plus, Trash } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function WeightTracking() {
  const { activeBatch, weights, settings, stats, loading, refreshData } = useActiveBatch();
  const [inputOption, setInputOption] = useState('A'); // 'A' or 'B'
  
  // Option A State
  const [sampleCount, setSampleCount] = useState(10);
  const [totalWeight, setTotalWeight] = useState('');

  // Option B State
  const [individualList, setIndividualList] = useState(['']);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [birdAge, setBirdAge] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (activeBatch && activeBatch.startDate) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      const start = new Date(activeBatch.startDate);
      start.setHours(0, 0, 0, 0);
      const diffTime = selectedDate - start;
      const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const calculatedAge = Math.max(1, daysDiff + 1);
      setBirdAge(calculatedAge);
    }
  }, [date, activeBatch]);

  const handleAddIndividualField = () => {
    setIndividualList(prev => [...prev, '']);
  };

  const handleRemoveIndividualField = (index) => {
    setIndividualList(prev => prev.filter((_, i) => i !== index));
  };

  const handleIndividualChange = (index, value) => {
    setIndividualList(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let payload = {
      date,
      birdAge: Number(birdAge),
      remarks
    };

    if (inputOption === 'A') {
      if (Number(sampleCount) <= 0 || Number(totalWeight) <= 0) {
        setError('Sample count and total weight must be greater than zero.');
        return;
      }
      payload.sampleCount = Number(sampleCount);
      payload.totalSampleWeight = Number(totalWeight);
      payload.averageWeight = Math.round((Number(totalWeight) / Number(sampleCount)) * 1000);
    } else {
      const validWeights = individualList.map(Number).filter(v => !isNaN(v) && v > 0);
      if (validWeights.length === 0) {
        setError('Please enter at least one valid individual bird weight.');
        return;
      }
      payload.sampleCount = validWeights.length;
      payload.individualWeights = validWeights;
      const sum = validWeights.reduce((a, b) => a + b, 0);
      payload.totalSampleWeight = sum / 1000; // in kg
      payload.averageWeight = Math.round(sum / validWeights.length); // in grams
    }

    try {
      await weightService.createWeight(activeBatch.batchId, payload);
      setSuccess('Weight record added successfully!');
      refreshData();
      // Reset form
      setTotalWeight('');
      setIndividualList(['']);
      setRemarks('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record weight.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!activeBatch) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm text-center">
        <p className="text-gray-500 font-bold">Please create an active batch to enable weight tracking.</p>
      </div>
    );
  }

  // Chart data prepare
  const chartData = weights.map(w => {
    const targetObj = settings?.breedTargets?.[activeBatch.breed]?.find(t => t.day === w.birdAge) || {};
    return {
      day: `Day ${w.birdAge}`,
      Actual: w.averageWeight,
      Target: targetObj.targetWeight || 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Weight entry forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
          <div className="flex items-center space-x-3 border-b border-red-50 pb-4 mb-6">
            <Scale className="w-7 h-7 text-brand-primary" />
            <div>
              <h2 className="text-xl font-extrabold text-brand-primary">Sample Weight Entry</h2>
              <p className="text-xs text-gray-500 font-semibold">Log sample weights to evaluate growth performance</p>
            </div>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setInputOption('A')}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                inputOption === 'A'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-brand-bg text-brand-primary border-red-100 hover:bg-brand-highlight/10'
              }`}
            >
              Option A: Bulk Weight
            </button>
            <button
              onClick={() => setInputOption('B')}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                inputOption === 'B'
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-brand-bg text-brand-primary border-red-100 hover:bg-brand-highlight/10'
              }`}
            >
              Option B: Individual Weights
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-700 font-bold text-sm mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded text-green-700 font-bold text-sm mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Bird Age (Day)</label>
                <input
                  type="number"
                  required
                  value={birdAge}
                  onChange={(e) => setBirdAge(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>

            {inputOption === 'A' ? (
              <div className="grid grid-cols-2 gap-4 bg-brand-bg p-4 rounded-xl border border-red-50">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Sample Count (Birds)</label>
                  <input
                    type="number"
                    value={sampleCount}
                    onChange={(e) => setSampleCount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Total Weight (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="e.g. 6.20"
                    value={totalWeight}
                    onChange={(e) => setTotalWeight(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-brand-bg p-4 rounded-xl border border-red-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase">Individual Weights (grams)</span>
                  <button
                    type="button"
                    onClick={handleAddIndividualField}
                    className="flex items-center text-xs font-bold text-brand-primary hover:text-brand-highlight"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Bird
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-40 overflow-y-auto pr-1">
                  {individualList.map((val, idx) => (
                    <div key={idx} className="relative flex items-center">
                      <input
                        type="number"
                        placeholder={`Bird ${idx + 1}`}
                        value={val}
                        onChange={(e) => handleIndividualChange(idx, e.target.value)}
                        className="block w-full border border-gray-300 bg-white rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                      {individualList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIndividualField(idx)}
                          className="absolute right-2 text-red-500 hover:text-red-700"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700">Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Weekly check, after vaccinations..."
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-4 h-4 mr-2" /> Save Weight Record
            </button>
          </form>
        </div>

        {/* Growth Stats Overview */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-brand-primary border-b border-red-50 pb-2 flex items-center">
            <Scale className="w-4 h-4 mr-2 text-brand-highlight" /> Growth Comparison
          </h3>
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-red-50 pb-1">
              <span className="text-gray-400 font-bold">Latest Weight</span>
              <span className="font-extrabold text-brand-primary">{stats?.latestAverageWeight} g</span>
            </div>
            <div className="flex justify-between border-b border-red-50 pb-1">
              <span className="text-gray-400 font-bold">Age Day</span>
              <span className="font-extrabold text-gray-700">Day {stats?.currentAge}</span>
            </div>
            <div className="flex justify-between border-b border-red-50 pb-1">
              <span className="text-gray-400 font-bold">Target Weight</span>
              <span className="font-extrabold text-gray-700">{stats?.targetWeight} g</span>
            </div>
            <div className="flex justify-between border-b border-red-50 pb-1">
              <span className="text-gray-400 font-bold">Difference</span>
              <span className={`font-extrabold ${stats?.weightDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {stats?.weightDiff >= 0 ? `+${stats?.weightDiff}g` : `${stats?.weightDiff}g`}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-gray-400 font-bold">Growth Status</span>
              <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-xs ${stats?.weightDiff >= -30 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {stats?.weightDiff >= -30 ? '🟢 On Track' : '🟠 Below Target'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical weight logs */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-extrabold text-brand-primary mb-4">Weight History Logs</h3>
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-brand-primary text-white font-black uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Date</th>
                  <th className="py-3 px-4">Age (Day)</th>
                  <th className="py-3 px-4">Sample Size</th>
                  <th className="py-3 px-4">Avg Weight (g)</th>
                  <th className="py-3 px-4">Total Weight (kg)</th>
                  <th className="py-3 px-4 rounded-tr-lg">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {weights.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 px-4 text-center text-gray-500 font-semibold bg-gray-50/50">
                      Add the first weight record to start tracking growth.
                    </td>
                  </tr>
                ) : (
                  weights.map((w, index) => (
                    <tr key={index} className="border-b border-red-50 hover:bg-brand-bg/40 font-semibold text-gray-700">
                      <td className="py-3 px-4">{new Date(w.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">Day {w.birdAge}</td>
                      <td className="py-3 px-4">{w.sampleCount} birds</td>
                      <td className="py-3 px-4 font-extrabold text-brand-primary">{w.averageWeight} g</td>
                      <td className="py-3 px-4">{w.totalSampleWeight.toFixed(3)} kg</td>
                      <td className="py-3 px-4 text-xs font-normal text-gray-500">{w.remarks || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
