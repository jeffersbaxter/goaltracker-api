const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not set!');
  process.exit(1);
}

const connectDB = async () => {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);
    
    console.log('✓ MongoDB connected successfully');
    console.log(`✓ Database: ${mongoose.connection.db.databaseName}`);
    console.log(`✓ Host: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    throw error;
  }
};

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
  } catch (error) {
    console.error('✗ Error closing MongoDB connection:', error);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };