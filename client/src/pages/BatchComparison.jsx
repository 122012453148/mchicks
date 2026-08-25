import React from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { Layers, CheckCircle2 } from 'lucide-react';

export default function BatchComparison() {
  const { batches, loading } = useActiveBatch();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  // Filter or map mock historical batches for comparison since we only seeded BATCH-001
  const comparisonBatches = [
    {
      batchId: 'BATCH-001 (Active)',
      duration: 'Day 11 (Current)',
      initialChicks: 4100,
      liveBirds: 4030,
      mortalityPct: 1.70,
      avgWeight: 330,
      feedBags: 19.8,
      farmFCR: 1.51,
      growthFCR: 1.55,
      expenses: 4300,
      income: 'Estimation Pending'
    },
    {
      batchId: 'BATCH-2026-PREV',
      duration: '36 days',
      initialChicks: 4000,
      liveBirds: 3880,
      mortalityPct: 3.0,
      avgWeight: 2520,
      feedBags: 148,
      farmFCR: 1.82,
      growthFCR: 1.87,
      expenses: 12500,
      income: '₹ 28,450 Profit'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center space-x-4">
        <Layers className="w-8 h-8 text-brand-primary" />
        <div>
          <h2 className="text-xl font-extrabold text-brand-primary">Historical Batch Comparison</h2>
          <p className="text-xs text-gray-500 font-semibold">
            Evaluate current flock performance metrics side-by-side with historical batches
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-brand-bg text-brand-primary border-b border-red-50 uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-6">Metric</th>
                {comparisonBatches.map((b, i) => (
                  <th key={i} className="py-3 px-6">{b.batchId}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50 font-semibold text-gray-700">
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Batch Duration</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">{b.duration}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Initial Placed Chicks</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">{b.initialChicks.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Final Live Birds</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">{b.liveBirds.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Mortality Rate (%)</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className={`py-3.5 px-6 ${b.mortalityPct > 2.5 ? 'text-orange-500' : 'text-green-600'}`}>{b.mortalityPct}%</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Latest Avg Weight (g)</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">{b.avgWeight} g</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Total Feed Consumed</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">{b.feedBags} Bags</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Farm FCR</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6 text-brand-primary">{b.farmFCR}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Growth FCR</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">{b.growthFCR}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Total Farm Expenses</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6">₹ {b.expenses.toLocaleString()}</td>
                ))}
              </tr>
              <tr>
                <td className="py-3.5 px-6 text-gray-400">Net Farm Profit / Loss</td>
                {comparisonBatches.map((b, i) => (
                  <td key={i} className="py-3.5 px-6 text-green-600 font-extrabold">{b.income}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
