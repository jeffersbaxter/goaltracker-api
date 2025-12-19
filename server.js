const { connectDB, disconnectDB } = require('./config/database');
const { setupDatabase, verifySetup } = require('./utils/setupDatabase');
const { insertSampleData } = require('./utils/seedData');

const initializeDatabase = async (options = {}) => {
  const { insertSamples = true, verify = true } = options;

  try {
    // Connect to MongoDB
    await connectDB();

    // Setup database and collections
    const models = await setupDatabase();

    // Insert sample data if requested
    if (insertSamples) {
      await insertSampleData();
    }

    // Verify setup if requested
    if (verify) {
      await verifySetup();
    }

    console.log('\n✓ Database initialization complete!\n');

    return models;
  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};

// Graceful Shutdown
const gracefulShutdown = async () => {
  try {
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Run if executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Press Ctrl+C to exit...');
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, connectDB, disconnectDB };