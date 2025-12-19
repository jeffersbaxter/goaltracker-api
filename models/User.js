// ============================================
// models/User.js
// ============================================

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  preferences: {
    defaultTimeframe: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'annually'],
      default: 'weekly'
    },
    defaultScalePercent: {
      type: Number,
      default: 5,
      min: 0.1,
      max: 100
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

// Indexes
// userSchema.index({ email: 1 });
// userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);