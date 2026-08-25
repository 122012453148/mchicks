import React, { useState } from 'react';
import useActiveBatch from '../hooks/useActiveBatch';
import { Container, AlertCircle, CheckCircle2, ShoppingBag } from 'lucide-react';

export default function FeedManagement() {
  const { activeBatch, logs, settings, stats, loading } = useActiveBatch();

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
        <p className="text-gray-500 font-bold">Please create a batch first to access feed management.</p>
      </div>
    );
  }

  // Calculate stage-wise usage based on age guidelines:
  // Pre-starter: Day 0 to 10
  // Starter: Day 11 to 20
  // Grower: Day 21 to 30
  // Finisher: Day 31+
  let preStarterUsed = 0;
  let starterUsed = 0;
  let growerUsed = 0;
  let finisherUsed = 0;

  logs.forEach(l => {
    if (l.birdAge <= 10) {
      preStarterUsed += l.feedBagsUsed;
    } else if (l.birdAge <= 20) {
      starterUsed += l.feedBagsUsed;
    } else if (l.birdAge <= 30) {
      growerUsed += l.feedBagsUsed;
    } else {
      finisherUsed += l.feedBagsUsed;
    }
  });

  const stages = [
    { name: 'Pre-Starter (Day 0-10)', allocated: activeBatch.preStarterBags || 25, used: preStarterUsed },
    { name: 'Starter (Day 11-20)', allocated: activeBatch.starterBags || 25, used: starterUsed },
    { name: 'Grower (Day 21-30)', allocated: activeBatch.growerBags || 35, used: growerUsed },
    { name: 'Finisher (Day 31+)', allocated: activeBatch.finisherBags || 75, used: finisherUsed }
  ];

  // Feed overuse estimation (expected cumulative bags vs actual)
  // Expected consumption rule of thumb: ~3 bags per 1000 birds per day average up to current age
  const expectedBags = Math.round((activeBatch.initialChicks / 1000) * 3 * (stats?.currentAge || 1));
  const totalBagsUsed = stats?.totalFeedBagsUsed || 0;
  const isOverusing = totalBagsUsed > expectedBags * 1.15; // 15% threshold

  return (
    <div className="space-y-6">
      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase">Allocated Stock</span>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-brand-primary">{activeBatch.feedAllocationBags} bags</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{activeBatch.feedAllocationBags * activeBatch.bagWeight} kg allocated</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase">Total Consumed</span>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-brand-primary">{totalBagsUsed.toFixed(1)} bags</h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">{stats?.totalFeedKgUsed.toLocaleString()} kg consumed</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase">Remaining Stock</span>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-brand-primary">{stats?.feedRemainingBags.toFixed(1)} bags</h3>
            <p className="text-[10px] text-brand-primary font-bold mt-0.5">{stats?.feedRemainingKg.toLocaleString()} kg remaining</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase">Estimated Coverage</span>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-brand-primary">{stats?.feedCoverageDays} Days</h3>
            <p className={`text-[10px] font-bold mt-0.5 ${stats?.feedRemainingBags >= 15 ? 'text-green-600' : 'text-red-500'}`}>
              {stats?.feedRemainingBags >= 15 ? '🟢 Stock Sufficient' : '🔴 Shortage Risk'}
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Status Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary flex items-center border-b border-red-50 pb-2.5">
            <ShoppingBag className="w-5 h-5 mr-2 text-brand-primary" />
            Smart Forecast Engine
          </h3>
          {stats?.feedRemainingBags >= 15 ? (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-green-800">Feed Stock is Sufficient</span>
                <p className="text-xs text-green-700 mt-1">
                  At current consumption rates, the remaining feed covers {stats.feedCoverageDays} days, which is enough to reach completion.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-red-800">Feed Shortage Risk Predicted</span>
                <p className="text-xs text-red-700 mt-1">
                  Remaining feed stock will not last until the target selling date. Additional {stats?.additionalFeedRequiredBags?.toFixed(1)} bags of feed may be required.
                </p>
              </div>
            </div>
          )}

          {isOverusing && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-orange-800">Feed Consumption Higher Than Expected</span>
                <p className="text-xs text-orange-700 mt-1">
                  Actual feed consumed ({totalBagsUsed.toFixed(1)} bags) is higher than expected. Please verify feeder configurations, spillage, and check for feed wastage.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stage-wise status */}
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-4">
          <h3 className="text-lg font-extrabold text-brand-primary flex items-center border-b border-red-50 pb-2.5">
            <Container className="w-5 h-5 mr-2 text-brand-primary" />
            Stage-wise Feed Tracking
          </h3>
          <div className="space-y-4">
            {stages.map((stage, idx) => {
              const remaining = Math.max(0, stage.allocated - stage.used);
              const percentage = Math.min(100, Math.round((stage.used / stage.allocated) * 100));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>{stage.name}</span>
                    <span>{stage.used.toFixed(1)} / {stage.allocated} Bags</span>
                  </div>
                  <div className="w-full bg-brand-bg rounded-full h-2">
                    <div
                      className="bg-brand-highlight h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
