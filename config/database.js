const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds
let retryCount = 0;

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 30000,
    });

    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    retryCount = 0; // Reset retry count on successful connection

    // Handle collection initialization
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    if (!collectionNames.includes('users')) {
      await mongoose.connection.createCollection('users');
      console.log('Created collection: users');
    }
    // Add other required collections
    const requiredCollections = ['donors', 'donations', 'groups'];
    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        await mongoose.connection.createCollection(collection);
        console.log(`Created collection: ${collection}`);
      }
    }

  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying connection... Attempt ${retryCount}/${MAX_RETRIES}`);
      setTimeout(connectWithRetry, RETRY_INTERVAL);
    } else {
      console.error('Max retries reached. Exiting process.');
      process.exit(1);
    }
  }
};

const connectDB = async () => {
  await connectWithRetry();

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
    if (err.name === 'MongoNetworkError') {
      setTimeout(connectWithRetry, RETRY_INTERVAL);
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    if (retryCount < MAX_RETRIES) {
      setTimeout(connectWithRetry, RETRY_INTERVAL);
    }
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
};

module.exports = connectDB;