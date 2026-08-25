const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
require('dotenv').config();

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mchicks';

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow assets from same origin
}));

// CORS — only allow configured frontend origins
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin, or if origin matches allowedOrigins, or any localhost in dev
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: origin not allowed'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// API routes
app.use('/api', apiRouter);

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Global error handler — never expose stack traces
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(status).json({
    error: isDev ? err.message : 'An unexpected error occurred. Please try again.'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
