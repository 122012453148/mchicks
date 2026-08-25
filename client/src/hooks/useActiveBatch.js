import { useState, useEffect, useCallback } from 'react';
import { batchService, logService, weightService, supplementService, expenseService, settingsService, weatherService, supervisorService } from '../services/api';
import * as calc from '../utils/calc';

export default function useActiveBatch() {
  const [activeBatch, setActiveBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [logs, setLogs] = useState([]);
  const [weights, setWeights] = useState([]);
  const [supplements, setSupplements] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(null);
  const [weather, setWeather] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const batchList = await batchService.getBatches();
      setBatches(batchList);
      
      const active = batchList.find(b => b.status === 'Active') || batchList[0] || null;
      setActiveBatch(active);

      if (active) {
        const [activeLogs, activeWeights, activeSupplements, activeExpenses, activeSettings, currentWeather, activeVisits] = await Promise.all([
          logService.getLogs(active.batchId),
          weightService.getWeights(active.batchId),
          supplementService.getSupplements(active.batchId),
          expenseService.getExpenses(active.batchId),
          settingsService.getSettings(),
          weatherService.getWeather(active.farmLocation?.lat, active.farmLocation?.lng, active.farmLocation?.address),
          supervisorService.getVisits(active.batchId)
        ]);

        setLogs(activeLogs);
        setWeights(activeWeights);
        setSupplements(activeSupplements);
        setExpenses(activeExpenses);
        setSettings(activeSettings);
        setWeather(currentWeather);
        setVisits(activeVisits);
      } else {
        const activeSettings = await settingsService.getSettings();
        const currentWeather = await weatherService.getWeather();
        setSettings(activeSettings);
        setWeather(currentWeather);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch farm data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateLocation = async (lat, lng, address) => {
    if (!activeBatch) return;
    try {
      setLoading(true);
      await batchService.updateLocation(activeBatch.batchId, { lat, lng, address });
      await refreshData();
    } catch (err) {
      console.error('Failed to update location:', err);
      setError('Failed to update location.');
      setLoading(false);
    }
  };

  // Compute stats
  const getStats = () => {
    if (!activeBatch) return null;

    // Batch age calculated early for other dependent projections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(activeBatch.startDate);
    start.setHours(0, 0, 0, 0);
    const diffTime = today - start;
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentAge = Math.max(1, daysDiff + 1); // Placement day is Day 1
    const remainingDays = Math.max(0, activeBatch.targetDays - currentAge);

    const initialCount = activeBatch.initialChicks;
    const totalMortality = logs.reduce((sum, l) => sum + (l.mortality || 0), 0);
    const liveBirds = calc.liveBirds(initialCount, totalMortality);
    const mortalityPct = calc.mortalityPercentage(totalMortality, initialCount);

    const totalFeedBagsUsed = logs.reduce((sum, l) => sum + (l.feedBagsUsed || 0), 0);
    const totalFeedKgUsed = totalFeedBagsUsed * activeBatch.bagWeight;
    const feedRemainingBags = calc.feedRemainingBags(activeBatch.feedAllocationBags, totalFeedBagsUsed);
    const feedRemainingKg = feedRemainingBags * activeBatch.bagWeight;

    // Daily Avg consumption over last 3 days
    const recentLogs = logs.slice(-3);
    const dailyAvgBags = recentLogs.length > 0 
      ? recentLogs.reduce((sum, l) => sum + l.feedBagsUsed, 0) / recentLogs.length 
      : 1.5; // fallback
    const feedCoverageDays = calc.feedCoverageDays(feedRemainingBags, dailyAvgBags);

    // Feed Forecast & Requirement Calculations
    const projectedTotalBagsRequired = totalFeedBagsUsed + (dailyAvgBags * remainingDays);
    const additionalFeedRequiredBags = calc.additionalFeedRequiredBags(activeBatch.feedAllocationBags, projectedTotalBagsRequired);

    // Latest Weight
    const latestWeightRecord = weights[weights.length - 1];
    const latestAverageWeight = latestWeightRecord ? latestWeightRecord.averageWeight : activeBatch.initialWeight;

    // Biomass
    const currentBiomass = calc.biomass(liveBirds, latestAverageWeight);
    const initialBiomass = calc.biomass(initialCount, activeBatch.initialWeight);
    const weightGain = Math.max(0, currentBiomass - initialBiomass);

    // FCRs
    const farmFCR = calc.fcr(totalFeedKgUsed, currentBiomass);
    const growthFCR = calc.growthFcr(totalFeedKgUsed, weightGain);

    // Expenses
    const totalSupplementCost = supplements.reduce((sum, s) => sum + s.cost, 0);
    const otherExpensesCost = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalSupplementCost + otherExpensesCost;

    // Settlement and profits
    const feedPrice = settings?.feedPricePerBag || 2200;
    const settlementRate = settings?.companySettlementRate || 7.50;
    const settlementInfo = calc.settlement({
      liveWeightKg: currentBiomass,
      companySettlementRate: settlementRate,
      totalFeedBagsUsed: totalFeedBagsUsed,
      feedPricePerBag: feedPrice,
      chickCost: settings?.chickCost || 0
    });
    
    const estimatedProfit = calc.netIncome(settlementInfo.settlementValue, totalExpenses);

    // Target Weight for current age
    const breedTargets = settings?.breedTargets?.[activeBatch.breed] || [];
    const targetObj = breedTargets.find(t => t.day === currentAge) || breedTargets.find(t => t.day > currentAge) || { targetWeight: 600, targetTempMin: 24, targetTempMax: 27, targetHumidityMin: 60, targetHumidityMax: 70 };
    const targetWeight = targetObj.targetWeight;
    const weightDiff = latestAverageWeight - targetWeight;

    // Environment check
    const latestLog = logs[logs.length - 1];
    const shedTemp = latestLog ? latestLog.shedTemperature : 28;
    const shedHumidity = latestLog ? latestLog.shedHumidity : 65;

    let envStatus = 'Good';
    if (shedTemp < targetObj.targetTempMin || shedTemp > targetObj.targetTempMax || shedHumidity > targetObj.targetHumidityMax) {
      envStatus = 'Attention';
    }
    if (shedTemp > targetObj.targetTempMax + 3 || shedTemp < targetObj.targetTempMin - 3) {
      envStatus = 'Critical';
    }

    const performanceScore = calc.farmPerformanceScore({
      mortalityRate: mortalityPct,
      fcrValue: farmFCR,
      weightVsTargetDiff: weightDiff,
      environmentStatus: envStatus
    });

    return {
      currentAge,
      remainingDays,
      liveBirds,
      totalMortality,
      mortalityPct,
      totalFeedBagsUsed,
      totalFeedKgUsed,
      feedRemainingBags,
      feedRemainingKg,
      feedCoverageDays,
      projectedTotalBagsRequired,
      additionalFeedRequiredBags,
      latestAverageWeight,
      currentBiomass,
      initialBiomass,
      weightGain,
      farmFCR,
      growthFCR,
      totalSupplementCost,
      otherExpensesCost,
      totalExpenses,
      settlementInfo,
      estimatedProfit,
      performanceScore,
      targetWeight,
      weightDiff,
      shedTemp,
      shedHumidity,
      targetObj,
      envStatus
    };
  };

  return {
    activeBatch,
    batches,
    logs,
    weights,
    supplements,
    expenses,
    settings,
    weather,
    visits,
    loading,
    error,
    refreshData,
    updateLocation,
    stats: getStats()
  };
}
