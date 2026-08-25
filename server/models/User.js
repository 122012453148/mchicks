const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'supervisor'],
    default: 'owner'
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Never return passwordHash in API responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

// Static method: verify password
userSchema.statics.verifyPassword = async function (plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
};

// Static method: hash password
userSchema.statics.hashPassword = async function (plaintext) {
  return bcrypt.hash(plaintext, 12);
};

module.exports = mongoose.model('User', userSchema);
