const mongoose = require('mongoose');
const { Batch, DailyLog, WeightRecord, Supplement, Expense, SupervisorVisit, Settings } = require('../models/Schemas');

const mongoURI = 'mongodb://localhost:27017/mchicks';

const breedTargets = {
  'Broiler Chicken': [
    { day: 0, targetWeight: 35, targetTempMin: 32, targetTempMax: 35, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 1, targetWeight: 45, targetTempMin: 32, targetTempMax: 35, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 2, targetWeight: 55, targetTempMin: 31, targetTempMax: 34, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 3, targetWeight: 68, targetTempMin: 31, targetTempMax: 34, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 4, targetWeight: 82, targetTempMin: 30, targetTempMax: 33, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 5, targetWeight: 98, targetTempMin: 30, targetTempMax: 33, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 6, targetWeight: 115, targetTempMin: 29, targetTempMax: 32, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 7, targetWeight: 190, targetTempMin: 29, targetTempMax: 32, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 8, targetWeight: 220, targetTempMin: 28, targetTempMax: 31, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 9, targetWeight: 255, targetTempMin: 28, targetTempMax: 31, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 10, targetWeight: 295, targetTempMin: 27, targetTempMax: 30, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 11, targetWeight: 340, targetTempMin: 27, targetTempMax: 30, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 12, targetWeight: 390, targetTempMin: 26, targetTempMax: 29, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 13, targetWeight: 445, targetTempMin: 26, targetTempMax: 29, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 14, targetWeight: 505, targetTempMin: 25, targetTempMax: 28, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 15, targetWeight: 570, targetTempMin: 25, targetTempMax: 28, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 16, targetWeight: 640, targetTempMin: 24, targetTempMax: 27, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 21, targetWeight: 1050, targetTempMin: 23, targetTempMax: 26, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 28, targetWeight: 1720, targetTempMin: 21, targetTempMax: 24, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 35, targetWeight: 2450, targetTempMin: 20, targetTempMax: 23, targetHumidityMin: 60, targetHumidityMax: 70 },
    { day: 36, targetWeight: 2550, targetTempMin: 20, targetTempMax: 23, targetHumidityMin: 60, targetHumidityMax: 70 }
  ]
};

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding.');

    // Clear existing
    await Batch.deleteMany({});
    await DailyLog.deleteMany({});
    await WeightRecord.deleteMany({});
    await Supplement.deleteMany({});
    await Expense.deleteMany({});
    await SupervisorVisit.deleteMany({});
    await Settings.deleteMany({});

    // 1. Seed Settings
    const defaultSettings = new Settings({
      farmName: 'M-CHICKS',
      location: {
        lat: 12.6841,
        lng: 79.9836,
        address: 'Chengalpattu, Tamil Nadu'
      },
      defaultBagWeight: 75,
      feedPricePerBag: 2200,
      companySettlementRate: 7.50,
      chickCost: 0,
      breedTargets: breedTargets
    });
    await defaultSettings.save();
    console.log('Settings seeded.');

    // 2. Seed Batch
    const startDate = new Date('2026-08-13T00:00:00.000Z');
    const newBatch = new Batch({
      batchId: 'BATCH-001',
      startDate: startDate,
      initialChicks: 4100,
      initialWeight: 35,
      breed: 'Broiler Chicken',
      shedNumber: 1,
      shedLength: 48,
      shedWidth: 28,
      shedArea: 1344,
      targetDays: 36,
      feedAllocationBags: 160,
      bagWeight: 75,
      preStarterBags: 25,
      starterBags: 25,
      growerBags: 35,
      finisherBags: 75,
      status: 'Active',
      notes: 'Initial monsoon batch.'
    });
    await newBatch.save();
    console.log('Batch BATCH-001 seeded.');

    // 3. Seed Daily Logs (Day 0 to Day 11)
    const logs = [];
    const dailyFeedBags = [0.5, 0.8, 1.0, 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0, 3.3, 3.6];
    const dailyMortality = [2, 3, 5, 8, 4, 6, 7, 5, 8, 9, 7, 6]; // Sum: 70
    const shedTemps = [34, 34, 33, 33, 32, 32, 31, 31, 30, 30, 29, 31]; // Day 11 temp is 31 (slightly elevated)
    const shedHumidities = [65, 66, 68, 67, 65, 68, 70, 71, 72, 73, 70, 75];

    for (let i = 0; i <= 11; i++) {
      const logDate = new Date(startDate);
      logDate.setDate(startDate.getDate() + i);

      logs.push({
        batchId: 'BATCH-001',
        date: logDate,
        birdAge: i,
        mortality: dailyMortality[i],
        mortalityReason: i === 3 ? 'Stress' : (i === 9 ? 'Smothering' : 'Natural'),
        feedBagsUsed: dailyFeedBags[i],
        feedKgUsed: dailyFeedBags[i] * 75,
        shedTemperature: shedTemps[i],
        shedHumidity: shedHumidities[i],
        waterLiters: Math.round(dailyFeedBags[i] * 75 * 2.2), // ~2.2x ratio
        litterCondition: i > 8 ? 'Wet' : 'Good',
        remarks: `Routine log for day ${i}`
      });
    }
    await DailyLog.insertMany(logs);
    console.log('Daily logs seeded.');

    // 4. Seed Weight Records (Day 0, Day 7, Day 11)
    const weightRecords = [
      {
        batchId: 'BATCH-001',
        date: startDate,
        birdAge: 0,
        sampleCount: 20,
        totalSampleWeight: 0.7, // 20 * 35g = 700g = 0.7kg
        averageWeight: 35,
        individualWeights: Array(20).fill(35),
        minWeight: 33,
        maxWeight: 37,
        weightVariation: 1,
        remarks: 'Arrival check.'
      },
      {
        batchId: 'BATCH-001',
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 7)),
        birdAge: 7,
        sampleCount: 15,
        totalSampleWeight: 2.925, // 15 * 195g = 2.925kg
        averageWeight: 195,
        individualWeights: [190, 195, 200, 185, 198, 192, 205, 190, 196, 194, 201, 188, 193, 197, 186],
        minWeight: 185,
        maxWeight: 205,
        weightVariation: 6,
        remarks: 'First week sample weight.'
      },
      {
        batchId: 'BATCH-001',
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 11)),
        birdAge: 11,
        sampleCount: 10,
        totalSampleWeight: 3.3, // 10 * 330g = 3.3kg
        averageWeight: 330, // Target: 340 (slightly below)
        individualWeights: [320, 335, 328, 315, 340, 332, 325, 338, 331, 336],
        minWeight: 315,
        maxWeight: 340,
        weightVariation: 8,
        remarks: 'Day 11 weight check.'
      }
    ];
    await WeightRecord.insertMany(weightRecords);
    console.log('Weight records seeded.');

    // 5. Seed Supplements
    const supplements = [
      {
        batchId: 'BATCH-001',
        name: 'Vitamins A & D',
        quantity: 2,
        unit: 'litres',
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 2)),
        cost: 850,
        purpose: 'Immunity booster'
      },
      {
        batchId: 'BATCH-001',
        name: 'Electrolytes',
        quantity: 5,
        unit: 'packets',
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 5)),
        cost: 450,
        purpose: 'Anti-stress during summer'
      }
    ];
    await Supplement.insertMany(supplements);
    console.log('Supplements seeded.');

    // 6. Seed Expenses
    const expenses = [
      {
        batchId: 'BATCH-001',
        category: 'Labour',
        amount: 3000,
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 1)),
        description: 'Chicks placement labour cost'
      },
      {
        batchId: 'BATCH-001',
        category: 'Electricity',
        amount: 1200,
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 10)),
        description: 'First 10 days power consumption'
      }
    ];
    await Expense.insertMany(expenses);
    console.log('Expenses seeded.');

    // 7. Seed Supervisor Visit
    const supervisorVisits = [
      {
        batchId: 'BATCH-001',
        date: new Date(new Date(startDate).setDate(startDate.getDate() + 7)),
        birdAge: 7,
        sampleCount: 15,
        averageWeight: 195,
        mortality: 35,
        feedStatus: 'Normal usage, starter stage',
        waterStatus: 'Clean water running',
        shedTemperature: 31,
        shedHumidity: 70,
        litterCondition: 'Dry',
        generalObservation: 'Flock activity is high. Normal distribution.',
        remarks: 'Weekly check completed.'
      }
    ];
    await SupervisorVisit.insertMany(supervisorVisits);
    console.log('Supervisor visits seeded.');

    console.log('Seeding finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
