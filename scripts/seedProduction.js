require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Goal = require('../models/Goal');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set');
  process.exit(1);
}

async function seedProduction() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if demo user exists
    const existingUser = await User.findOne({ email: 'demo@goaltracker.com' });
    
    if (existingUser) {
      console.log('Demo user already exists');
      await mongoose.connection.close();
      return;
    }

    console.log('Creating demo user...');
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const demoUser = await User.create({
      email: 'demo@goaltracker.com',
      username: 'demouser',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      preferences: {
        defaultTimeframe: 'weekly',
        defaultScalePercent: 5,
        theme: 'light'
      }
    });

    console.log('✓ Demo user created:', demoUser.email);

    // Create sample goals
    console.log('Creating sample goals...');
    
    const rootGoal = await Goal.create({
      userId: demoUser._id,
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

    console.log('✓ Root goal created:', rootGoal.name);

    await Goal.create({
      userId: demoUser._id,
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

    console.log('✓ Subgoal created');

    await Goal.create({
      userId: demoUser._id,
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

    console.log('✓ Decrease goal created');
    console.log('\n✓ Seeding complete!');
    console.log('\nDemo credentials:');
    console.log('Email: demo@goaltracker.com');
    console.log('Password: demo123');

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seedProduction();