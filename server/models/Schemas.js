const mongoose = require('mongoose');

// ─── Batch Schema ────────────────────────────────────────────────────────────
const batchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true, trim: true },
  startDate: { type: Date, required: true },
  initialChicks: { type: Number, required: true, min: [1, 'Initial chicks must be at least 1'] },
  initialWeight: { type: Number, required: true, min: [0, 'Initial weight cannot be negative'] }, // grams
  breed: { type: String, required: true },
  shedNumber: { type: Number, required: true, min: [1, 'Shed number must be positive'] },
  shedLength: { type: Number, required: true, min: [1, 'Shed length must be positive'] }, // ft
  shedWidth: { type: Number, required: true, min: [1, 'Shed width must be positive'] },   // ft
  shedArea: { type: Number, required: true },   // sq.ft — auto-calculated
  targetDays: { type: Number, default: 36, min: [1, 'Target days must be at least 1'] },
  feedAllocationBags: { type: Number, required: true, min: [0, 'Feed allocation cannot be negative'] },
  bagWeight: { type: Number, default: 75, min: [1, 'Bag weight must be positive'] }, // kg
  status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
  // Stage-wise allocation (informational, not enforced totals)
  preStarterBags: { type: Number, default: 0, min: 0 },
  starterBags:    { type: Number, default: 0, min: 0 },
  growerBags:     { type: Number, default: 0, min: 0 },
  finisherBags:   { type: Number, default: 0, min: 0 },
  notes: { type: String },
  completionDate: { type: Date },
  finalSellingPricePerKg: { type: Number, min: 0 },
  farmLocation: {
    lat: Number,
    lng: Number,
    address: String,
    updatedAt: Date
  }
}, { timestamps: true });

// ─── Daily Log Schema ─────────────────────────────────────────────────────────
const dailyLogSchema = new mongoose.Schema({
  clientRecordId: { type: String, sparse: true, unique: true },
  batchId: { type: String, required: true },
  date: { type: Date, required: true },
  birdAge: { type: Number, required: true, min: [0, 'Bird age cannot be negative'] },
  mortality: { type: Number, default: 0, min: [0, 'Mortality cannot be negative'] },
  mortalityReason: { type: String, default: 'Unknown / Not Recorded' },
  feedBagsUsed: { type: Number, default: 0, min: [0, 'Feed cannot be negative'] },
  feedKgUsed: { type: Number, default: 0, min: [0, 'Feed kg cannot be negative'] },
  shedTemperature: { type: Number },
  shedHumidity: { type: Number, min: 0, max: 100 },
  waterLiters: { type: Number, default: 0, min: 0 },
  litterCondition: { type: String, enum: ['Good', 'Wet', 'Caked', 'Dry'], default: 'Good' },
  remarks: { type: String },
  imagePath: { type: String },
  aiAnalysis: {
    imageQuality: { type: String, enum: ['Good', 'Moderate', 'Poor'] },
    flockAppearance: { type: String, enum: ['Good', 'Monitor', 'Needs Review'] },
    visualUniformity: { type: String, enum: ['Good', 'Moderate', 'Poor'] },
    visibleDevelopment: { type: String, enum: ['Appears On Track', 'Appears Below Expected', 'Needs Review'] },
    visibleCondition: { type: String, enum: ['Normal-looking', 'Needs Monitoring', 'Unable to Assess'] },
    visibleObservations: { type: String }
  }
}, { timestamps: true });

// Compound index: prevents exact duplicate (batchId + birdAge) record
dailyLogSchema.index({ batchId: 1, birdAge: 1 }, { unique: false }); // non-unique for upsert

// ─── Weight Record Schema ─────────────────────────────────────────────────────
const weightRecordSchema = new mongoose.Schema({
  clientRecordId: { type: String, sparse: true, unique: true },
  batchId: { type: String, required: true },
  date: { type: Date, required: true },
  birdAge: { type: Number, required: true, min: [0, 'Bird age cannot be negative'] },
  sampleCount: { type: Number, required: true, min: [1, 'Sample count must be at least 1'] },
  totalSampleWeight: { type: Number, required: true, min: [0, 'Sample weight cannot be negative'] }, // kg
  averageWeight: { type: Number, required: true, min: [0, 'Average weight cannot be negative'] },     // grams
  individualWeights: [Number],
  minWeight: { type: Number, min: 0 },
  maxWeight: { type: Number, min: 0 },
  weightVariation: { type: Number, min: 0 },
  remarks: { type: String }
}, { timestamps: true });

// ─── Supplement Schema ────────────────────────────────────────────────────────
const supplementSchema = new mongoose.Schema({
  clientRecordId: { type: String, sparse: true, unique: true },
  batchId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
  unit: { type: String, required: true },
  date: { type: Date, required: true },
  cost: { type: Number, required: true, min: [0, 'Cost cannot be negative'] },
  purpose: { type: String },
  remarks: { type: String }
}, { timestamps: true });

// ─── Expense Schema ───────────────────────────────────────────────────────────
const expenseSchema = new mongoose.Schema({
  clientRecordId: { type: String, sparse: true, unique: true },
  batchId: { type: String, required: true },
  category: {
    type: String,
    enum: ['Feed', 'Supplements', 'Medicine', 'Electricity', 'Water', 'Labour', 'Maintenance', 'Cooling', 'Other'],
    required: true
  },
  amount: { type: Number, required: true, min: [0, 'Expense amount cannot be negative'] },
  date: { type: Date, required: true },
  description: { type: String }
}, { timestamps: true });

// ─── Supervisor Visit Schema ──────────────────────────────────────────────────
const supervisorVisitSchema = new mongoose.Schema({
  clientRecordId: { type: String, sparse: true, unique: true },
  batchId: { type: String, required: true },
  date: { type: Date, required: true },
  birdAge: { type: Number, required: true, min: 0 },
  sampleCount: { type: Number, min: [0, 'Sample count cannot be negative'] },
  averageWeight: { type: Number, min: [0, 'Average weight cannot be negative'] },
  mortality: { type: Number, min: [0, 'Mortality cannot be negative'] },
  feedStatus: { type: String },
  waterStatus: { type: String },
  shedTemperature: { type: Number },
  shedHumidity: { type: Number, min: 0, max: 100 },
  litterCondition: { type: String, enum: ['Good', 'Acceptable', 'Needs Attention'], default: 'Good' },
  generalObservation: { type: String },
  remarks: { type: String }
}, { timestamps: true });

// ─── Settings Schema ──────────────────────────────────────────────────────────
const settingsSchema = new mongoose.Schema({
  farmName: { type: String, default: 'M-CHICKS' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: 'Chengalpattu, Tamil Nadu' }
  },
  defaultBagWeight: { type: Number, default: 75 },
  feedPricePerBag: { type: Number, default: 2200, min: 0 },
  companySettlementRate: { type: Number, default: 7.50, min: 0 }, // ₹ per kg live weight
  chickCost: { type: Number, default: 0, min: 0 },
  breedTargets: {
    type: Map,
    of: [
      {
        day: Number,
        targetWeight: Number,    // grams
        targetTempMin: Number,
        targetTempMax: Number,
        targetHumidityMin: Number,
        targetHumidityMax: Number
      }
    ]
  }
});

module.exports = {
  Batch: mongoose.model('Batch', batchSchema),
  DailyLog: mongoose.model('DailyLog', dailyLogSchema),
  WeightRecord: mongoose.model('WeightRecord', weightRecordSchema),
  Supplement: mongoose.model('Supplement', supplementSchema),
  Expense: mongoose.model('Expense', expenseSchema),
  SupervisorVisit: mongoose.model('SupervisorVisit', supervisorVisitSchema),
  Settings: mongoose.model('Settings', settingsSchema)
};
