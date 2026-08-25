import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { logService } from '../services/api';
import { Skull, AlertCircle, Save, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function Mortality() {
  const { activeBatch, logs, stats, loading, refreshData } = useActiveBatch();
  const [deaths, setDeaths] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (Number(deaths) < 0) {
      setError('Deaths cannot be negative');
      return;
    }
    if (stats && Number(deaths) > stats.liveBirds) {
      setError(`Deaths (${deaths}) cannot exceed live birds (${stats.liveBirds})`);
      return;
    }

    try {
      const todayDate = new Date().toISOString().split('T')[0];
      await logService.createLog(activeBatch.batchId, {
        date: todayDate,
        birdAge: stats.currentAge,
        mortality: Number(deaths),
        mortalityReason: reason,
        remarks: remarks
      });
      setSuccess('Mortality logged successfully!');
      refreshData();
      setDeaths('');
      setReason('');
      setRemarks('');
    } catch (err) {
      const rawError = err.response?.data?.error;
      setError(typeof rawError === 'string' ? rawError : (rawError?.message || 'Failed to log mortality.'));
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
        <p className="text-gray-500 font-bold">Please create a batch to access mortality logging.</p>
      </div>
    );
  }

  // Detect Spike: If mortality of last entry > 1.5x of previous 3-day average
  const lastLog = logs[logs.length - 1];
  const previousLogs = logs.slice(-4, -1);
  const avgPrevious = previousLogs.length > 0
    ? previousLogs.reduce((sum, l) => sum + (l.mortality || 0), 0) / previousLogs.length
    : 2;
  const isSpike = lastLog && lastLog.mortality > 10 && lastLog.mortality > avgPrevious * 1.5;

  // Prepare chart data
  let cumulative = 0;
  const chartData = logs.map(l => {
    cumulative += l.mortality || 0;
    return {
      day: `Day ${l.birdAge}`,
      Daily: l.mortality,
      Cumulative: cumulative
    };
  });

  return (
    <div className="space-y-6">
      {/* KPI & Alarms */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI card */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase">Cumulative Mortality</span>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-brand-primary">{stats?.totalMortality} Birds</h3>
            <p className="text-xs text-red-500 font-bold mt-1">{stats?.mortalityPct}% Cumulative Rate</p>
          </div>
        </div>

        {/* Alarm Banner */}
        <div className="md:col-span-2">
          {isSpike ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-2xl flex items-start space-x-3.5 h-full">
              <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-black text-red-800">Mortality Spike Detected</span>
                <p className="text-xs text-red-700 mt-1.5 leading-relaxed">
                  Today's mortality is higher than the recent average. Inspect flock health, ventilation, water and feed conditions, and consult the farm supervisor or veterinary professional.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-2xl flex items-start space-x-3.5 h-full">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-black text-green-800">Mortality Within Normal Range</span>
                <p className="text-xs text-green-700 mt-1.5 leading-relaxed">
                  Cumulative mortality is currently at {stats?.mortalityPct}%, which sits comfortably within standard commercial breed guidelines.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry form */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm h-fit">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-2.5 mb-4">
            Record Today's Deaths
          </h3>
          {error && <div className="bg-red-50 p-2.5 rounded text-red-700 text-xs font-bold mb-3">{error}</div>}
          {success && <div className="bg-green-50 p-2.5 rounded text-green-700 text-xs font-bold mb-3">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Deaths Today</label>
              <input
                type="number"
                required
                value={deaths}
                onChange={(e) => setDeaths(e.target.value)}
                placeholder="e.g. 3"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Reason (if known)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Natural, Heat, Stress"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows="2"
                placeholder="Observed slight heat at 2pm..."
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-4 h-4 mr-2 inline" /> Log Deaths
            </button>
          </form>
        </div>

        {/* Charts panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-brand-primary mb-3">Daily Mortality Trend</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C8DFDB" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Daily" fill="#1B2CC1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-brand-primary mb-3">Cumulative Mortality Curve</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C8DFDB" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Cumulative" stroke="#7692FF" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
