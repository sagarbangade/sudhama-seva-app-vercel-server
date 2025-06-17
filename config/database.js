const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create collections if they don't exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    if (!collectionNames.includes('sudhama_seva')) {
      await mongoose.connection.createCollection('sudhama_seva');
      console.log('Created collection: sudhama_seva');
    }

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  setTimeout(connectDB, 5000); // Attempt to reconnect after 5 seconds
});

module.exports = connectDB;