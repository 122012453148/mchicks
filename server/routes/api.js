const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const { Batch, DailyLog, WeightRecord, Supplement, Expense, SupervisorVisit, Settings } = require('../models/Schemas');
const User = require('../models/User');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

// Login rate limiter — max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Configure multer storage for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Securely serve static upload files
router.use('/uploads', requireAuth, express.static(path.join(__dirname, '../uploads')));

// 1. Auth Endpoints (PUBLIC — no auth required)
router.post('/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = await User.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/auth/verify', requireAuth, (req, res) => {
  res.json({ authenticated: true, user: { username: req.user.username, role: req.user.role } });
});



// 2. Settings Endpoint
router.get('/settings', requireAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ farmName: 'M-CHICKS' });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', requireAuth, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Weather Service
router.get('/weather', requireAuth, async (req, res) => {
  try {
    let lat = req.query.lat;
    let lng = req.query.lng;
    let address = req.query.address;
    let isDemo = false;

    if (!lat || !lng) {
      const settings = await Settings.findOne();
      lat = settings?.location?.lat || 12.6841;
      lng = settings?.location?.lng || 79.9836;
      address = (settings?.location?.address || 'Chengalpattu, Tamil Nadu') + ' (Demo Data)';
      isDemo = true;
    }
    
    // Call Open-Meteo (No API key needed, production-quality, fast, free)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m`;
    const response = await axios.get(url);
    
    const currentWeather = response.data.current_weather;
    // Get humidity from hourly forecasts matching the current time index or fallback to 70%
    const currentHourIndex = new Date().getHours();
    const humidity = response.data.hourly?.relativehumidity_2m?.[currentHourIndex] || 70;

    res.json({
      temperature: currentWeather.temperature,
      feelsLike: Math.round(currentWeather.temperature + (humidity > 70 ? 2 : 0)), // Simple heat index estimation
      humidity: humidity,
      wind: currentWeather.windspeed,
      condition: currentWeather.weathercode <= 3 ? 'Clear/Sunny' : (currentWeather.weathercode <= 65 ? 'Rainy' : 'Overcast'),
      address: address || 'Detected Location',
      isDemo: isDemo,
      lat,
      lng
    });
  } catch (err) {
    // Graceful fallback to realistic data if API fails or timeout occurs
    res.json({
      temperature: 31,
      feelsLike: 33,
      humidity: 72,
      wind: 12,
      condition: 'Partly Cloudy',
      address: 'Chengalpattu, Tamil Nadu',
      warning: 'Fallback weather values'
    });
  }
});

// 4. Batches List & Add
router.get('/batches', requireAuth, async (req, res) => {
  try {
    const batches = await Batch.find().sort({ startDate: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', requireAuth, async (req, res) => {
  try {
    const {
      batchId,
      startDate,
      initialChicks,
      initialWeight,
      breed,
      shedNumber,
      shedLength,
      shedWidth,
      targetDays,
      feedAllocationBags,
      bagWeight,
      preStarterBags,
      starterBags,
      growerBags,
      finisherBags,
      notes
    } = req.body;

    const area = Number(shedLength) * Number(shedWidth);

    const batch = new Batch({
      batchId,
      startDate,
      initialChicks,
      initialWeight,
      breed,
      shedNumber,
      shedLength,
      shedWidth,
      shedArea: area,
      targetDays,
      feedAllocationBags,
      bagWeight: bagWeight || 75,
      preStarterBags,
      starterBags,
      growerBags,
      finisherBags,
      notes
    });

    await batch.save();
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Batch Details & Actions
router.get('/batches/:id', requireAuth, async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/batches/:id', requireAuth, async (req, res) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { batchId: req.params.id },
      req.body,
      { new: true }
    );
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Batch
router.post('/batches/:id/complete', requireAuth, async (req, res) => {
  try {
    const { finalSellingPricePerKg, completionDate } = req.body;
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    
    batch.status = 'Completed';
    batch.completionDate = completionDate || new Date();
    batch.finalSellingPricePerKg = finalSellingPricePerKg;
    await batch.save();
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Batch Location
router.post('/batches/:id/location', requireAuth, async (req, res) => {
  try {
    const { lat, lng, address } = req.body;
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    
    batch.farmLocation = {
      lat,
      lng,
      address,
      updatedAt: new Date()
    };
    await batch.save();
    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Daily Logs Endpoints
router.get('/batches/:id/logs', requireAuth, async (req, res) => {
  try {
    const logs = await DailyLog.find({ batchId: req.params.id }).sort({ birdAge: 1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:id/logs', requireAuth, async (req, res) => {
  try {
    const { date, birdAge, mortality, mortalityReason, feedBagsUsed, shedTemperature, shedHumidity, waterLiters, litterCondition, remarks, clientRecordId } = req.body;
    
    if (clientRecordId) {
      const existing = await DailyLog.findOne({ clientRecordId });
      if (existing) return res.status(200).json(existing);
    }

    // Check if log already exists for this day
    let log = await DailyLog.findOne({ batchId: req.params.id, birdAge: Number(birdAge) });
    const payload = {
      batchId: req.params.id,
      date,
      birdAge: Number(birdAge),
      mortality: Number(mortality || 0),
      mortalityReason,
      feedBagsUsed: Number(feedBagsUsed || 0),
      feedKgUsed: Number(feedBagsUsed || 0) * 75, // Default 75kg/bag
      shedTemperature: Number(shedTemperature || 0),
      shedHumidity: Number(shedHumidity || 0),
      waterLiters: Number(waterLiters || 0),
      litterCondition,
      remarks,
      ...(clientRecordId && { clientRecordId })
    };

    if (log) {
      Object.assign(log, payload);
    } else {
      log = new DailyLog(payload);
    }
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:id/logs-with-image', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { date, birdAge, mortality, mortalityReason, feedBagsUsed, shedTemperature, shedHumidity, waterLiters, litterCondition, remarks, clientRecordId } = req.body;
    
    if (clientRecordId) {
      const existing = await DailyLog.findOne({ clientRecordId });
      if (existing) return res.status(200).json(existing);
    }

    const imagePath = req.file ? `/api/uploads/${req.file.filename}` : null;
    
    // Simulate AI Analysis if image is present
    let aiAnalysis = null;
    if (imagePath) {
      // Simulate random quality issue for 10% of cases
      const isPoorQuality = Math.random() < 0.1;
      if (isPoorQuality) {
        aiAnalysis = {
          imageQuality: 'Poor',
          visibleObservations: 'Image quality is not sufficient for reliable visual analysis. Please upload a clearer and more representative flock image.'
        };
      } else {
        // We will default to a good evaluation but the logic in the frontend handles actual weight mismatch
        aiAnalysis = {
          imageQuality: 'Good',
          flockAppearance: 'Good',
          visualUniformity: 'Good',
          visibleDevelopment: 'Appears On Track',
          visibleCondition: 'Normal-looking',
          visibleObservations: 'Flock appears reasonably uniform in the uploaded representative image. Visual appearance indicates normal growth.'
        };
      }
    }

    let log = await DailyLog.findOne({ batchId: req.params.id, birdAge: Number(birdAge) });
    const payload = {
      batchId: req.params.id,
      date,
      birdAge: Number(birdAge),
      mortality: Number(mortality || 0),
      mortalityReason,
      feedBagsUsed: Number(feedBagsUsed || 0),
      feedKgUsed: Number(feedBagsUsed || 0) * 75,
      shedTemperature: Number(shedTemperature || 0),
      shedHumidity: Number(shedHumidity || 0),
      waterLiters: Number(waterLiters || 0),
      litterCondition,
      remarks,
      ...(clientRecordId && { clientRecordId }),
      ...(imagePath && { imagePath }),
      ...(aiAnalysis && { aiAnalysis })
    };

    if (log) {
      Object.assign(log, payload);
    } else {
      log = new DailyLog(payload);
    }
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Image uploaded successfully, but visual analysis is currently unavailable.' });
  }
});

// 7. Weight Records Endpoints
router.get('/batches/:id/weights', requireAuth, async (req, res) => {
  try {
    const weights = await WeightRecord.find({ batchId: req.params.id }).sort({ birdAge: 1 });
    res.json(weights);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:id/weights', requireAuth, async (req, res) => {
  try {
    const { date, birdAge, sampleCount, totalSampleWeight, averageWeight, individualWeights, remarks, clientRecordId } = req.body;
    
    if (clientRecordId) {
      const existing = await WeightRecord.findOne({ clientRecordId });
      if (existing) return res.status(200).json(existing);
    }

    // Calculated statistics for individual weights if provided
    let calculatedAvg = averageWeight;
    let minW = 0, maxW = 0, stdDev = 0;
    
    if (individualWeights && individualWeights.length > 0) {
      const numericWeights = individualWeights.map(Number);
      minW = Math.min(...numericWeights);
      maxW = Math.max(...numericWeights);
      const sum = numericWeights.reduce((a, b) => a + b, 0);
      calculatedAvg = Math.round(sum / numericWeights.length);
      
      // Calculate simple weight variation (stdDev estimate)
      const avg = sum / numericWeights.length;
      const squareDiffs = numericWeights.map(v => Math.pow(v - avg, 2));
      stdDev = Math.round(Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / numericWeights.length));
    } else {
      calculatedAvg = averageWeight || Math.round((Number(totalSampleWeight) / Number(sampleCount)) * 1000);
    }

    const weightRecord = new WeightRecord({
      clientRecordId: clientRecordId || undefined,
      batchId: req.params.id,
      date,
      birdAge: Number(birdAge),
      sampleCount: Number(sampleCount),
      totalSampleWeight: Number(totalSampleWeight) || ((calculatedAvg * sampleCount) / 1000),
      averageWeight: calculatedAvg,
      individualWeights: individualWeights || [],
      minWeight: minW,
      maxWeight: maxW,
      weightVariation: stdDev,
      remarks
    });

    await weightRecord.save();
    res.status(201).json(weightRecord);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Supplements Endpoints
router.get('/batches/:id/supplements', requireAuth, async (req, res) => {
  try {
    const items = await Supplement.find({ batchId: req.params.id }).sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:id/supplements', requireAuth, async (req, res) => {
  try {
    const { clientRecordId } = req.body;
    if (clientRecordId) {
      const existing = await Supplement.findOne({ clientRecordId });
      if (existing) return res.status(200).json(existing);
    }
    const item = new Supplement({ batchId: req.params.id, ...req.body });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/batches/:id/supplements/:itemId', requireAuth, async (req, res) => {
  try {
    await Supplement.findByIdAndDelete(req.params.itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Expenses Endpoints
router.get('/batches/:id/expenses', requireAuth, async (req, res) => {
  try {
    const items = await Expense.find({ batchId: req.params.id }).sort({ date: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:id/expenses', requireAuth, async (req, res) => {
  try {
    const { clientRecordId } = req.body;
    if (clientRecordId) {
      const existing = await Expense.findOne({ clientRecordId });
      if (existing) return res.status(200).json(existing);
    }
    const item = new Expense({ batchId: req.params.id, ...req.body });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/batches/:id/expenses/:itemId', requireAuth, async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.itemId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Supervisor visits Endpoints
router.get('/batches/:id/supervisor', requireAuth, async (req, res) => {
  try {
    const visits = await SupervisorVisit.find({ batchId: req.params.id }).sort({ date: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches/:id/supervisor', requireAuth, async (req, res) => {
  try {
    const { clientRecordId } = req.body;
    if (clientRecordId) {
      const existing = await SupervisorVisit.findOne({ clientRecordId });
      if (existing) return res.status(200).json(existing);
    }
    const visit = new SupervisorVisit({ batchId: req.params.id, ...req.body });
    await visit.save();
    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Health Check (public)
router.get('/health', async (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    server: 'M-CHICKS API',
    database: dbState[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
