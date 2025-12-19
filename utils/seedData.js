// ============================================
// utils/seedData.js
// ============================================

const User = require('../models/User');
const Goal = require('../models/Goal');

const insertSampleData = async () => {
  try {
    console.log('\n--- Inserting sample data ---');

    // Check if sample data already exists
    const existingUser = await User.findOne({ email: 'demo@goaltracker.com' });
    if (existingUser) {
      console.log('Sample data already exists, skipping...');
      return existingUser;
    }

    // Create sample user
    const sampleUser = await User.create({
      email: 'demo@goaltracker.com',
      username: 'demouser',
      password: '$2b$10$abcdefghijklmnopqrstuv', // Would be hashed in production
      firstName: 'Demo',
      lastName: 'User',
      preferences: {
        defaultTimeframe: 'weekly',
        defaultScalePercent: 5,
        theme: 'light'
      }
    });

    console.log(`✓ Sample user created: ${sampleUser.email}`);

    // Create root goal
    const rootGoal = await Goal.create({
      userId: sampleUser._id,
      name: 'Weekly Workouts',
      description: 'Exercise 3 times per week to stay healthy',
      target: 3,
      progress: 0,
      unit: 'times',
      timeframe: 'weekly',
      goalDirection: 'increase',
      scalePercent: 5,
      scaleUpEnabled: true,
      scaleDownEnabled: true,
      roundUp: true,
      minTarget: 1,
      maxTarget: 10,
      parentId: null,
      history: [],
      isActive: true,
      isArchived: false
    });

    console.log(`✓ Root goal created: ${rootGoal.name}`);

    // Create subgoal
    await Goal.create({
      userId: sampleUser._id,
      name: 'Complete 3 Sets',
      description: 'Do 3 sets per workout session',
      target: 3,
      progress: 0,
      unit: 'sets',
      timeframe: 'daily',
      goalDirection: 'increase',
      scalePercent: 10,
      scaleUpEnabled: true,
      scaleDownEnabled: true,
      roundUp: true,
      minTarget: 1,
      maxTarget: 10,
      parentId: rootGoal._id,
      history: [],
      isActive: true,
      isArchived: false
    });

    console.log('✓ Subgoal created: Complete 3 Sets');

    // Create decrease goal
    await Goal.create({
      userId: sampleUser._id,
      name: 'Daily Sugar Intake',
      description: 'Reduce daily sugar consumption',
      target: 50,
      progress: 0,
      unit: 'grams',
      timeframe: 'daily',
      goalDirection: 'decrease',
      scalePercent: 5,
      scaleUpEnabled: true,
      scaleDownEnabled: true,
      roundUp: false,
      minTarget: 10,
      maxTarget: 100,
      parentId: null,
      history: [],
      isActive: true,
      isArchived: false
    });

    console.log('✓ Decrease goal created: Daily Sugar Intake');

    return sampleUser;
  } catch (error) {
    console.error('✗ Error inserting sample data:', error);
    throw error;
  }
};

module.exports = { insertSampleData };
