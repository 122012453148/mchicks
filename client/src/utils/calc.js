/**
 * M-CHICKS Centralized Calculation Engine
 */

export const liveBirds = (initial, mortality) => {
  if (initial === undefined || initial === null) return 0;
  return Math.max(0, initial - (mortality || 0));
};

export const mortalityPercentage = (mortality, initial) => {
  if (!initial || initial <= 0) return 0;
  return Number((((mortality || 0) / initial) * 100).toFixed(2));
};

export const biomass = (count, averageWeightGrams) => {
  if (!count || !averageWeightGrams) return 0;
  // Returns biomass in kg
  return (count * averageWeightGrams) / 1000;
};

export const fcr = (totalFeedKg, totalLiveWeightKg) => {
  if (!totalFeedKg || !totalLiveWeightKg || totalLiveWeightKg <= 0) return "N/A";
  const val = totalFeedKg / totalLiveWeightKg;
  if (isNaN(val) || !isFinite(val)) return "N/A";
  return Number(val.toFixed(2));
};

export const growthFcr = (totalFeedKg, weightGainKg) => {
  if (!totalFeedKg || !weightGainKg || weightGainKg <= 0) return "N/A";
  const val = totalFeedKg / weightGainKg;
  if (isNaN(val) || !isFinite(val)) return "N/A";
  return Number(val.toFixed(2));
};

export const feedRemainingBags = (allocatedBags, consumedBags) => {
  if (allocatedBags === undefined || allocatedBags === null) return 0;
  return Math.max(0, Number((allocatedBags - (consumedBags || 0)).toFixed(2)));
};

export const feedCoverageDays = (remainingBags, dailyAvgBags) => {
  if (!dailyAvgBags || dailyAvgBags <= 0) return "N/A";
  const val = remainingBags / dailyAvgBags;
  if (isNaN(val) || !isFinite(val)) return "N/A";
  return Number(val.toFixed(1));
};

export const additionalFeedRequiredBags = (allocatedBags, projectedTotalBags) => {
  if (allocatedBags === undefined || projectedTotalBags === undefined) return 0;
  return Math.max(0, Number((projectedTotalBags - allocatedBags).toFixed(2)));
};

export const feedValue = (bagsCount, pricePerBag) => {
  if (!bagsCount || !pricePerBag) return 0;
  return Number((bagsCount * pricePerBag).toFixed(2));
};

export const farmPerformanceScore = ({
  mortalityRate,      // e.g. 1.95 (%)
  fcrValue,           // e.g. 1.90
  weightVsTargetDiff, // e.g. -30 (grams)
  environmentStatus   // 'Good' | 'Attention' | 'Critical'
}) => {
  // Simple weighted scorecard out of 100
  let score = 100;

  // 1. Mortality impact (Max 25 pts penalty)
  if (mortalityRate && mortalityRate > 0) {
    const penalty = Math.min(25, mortalityRate * 5);
    score -= penalty;
  }

  // 2. FCR impact (Max 25 pts penalty)
  const fcrNum = Number(fcrValue);
  if (!isNaN(fcrNum) && fcrNum > 1.75) {
    const diff = fcrNum - 1.75;
    const penalty = Math.min(25, diff * 50);
    score -= penalty;
  }

  // 3. Weight performance impact (Max 25 pts penalty)
  if (weightVsTargetDiff !== undefined && weightVsTargetDiff < 0) {
    const penalty = Math.min(25, Math.abs(weightVsTargetDiff) * 0.5);
    score -= penalty;
  }

  // 4. Environment impact
  if (environmentStatus === 'Attention') {
    score -= 10;
  } else if (environmentStatus === 'Critical') {
    score -= 20;
  }

  return Math.max(0, Math.round(score));
};

export const settlement = ({
  liveWeightKg,
  companySettlementRate,
  totalFeedBagsUsed,
  feedPricePerBag,
  chickCost = 0
}) => {
  const feedCost = (totalFeedBagsUsed || 0) * (feedPricePerBag || 0);
  const grossRevenue = (liveWeightKg || 0) * (companySettlementRate || 0);
  const settlementValue = grossRevenue;
  
  return {
    grossRevenue: Number(grossRevenue.toFixed(2)),
    settlementValue: Number(settlementValue.toFixed(2)),
    feedCost: Number(feedCost.toFixed(2)),
    chickCost: Number(chickCost.toFixed(2))
  };
};

export const netIncome = (settlementValue, farmExpenses) => {
  return Number(((settlementValue || 0) - (farmExpenses || 0)).toFixed(2));
};
