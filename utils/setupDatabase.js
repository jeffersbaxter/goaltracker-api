// ============================================
// utils/setupDatabase.js
// ============================================

const User = require('../models/User');
const Goal = require('../models/Goal');
const mongoose = require('mongoose');

const setupDatabase = async () => {
  try {
    console.log('\n--- Setting up database collections ---');

    // Get list of existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    console.log(`Existing collections: ${collectionNames.join(', ') || 'none'}`);

    // Ensure indexes are created
    await User.createIndexes();
    console.log('✓ User indexes created');

    await Goal.createIndexes();
    console.log('✓ Goal indexes created');

    console.log('✓ Database setup complete');

    return { User, Goal };
  } catch (error) {
    console.error('✗ Database setup error:', error);
    throw error;
  }
};

const verifySetup = async () => {
  try {
    console.log('\n--- Database Verification ---');

    const userCount = await User.countDocuments();
    const goalCount = await Goal.countDocuments();

    console.log(`Database: ${mongoose.connection.db.databaseName}`);
    console.log(`Users: ${userCount}`);
    console.log(`Goals: ${goalCount}`);

    // Show sample goals
    const sampleGoals = await Goal.find().limit(5);
    console.log('\nSample Goals:');
    sampleGoals.forEach(goal => {
      console.log(`  - ${goal.name} (${goal.timeframe}, ${goal.goalDirection})`);
    });

    console.log('\n✓ Verification complete');
  } catch (error) {
    console.error('✗ Verification error:', error);
    throw error;
  }
};

module.exports = { setupDatabase, verifySetup };
