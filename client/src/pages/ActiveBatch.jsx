import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { batchService } from '../services/api';
import { Layers, Calendar, ChevronRight, CheckCircle2, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ActiveBatch() {
  const { activeBatch, stats, loading, refreshData } = useActiveBatch();
  const [completeMode, setCompleteMode] = useState(false);
  const [sellingPrice, setSellingPrice] = useState('');
  const [success, setSuccess] = useState('');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
        <p className="text-sm font-bold text-gray-500">Loading Batch Details...</p>
      </div>
    );
  }

  if (!activeBatch) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-md text-center max-w-lg mx-auto">
        <h3 className="text-xl font-extrabold text-brand-primary mb-2">No Active Batch</h3>
        <p className="text-gray-600 mb-6">Create a batch to view details.</p>
      </div>
    );
  }

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!sellingPrice) return;
    try {
      await batchService.completeBatch(activeBatch.batchId, {
        finalSellingPricePerKg: Number(sellingPrice),
        completionDate: new Date()
      });
      setSuccess('Batch completed successfully!');
      setCompleteMode(false);
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const timelineDays = [0, 7, 14, 21, 28, 35, 36];
  const age = stats?.currentAge || 0;

  return (
    <div className="space-y-6">
      {/* Batch Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3.5">
          <Layers className="w-8 h-8 text-brand-primary" />
          <div>
            <h2 className="text-2xl font-black text-brand-primary tracking-tight">{activeBatch.batchId}</h2>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">
              Status: <span className="text-green-600">{activeBatch.status}</span>
            </p>
          </div>
        </div>
        {activeBatch.status === 'Active' && !completeMode && (
          <button
            onClick={() => setCompleteMode(true)}
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-95"
          >
            Mark as Completed
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md text-green-700 font-bold text-sm">
          {success}
        </div>
      )}

      {/* Completion Modal/Form */}
      {completeMode && (
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm max-w-md">
          <h3 className="text-lg font-extrabold text-brand-primary mb-3">Complete Batch {activeBatch.batchId}</h3>
          <form onSubmit={handleComplete} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Selling Price per KG (₹)</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="e.g. 95"
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setCompleteMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary/95"
              >
                Confirm Completion
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-extrabold text-brand-primary mb-6">Growth Stage Timeline</h3>
        <div className="relative flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-red-100 -translate-y-1/2 hidden md:block" />
          
          {timelineDays.map((day) => {
            const isPassed = age >= day;
            const isCurrent = age === day || (day === 36 && age >= 36) || (day < 36 && age > day && age < timelineDays[timelineDays.indexOf(day) + 1]);
            
            return (
              <div key={day} className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-md border-2 transition-all ${
                  isPassed 
                    ? 'bg-brand-primary text-white border-brand-primary' 
                    : isCurrent 
                      ? 'bg-brand-highlight text-white border-brand-highlight animate-pulse'
                      : 'bg-white text-gray-400 border-gray-200'
                }`}>
                  {day === 36 ? 'End' : `D${day}`}
                </div>
                <span className="text-[11px] font-bold text-gray-500 mt-2">
                  {day === 0 ? 'Arrival' : day === 36 ? 'Completion' : `Week ${day / 7}`}
                </span>
                {isCurrent && (
                  <span className="absolute -top-6 bg-brand-highlight text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Specifications Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Batch Specs */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-brand-primary" />
            Batch Information
          </h3>
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Arrival Date</span>
              <span className="font-extrabold text-gray-700">{new Date(activeBatch.startDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Breed</span>
              <span className="font-extrabold text-gray-700">{activeBatch.breed}</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Chicks Placed</span>
              <span className="font-extrabold text-gray-700">{activeBatch.initialChicks.toLocaleString()} birds</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Initial Average Weight</span>
              <span className="font-extrabold text-gray-700">{activeBatch.initialWeight} grams</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Target Duration</span>
              <span className="font-extrabold text-gray-700">{activeBatch.targetDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-400">Chicks Cost</span>
              <span className="font-extrabold text-green-600">₹0 (Company Placed)</span>
            </div>
          </div>
        </div>

        {/* Shed Sizing & Area Specs */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary border-b border-red-50 pb-3 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-brand-primary" />
            Shed Sizing & Density
          </h3>
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Shed Number</span>
              <span className="font-extrabold text-gray-700">Shed {activeBatch.shedNumber}</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Shed Dimensions</span>
              <span className="font-extrabold text-gray-700">{activeBatch.shedLength} ft &times; {activeBatch.shedWidth} ft</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Shed Area</span>
              <span className="font-extrabold text-brand-primary">{activeBatch.shedArea} sq.ft</span>
            </div>
            <div className="flex justify-between border-b border-red-50/50 pb-2">
              <span className="font-bold text-gray-400">Stocking Density</span>
              <span className="font-extrabold text-gray-700">
                {Number((activeBatch.initialChicks / activeBatch.shedArea).toFixed(2))} birds/sq.ft
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-400">Initial Feed Allocation</span>
              <span className="font-extrabold text-gray-700">{activeBatch.feedAllocationBags} bags ({activeBatch.feedAllocationBags * activeBatch.bagWeight} kg)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
