/**
 * M-CHICKS User Seed Script
 * Creates the initial owner account with a securely hashed password.
 * Run once: node server/scripts/seedUser.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mchicks';

async function seedUser() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ username: 'madhan333' });
  if (existing) {
    console.log('User madhan333 already exists — skipping seed.');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash('Mchick333', 12);

  const user = new User({
    username: 'madhan333',
    passwordHash,
    role: 'owner'
  });

  await user.save();
  console.log('✅ Owner user created: madhan333 (password hashed with bcrypt, rounds=12)');
  await mongoose.disconnect();
}

seedUser().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
