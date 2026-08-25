import React, { useState, useEffect } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { settingsService } from '../services/api';
import { TrendingUp, HelpCircle, Save, AlertTriangle } from 'lucide-react';
import * as calc from '../utils/calc';

export default function Settlement() {
  const { activeBatch, stats, settings, refreshData, loading } = useActiveBatch();
  const [feedPrice, setFeedPrice] = useState(2200);
  const [settlementRate, setSettlementRate] = useState(7.50);
  const [chickPrice, setChickPrice] = useState(0);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (settings) {
      setFeedPrice(settings.feedPricePerBag || 2200);
      setSettlementRate(settings.companySettlementRate || 7.50);
      setChickPrice(settings.chickCost || 0);
    }
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateSettings({
        feedPricePerBag: Number(feedPrice),
        companySettlementRate: Number(settlementRate),
        chickCost: Number(chickPrice)
      });
      setSuccess('Settlement rates updated successfully!');
      refreshData();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
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
        <p className="text-gray-500 font-bold">Please create a batch first to see settlement calculations.</p>
      </div>
    );
  }

  const liveWeight = stats?.currentBiomass || 0;
  const settlementDetails = calc.settlement({
    liveWeightKg: liveWeight,
    companySettlementRate: settlementRate,
    totalFeedBagsUsed: stats?.totalFeedBagsUsed || 0,
    feedPricePerBag: feedPrice,
    chickCost: chickPrice
  });

  const farmExpenses = stats?.totalExpenses || 0;
  const netRevenue = calc.netIncome(settlementDetails.settlementValue, farmExpenses);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center space-x-4">
        <TrendingUp className="w-8 h-8 text-brand-primary" />
        <div>
          <h2 className="text-xl font-extrabold text-brand-primary">Company Settlement Calculator</h2>
          <p className="text-xs text-gray-500 font-semibold">
            Evaluate final settlement figures based on company placement contracts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm h-fit">
          <h3 className="text-base font-extrabold text-brand-primary border-b border-red-50 pb-2 mb-4">
            Placement Settlement Rules
          </h3>
          {success && <div className="bg-green-50 p-2.5 text-green-700 text-xs font-bold rounded mb-3">{success}</div>}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700">Company Settlement Rate (₹/kg)</label>
              <input
                type="number"
                step="0.01"
                required
                value={settlementRate}
                onChange={(e) => setSettlementRate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Feed Value per Bag (₹)</label>
              <input
                type="number"
                required
                value={feedPrice}
                onChange={(e) => setFeedPrice(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">Chick Cost per Placement (₹)</label>
              <input
                type="number"
                required
                value={chickPrice}
                onChange={(e) => setChickPrice(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-brand-primary/95 transition-all"
            >
              <Save className="w-4 h-4 mr-2 inline" /> Save Rules
            </button>
          </form>
        </div>

        {/* Calculations display */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-6">
          <h3 className="text-base font-extrabold text-brand-primary border-b border-red-50 pb-2 flex items-center">
            Settlement Statement (Estimation)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-bg p-4 rounded-xl border border-red-50">
              <span className="text-[10px] text-gray-400 uppercase font-black">Estimated Gross Revenue</span>
              <p className="text-2xl font-black text-brand-primary mt-1">₹ {settlementDetails.grossRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Total Biomass ({liveWeight.toFixed(1)} kg) &times; ₹ {settlementRate}/kg</p>
            </div>

            <div className="bg-brand-bg p-4 rounded-xl border border-red-50">
              <span className="text-[10px] text-gray-400 uppercase font-black">Allocated Feed Value</span>
              <p className="text-2xl font-black text-brand-primary mt-1">₹ {settlementDetails.feedCost.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{stats?.totalFeedBagsUsed.toFixed(1)} bags consumed &times; ₹ {feedPrice}/bag</p>
            </div>
          </div>

          <div className="border-t border-red-50 pt-4 space-y-3.5 text-sm font-semibold">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Placement Revenue Payout</span>
              <span className="text-gray-700">₹ {settlementDetails.settlementValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b border-red-50 pb-2">
              <span className="text-gray-400">Minus Farm Expenses (Supplements + Labour + Power)</span>
              <span className="text-red-500">- ₹ {farmExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-600 font-extrabold text-base">Net Farm Income</span>
              <span className={`text-xl font-black ${netRevenue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                ₹ {netRevenue.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-start space-x-2 text-xs">
            <AlertTriangle className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-orange-700">
              <strong>Notice:</strong> This statement represents a calculated estimation. Actual contract settlement payouts are subject to the processing integrator's official audits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
