import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { FileBarChart, Printer, FileText, Download } from 'lucide-react';

export default function Reports() {
  const { activeBatch, stats, logs, loading } = useActiveBatch();
  const [selectedReport, setSelectedReport] = useState('performance');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Selection Tabs */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <FileBarChart className="w-8 h-8 text-brand-primary" />
          <div>
            <h2 className="text-xl font-extrabold text-brand-primary">Reports Center</h2>
            <p className="text-xs text-gray-500 font-semibold">Generate printable batch sheets and performance audits</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-5 py-2.5 bg-brand-primary text-white font-bold rounded-xl text-sm hover:bg-brand-primary/95 transition-all shadow-md active:scale-95"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print / PDF
        </button>
      </div>

      <div className="flex space-x-2 border-b border-red-100 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedReport('performance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl border shrink-0 ${
            selectedReport === 'performance' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border-red-100 hover:bg-gray-50'
          }`}
        >
          Performance Report
        </button>
        <button
          onClick={() => setSelectedReport('feed')}
          className={`px-4 py-2 text-xs font-bold rounded-xl border shrink-0 ${
            selectedReport === 'feed' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border-red-100 hover:bg-gray-50'
          }`}
        >
          Feed Audit Log
        </button>
        <button
          onClick={() => setSelectedReport('mortality')}
          className={`px-4 py-2 text-xs font-bold rounded-xl border shrink-0 ${
            selectedReport === 'mortality' ? 'bg-brand-primary text-white' : 'bg-white text-gray-600 border-red-100 hover:bg-gray-50'
          }`}
        >
          Mortality Record
        </button>
      </div>

      {/* Report Template Container */}
      <div id="print-area" className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm max-w-4xl mx-auto space-y-6">
        {/* Report Header */}
        <div className="flex justify-between items-center border-b border-red-100 pb-6">
          <div className="flex items-center space-x-4">
            <img src="/logo.jpg" alt="M-CHICKS" className="w-16 h-16 rounded-full border-2 border-brand-primary object-cover" />
            <div>
              <h1 className="text-2xl font-black text-brand-primary tracking-tight">M-CHICKS</h1>
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Broiler Chicken Farm Management</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-black text-gray-700 uppercase">
              {selectedReport === 'performance' ? 'Batch Performance Audit' : selectedReport === 'feed' ? 'Feed Allocation Report' : 'Mortality Log Summary'}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Batch Info Metadata */}
        {activeBatch && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-gray-600 border-b border-red-100 pb-6">
            <div>Batch ID: <span className="text-gray-900 font-black">{activeBatch.batchId}</span></div>
            <div>Age progress: <span className="text-gray-900 font-black">Day {stats?.currentAge} / {activeBatch.targetDays}</span></div>
            <div>Initial Count: <span className="text-gray-900 font-black">{activeBatch.initialChicks.toLocaleString()} birds</span></div>
            <div>Breed: <span className="text-gray-900 font-black">{activeBatch.breed}</span></div>
          </div>
        )}

        {/* Selected Report Content */}
        {selectedReport === 'performance' && stats && (
          <div className="space-y-6 text-sm">
            <h4 className="font-extrabold text-brand-primary text-base">Key Performance Indicators</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-bg p-4 rounded-xl border border-red-50 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-black">Live Bird Count</span>
                <p className="text-lg font-extrabold text-gray-800">{stats.liveBirds.toLocaleString()} Birds ({stats.mortalityPct}% Mortality)</p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-red-50 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-black">Average Weight</span>
                <p className="text-lg font-extrabold text-gray-800">{stats.latestAverageWeight} grams</p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-red-50 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-black">Farm FCR</span>
                <p className="text-lg font-extrabold text-gray-800">{stats.farmFCR}</p>
              </div>
              <div className="bg-brand-bg p-4 rounded-xl border border-red-50 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-black">Growth FCR</span>
                <p className="text-lg font-extrabold text-gray-800">{stats.growthFCR}</p>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'feed' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-brand-primary text-base">Feed Utilization Breakdown</h4>
            <div className="overflow-x-auto bg-white rounded-xl border border-red-50">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-brand-bg text-brand-primary font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Age</th>
                    <th className="py-2.5 px-3">Bags Consumed</th>
                    <th className="py-2.5 px-3">Equivalent KG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50 font-semibold text-gray-700">
                  {logs.filter(l => l.feedBagsUsed > 0).map((l, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">{new Date(l.date).toLocaleDateString()}</td>
                      <td className="py-2 px-3">Day {l.birdAge}</td>
                      <td className="py-2 px-3">{l.feedBagsUsed} bags</td>
                      <td className="py-2 px-3">{(l.feedBagsUsed * (activeBatch?.bagWeight || 75)).toLocaleString()} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedReport === 'mortality' && (
          <div className="space-y-4">
            <h4 className="font-extrabold text-brand-primary text-base">Daily Mortality Records</h4>
            <div className="overflow-x-auto bg-white rounded-xl border border-red-50">
              <table className="min-w-full text-xs text-left">
                <thead>
                  <tr className="bg-brand-bg text-brand-primary font-bold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Age</th>
                    <th className="py-2.5 px-3">Deaths</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50 font-semibold text-gray-700">
                  {logs.filter(l => l.mortality > 0).map((l, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3">{new Date(l.date).toLocaleDateString()}</td>
                      <td className="py-2 px-3">Day {l.birdAge}</td>
                      <td className="py-2 px-3 font-extrabold text-red-500">{l.mortality} birds</td>
                      <td className="py-2 px-3">{l.mortalityReason || '-'}</td>
                      <td className="py-2 px-3 text-xs text-gray-400 font-normal">{l.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
