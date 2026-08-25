/**
 * M-CHICKS Calculations Test Script
 * Runs all Realistic Test Scenarios to ensure calculations accuracy.
 */

import * as calc from './calc.js';

console.log('--- STARTING M-CHICKS CALCULATION TESTS ---');

let passed = true;

function assert(description, actual, expected) {
  if (actual === expected || (typeof actual === 'number' && typeof expected === 'number' && Math.abs(actual - expected) < 0.01)) {
    console.log(`✅ [PASS] ${description} (Actual: ${actual})`);
  } else {
    console.error(`❌ [FAIL] ${description} (Expected: ${expected}, Actual: ${actual})`);
    passed = false;
  }
}

// Scenario 1
// Initial birds: 4100
// Initial weight: 35g
// Mortality: 80
// Live birds: 4020
// Final/current weight: 1.50kg (1500g)
// Feed consumed: 150 bags of 75kg = 11,250 kg
{
  const initial = 4100;
  const initialWtGrams = 35;
  const mortality = 80;
  const currentWtGrams = 1500;
  const consumedBags = 150;
  const bagWt = 75;

  const live = calc.liveBirds(initial, mortality);
  assert('S1: Live birds count', live, 4020);

  const mortPct = calc.mortalityPercentage(mortality, initial);
  assert('S1: Mortality %', mortPct, 1.95);

  const liveBiomass = calc.biomass(live, currentWtGrams);
  assert('S1: Live biomass', liveBiomass, 6030);

  const initBiomass = calc.biomass(initial, initialWtGrams);
  assert('S1: Initial biomass', initBiomass, 143.5);

  const gain = liveBiomass - initBiomass;
  assert('S1: Weight gain', gain, 5886.5);

  const feedKg = consumedBags * bagWt;
  assert('S1: Feed consumed kg', feedKg, 11250);

  const farmFcr = calc.fcr(feedKg, liveBiomass);
  assert('S1: Farm FCR', farmFcr, 1.87); // 11250 / 6030 = 1.8656 -> 1.87

  const growthFcr = calc.growthFcr(feedKg, gain);
  assert('S1: Growth FCR', growthFcr, 1.91); // 11250 / 5886.5 = 1.911 -> 1.91
}

// Scenario 2
// Initial birds: 4100
// Mortality: 100
// Live: 4000
// Final weight: 1.50kg (1500g)
// Feed consumed: 160 bags of 75kg = 12000 kg
{
  const initial = 4100;
  const mortality = 100;
  const currentWtGrams = 1500;
  const consumedBags = 160;
  const bagWt = 75;

  const live = calc.liveBirds(initial, mortality);
  const liveBiomass = calc.biomass(live, currentWtGrams);
  const initBiomass = calc.biomass(initial, 35);
  const gain = liveBiomass - initBiomass;
  const feedKg = consumedBags * bagWt;

  assert('S2: Farm FCR', calc.fcr(feedKg, liveBiomass), 2.00); // 12000 / 6000 = 2.00
  assert('S2: Growth FCR', calc.growthFcr(feedKg, gain), 2.05); // 12000 / (6000 - 143.5) = 2.049 -> 2.05
}

// Scenario 3 & 4: Feed balances
{
  const allocated = 160;
  const consumed = 150;
  assert('S4: Feed remaining bags', calc.feedRemainingBags(allocated, consumed), 10);
  assert('S4: Feed remaining kg', calc.feedRemainingBags(allocated, consumed) * 75, 750);
}

// Scenario 5: Random weights
{
  const sampleCount = 10;
  const totalWeightKg = 6.20;
  const avg = totalWeightKg / sampleCount; // 0.62 kg
  assert('S5: Average Weight in kg', avg, 0.62);
  assert('S5: Average Weight in grams', avg * 1000, 620);
}

// Scenario 6: Mortality
{
  const initial = 4100;
  const deaths = 80;
  assert('S6: Live birds', calc.liveBirds(initial, deaths), 4020);
  assert('S6: Mortality Rate', calc.mortalityPercentage(deaths, initial), 1.95);
}

// Edge Cases
{
  assert('Edge: FCR with zero weight', calc.fcr(12000, 0), 'N/A');
  assert('Edge: Coverage with zero daily average', calc.feedCoverageDays(20, 0), 'N/A');
}

console.log('--- TEST RUN COMPLETED ---');
if (passed) {
  console.log('🎉 ALL TESTS PASSED!');
  process.exit(0);
} else {
  console.error('🚨 TEST RUN FAILED!');
  process.exit(1);
}
