// models/Goal.js

const mongoose = require('mongoose');

// History Entry Schema (embedded in Goal)
const historyEntrySchema = new mongoose.Schema({
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  achieved: {
    type: Number,
    required: true
  },
  success: {
    type: Boolean,
    required: true
  },
  scaledTo: {
    type: Number,
    required: true
  },
  manual: {
    type: Boolean,
    default: false
  },
  // Track which reset frequency was used
  resetFrequency: {
    type: String,
    enum: ['never', 'daily', 'weekly', 'monthly']
  },
  // For reset frequencies - include logs breakdown
  resetLogs: [{
    date: {
      type: Date,
      required: true
    },
    progress: {
      type: Number,
      required: true
    },
    targetMet: {
      type: Boolean,
      required: true
    },
    _id: false
  }],
  // For reset frequencies - store the reset target that was active
  resetTarget: {
    type: Number
  }
}, { _id: false });

// Main Goal Schema
const goalSchema = new mongoose.Schema({
  // ============================================
  // BASIC FIELDS (Existing - unchanged)
  // ============================================
  
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Goal information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Target - meaning depends on resetFrequency
  // If resetFrequency = 'never': total amount for period
  // If resetFrequency != 'never': number of reset periods required
  target: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  // ============================================
  // TIMEFRAME AND RESET CONFIGURATION
  // ============================================
  
  // Timeframe - when auto-scaling occurs
  timeframe: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'annually']
  },
  currentPeriodStart: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Reset frequency - how often progress resets within timeframe
  resetFrequency: {
    type: String,
    required: true,
    enum: ['never', 'daily', 'weekly', 'monthly'],
    default: 'never'
  },
  
  // ============================================
  // PROGRESS TRACKING
  // ============================================
  
  // Main progress counter
  // If resetFrequency = 'never': accumulates over entire period
  // If resetFrequency != 'never': number of reset periods completed
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  
  // Current reset period progress (only used if resetFrequency != 'never')
  currentResetProgress: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Target for each reset period (only used if resetFrequency != 'never')
  resetTarget: {
    type: Number,
    default: null,
    min: 0
  },
  
  // Count of successful reset periods (only used if resetFrequency != 'never')
  resetsCompleted: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Last reset timestamp (only used if resetFrequency != 'never')
  lastReset: {
    type: Date,
    default: Date.now
  },
  
  // Logs for each reset period (only used if resetFrequency != 'never')
  resetLogs: [{
    date: {
      type: Date,
      required: true
    },
    progress: {
      type: Number,
      required: true
    },
    targetMet: {
      type: Boolean,
      required: true
    },
    _id: false
  }],
  
  // ============================================
  // GOAL SETTINGS (Existing - unchanged)
  // ============================================
  
  // Goal direction (increase or decrease)
  goalDirection: {
    type: String,
    required: true,
    enum: ['increase', 'decrease'],
    default: 'increase'
  },
  
  // Auto-scaling settings
  scalePercent: {
    type: Number,
    required: true,
    default: 5,
    min: 0.1,
    max: 100
  },
  scaleUpEnabled: {
    type: Boolean,
    required: true,
    default: true
  },
  scaleDownEnabled: {
    type: Boolean,
    required: true,
    default: true
  },
  roundUp: {
    type: Boolean,
    required: true,
    default: true
  },
  minTarget: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  maxTarget: {
    type: Number,
    required: true,
    default: 100,
    min: 1
  },
  
  // Hierarchy support (for subgoals)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
    index: true
  },
  
  // Status flags
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // History tracking
  history: [historyEntrySchema]
  
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

// ============================================
// INDEXES
// ============================================

// goalSchema.index({ userId: 1, parentId: 1 });
// goalSchema.index({ userId: 1, isActive: 1, isArchived: 1 });
// goalSchema.index({ userId: 1, timeframe: 1 });
// goalSchema.index({ currentPeriodStart: 1 });
// goalSchema.index({ lastReset: 1 });

// ============================================
// VIRTUALS
// ============================================

goalSchema.virtual('subgoals', {
  ref: 'Goal',
  localField: '_id',
  foreignField: 'parentId'
});

// ============================================
// METHODS
// ============================================

// Check if reset is needed (based on resetFrequency)
goalSchema.methods.checkReset = function() {
  // Only applies if resetFrequency is set
  if (this.resetFrequency === 'never') {
    return false;
  }
  
  const now = new Date();
  const lastReset = new Date(this.lastReset);
  let shouldReset = false;
  
  // Determine if enough time has passed for a reset
  if (this.resetFrequency === 'daily') {
    shouldReset = now.toDateString() !== lastReset.toDateString();
  } else if (this.resetFrequency === 'weekly') {
    const weeksDiff = Math.floor((now - lastReset) / (7 * 24 * 60 * 60 * 1000));
    shouldReset = weeksDiff >= 1;
  } else if (this.resetFrequency === 'monthly') {
    const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                       (now.getMonth() - lastReset.getMonth());
    shouldReset = monthsDiff >= 1;
  }
  
  if (shouldReset) {
    // Check if previous period's target was met
    const targetMet = this.currentResetProgress >= this.resetTarget;
    
    // Save to logs
    if (this.currentResetProgress > 0 || this.resetLogs.length > 0) {
      this.resetLogs.push({
        date: lastReset,
        progress: this.currentResetProgress,
        targetMet: targetMet
      });
      
      // Increment completed count if target was met
      if (targetMet) {
        this.resetsCompleted += 1;
      }
    }
    
    // Reset for new period
    this.currentResetProgress = 0;
    this.lastReset = now;
    
    return true;
  }
  
  return false;
};

// Calculate progress percentage
goalSchema.methods.calculateProgress = function() {
  if (this.resetFrequency === 'never') {
    // Simple: progress / target
    return this.target > 0 ? (this.progress / this.target) * 100 : 0;
  } else {
    // Reset mode: resetsCompleted / target (target = number of periods required)
    return this.target > 0 ? (this.resetsCompleted / this.target) * 100 : 0;
  }
};

// Check if goal is achieved
goalSchema.methods.isGoalAchieved = function() {
  if (this.resetFrequency === 'never') {
    // Check total progress against target
    if (this.goalDirection === 'decrease') {
      return this.progress <= this.target;
    }
    return this.progress >= this.target;
    
  } else {
    // Check reset periods completed against target
    if (this.goalDirection === 'decrease') {
      return this.resetsCompleted <= this.target;
    }
    return this.resetsCompleted >= this.target;
  }
};

// Check if period should scale
goalSchema.methods.shouldScalePeriod = function() {
  const now = new Date();
  const periodStart = new Date(this.currentPeriodStart);
  const periodEnd = new Date(periodStart);
  
  switch (this.timeframe) {
    case 'daily': 
      periodEnd.setDate(periodEnd.getDate() + 1); 
      break;
    case 'weekly': 
      periodEnd.setDate(periodEnd.getDate() + 7); 
      break;
    case 'monthly': 
      periodEnd.setMonth(periodEnd.getMonth() + 1); 
      break;
    case 'annually': 
      periodEnd.setFullYear(periodEnd.getFullYear() + 1); 
      break;
  }
  
  return now >= periodEnd;
};

// Apply auto-scaling calculation
goalSchema.methods.applyAutoScaling = function(achieved) {
  const scalePercent = parseFloat(this.scalePercent) / 100;
  let newTarget = this.target;
  const isDecreaseGoal = this.goalDirection === 'decrease';

  if (isDecreaseGoal) {
    // For decrease goals, logic is inverted
    if (achieved && this.scaleUpEnabled) {
      const decrease = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target - decrease) : Math.floor(this.target - decrease);
    } else if (!achieved && this.scaleDownEnabled) {
      const increase = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target + increase) : Math.floor(this.target + increase);
    }
  } else {
    // For increase goals
    if (achieved && this.scaleUpEnabled) {
      const increase = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target + increase) : Math.floor(this.target + increase);
    } else if (!achieved && this.scaleDownEnabled) {
      const decrease = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target - decrease) : Math.floor(this.target - decrease);
    }
  }

  // Apply min/max constraints
  newTarget = Math.max(this.minTarget, Math.min(newTarget, this.maxTarget));

  return newTarget;
};

// Scale period (called when period ends)
goalSchema.methods.scalePeriod = async function() {
  const achieved = this.isGoalAchieved();
  const oldTarget = this.target;
  const newTarget = this.applyAutoScaling(achieved);
  
  // Build history entry
  const historyEntry = {
    periodStart: this.currentPeriodStart,
    periodEnd: new Date(),
    target: oldTarget,
    success: achieved,
    scaledTo: newTarget,
    manual: false,
    resetFrequency: this.resetFrequency
  };
  
  if (this.resetFrequency === 'never') {
    // Simple accumulation
    historyEntry.achieved = this.progress;
  } else {
    // Reset mode
    historyEntry.achieved = this.resetsCompleted;
    historyEntry.resetLogs = [...this.resetLogs];
    historyEntry.resetTarget = this.resetTarget;
  }
  
  this.history.push(historyEntry);
  
  // Reset for new period
  this.target = newTarget;
  this.currentPeriodStart = new Date();
  
  if (this.resetFrequency === 'never') {
    // Reset simple progress
    this.progress = 0;
  } else {
    // Reset all reset tracking
    this.currentResetProgress = 0;
    this.resetsCompleted = 0;
    this.resetLogs = [];
    this.lastReset = new Date();
  }
  
  return this;
};

// Log progress
goalSchema.methods.logProgress = async function(increment = 1) {
  // Check if reset is needed (for resetFrequency != 'never')
  this.checkReset();
  
  // Check if period should scale
  if (this.shouldScalePeriod()) {
    await this.scalePeriod();
  }
  
  // Add progress based on resetFrequency
  if (this.resetFrequency === 'never') {
    // Simple accumulation
    this.progress += increment;
  } else {
    // Add to current reset period progress
    this.currentResetProgress += increment;
  }
  
  await this.save();
  return this;
};

// Manual scale
goalSchema.methods.manualScale = async function(direction) {
  const achieved = direction === 'up';
  const oldTarget = this.target;
  const newTarget = this.applyAutoScaling(achieved);
  
  // Build history entry
  const historyEntry = {
    periodStart: this.currentPeriodStart,
    periodEnd: new Date(),
    target: oldTarget,
    success: achieved,
    scaledTo: newTarget,
    manual: true,
    resetFrequency: this.resetFrequency
  };
  
  if (this.resetFrequency === 'never') {
    historyEntry.achieved = this.progress;
  } else {
    historyEntry.achieved = this.resetsCompleted;
    historyEntry.resetLogs = [...this.resetLogs];
    historyEntry.resetTarget = this.resetTarget;
  }
  
  this.history.push(historyEntry);
  
  // Reset for new period
  this.target = newTarget;
  this.currentPeriodStart = new Date();
  
  if (this.resetFrequency === 'never') {
    this.progress = 0;
  } else {
    this.currentResetProgress = 0;
    this.resetsCompleted = 0;
    this.resetLogs = [];
    this.lastReset = new Date();
  }
  
  await this.save();
  return this;
};

// ============================================
// STATIC METHODS
// ============================================

goalSchema.statics.findRootGoals = function(userId) {
  return this.find({ 
    userId, 
    parentId: null, 
    isActive: true, 
    isArchived: false 
  }).sort({ created: -1 });
};

goalSchema.statics.findSubgoals = function(parentId) {
  return this.find({ 
    parentId, 
    isActive: true, 
    isArchived: false 
  }).sort({ created: 1 });
};

goalSchema.statics.findGoalTree = async function(userId) {
  const rootGoals = await this.findRootGoals(userId);
  
  for (let goal of rootGoals) {
    await goal.populate({
      path: 'subgoals',
      match: { isActive: true, isArchived: false },
      populate: {
        path: 'subgoals',
        match: { isActive: true, isArchived: false }
      }
    });
  }
  
  return rootGoals;
};

goalSchema.statics.deleteGoalAndSubgoals = async function(goalId) {
  const goal = await this.findById(goalId);
  if (!goal) return null;
  
  const findAllSubgoals = async (parentId) => {
    const subgoals = await this.find({ parentId });
    let allSubgoals = [...subgoals];
    
    for (let subgoal of subgoals) {
      const nested = await findAllSubgoals(subgoal._id);
      allSubgoals = [...allSubgoals, ...nested];
    }
    
    return allSubgoals;
  };
  
  const allSubgoals = await findAllSubgoals(goalId);
  const idsToDelete = [goalId, ...allSubgoals.map(g => g._id)];
  
  await this.deleteMany({ _id: { $in: idsToDelete } });
  return { deleted: idsToDelete.length };
};

// ============================================
// EXPORT
// ============================================

module.exports = mongoose.model('Goal', goalSchema);