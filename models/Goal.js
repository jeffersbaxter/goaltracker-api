// ============================================
// models/Goal.js
// ============================================

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
  }
}, { _id: false });

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
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
  target: {
    type: Number,
    required: true,
    min: 0
  },
  progress: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
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
  goalDirection: {
    type: String,
    required: true,
    enum: ['increase', 'decrease'],
    default: 'increase'
  },
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
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
    index: true
  },
  history: [historyEntrySchema],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: { createdAt: 'created', updatedAt: 'updated' }
});

// Indexes
// goalSchema.index({ userId: 1, parentId: 1 });
// goalSchema.index({ userId: 1, isActive: 1, isArchived: 1 });
// goalSchema.index({ userId: 1, timeframe: 1 });
// goalSchema.index({ currentPeriodStart: 1 });

// Virtual for subgoals
goalSchema.virtual('subgoals', {
  ref: 'Goal',
  localField: '_id',
  foreignField: 'parentId'
});

// Methods
goalSchema.methods.calculateProgress = function() {
  return this.target > 0 ? (this.progress / this.target) * 100 : 0;
};

goalSchema.methods.isGoalAchieved = function() {
  if (this.goalDirection === 'decrease') {
    return this.progress <= this.target;
  }
  return this.progress >= this.target;
};

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

goalSchema.methods.applyAutoScaling = function(achieved) {
  const scalePercent = parseFloat(this.scalePercent) / 100;
  let newTarget = this.target;
  const isDecreaseGoal = this.goalDirection === 'decrease';

  if (isDecreaseGoal) {
    if (achieved && this.scaleUpEnabled) {
      const decrease = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target - decrease) : Math.floor(this.target - decrease);
    } else if (!achieved && this.scaleDownEnabled) {
      const increase = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target + increase) : Math.floor(this.target + increase);
    }
  } else {
    if (achieved && this.scaleUpEnabled) {
      const increase = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target + increase) : Math.floor(this.target + increase);
    } else if (!achieved && this.scaleDownEnabled) {
      const decrease = this.target * scalePercent;
      newTarget = this.roundUp ? Math.ceil(this.target - decrease) : Math.floor(this.target - decrease);
    }
  }

  newTarget = Math.max(this.minTarget, Math.min(newTarget, this.maxTarget));
  return newTarget;
};

goalSchema.methods.logProgress = async function(increment = 1) {
  this.progress += increment;
  
  if (this.shouldScalePeriod()) {
    const achieved = this.isGoalAchieved();
    const oldTarget = this.target;
    const newTarget = this.applyAutoScaling(achieved);
    
    this.history.push({
      periodStart: this.currentPeriodStart,
      periodEnd: new Date(),
      target: oldTarget,
      achieved: this.progress,
      success: achieved,
      scaledTo: newTarget,
      manual: false
    });
    
    this.target = newTarget;
    this.progress = 0;
    this.currentPeriodStart = new Date();
  }
  
  await this.save();
  return this;
};

goalSchema.methods.manualScale = async function(direction) {
  const achieved = direction === 'up';
  const oldTarget = this.target;
  const newTarget = this.applyAutoScaling(achieved);
  
  this.history.push({
    periodStart: this.currentPeriodStart,
    periodEnd: new Date(),
    target: oldTarget,
    achieved: this.progress,
    success: achieved,
    scaledTo: newTarget,
    manual: true
  });
  
  this.target = newTarget;
  this.progress = 0;
  this.currentPeriodStart = new Date();
  
  await this.save();
  return this;
};

// Static methods
goalSchema.statics.findRootGoals = function(userId) {
    const g = this.find({ 
    userId, 
    parentId: null, 
    isActive: true, 
    isArchived: false 
  }).sort({ created: -1 });
  return g
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

module.exports = mongoose.model('Goal', goalSchema);
