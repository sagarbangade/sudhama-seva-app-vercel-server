const mongoose = require("mongoose");

const RETRY_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 5;
let retryCount = 0;

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    retryCount = 0; // Reset retry count on successful connection

    // Handle collection initialization
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map((col) => col.name);

    if (!collectionNames.includes("users")) {
      await mongoose.connection.createCollection("users");
      console.log("Created collection: users");
    }
    // Add other required collections
    const requiredCollections = ["donors", "donations", "groups"];
    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        await mongoose.connection.createCollection(collection);
        console.log(`Created collection: ${collection}`);
      }
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    retryCount++;

    if (retryCount >= MAX_RETRIES) {
      console.error(
        `Failed to connect to MongoDB after ${MAX_RETRIES} attempts`
      );
      process.exit(1);
    }

    console.log(
      `Retrying connection in ${
        RETRY_INTERVAL / 1000
      } seconds... (Attempt ${retryCount}/${MAX_RETRIES})`
    );
    setTimeout(connectWithRetry, RETRY_INTERVAL);
  }
};

const connectDB = async () => {
  await connectWithRetry();

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB error:", err);
    if (err.name === "MongoNetworkError") {
      if (retryCount < MAX_RETRIES) {
        console.log(
          `Network error detected. Retrying connection in ${
            RETRY_INTERVAL / 1000
          } seconds...`
        );
        setTimeout(connectWithRetry, RETRY_INTERVAL);
      } else {
        console.error(`Failed to reconnect after ${MAX_RETRIES} attempts`);
        process.exit(1);
      }
    } else if (err.name === "MongoServerSelectionError") {
      console.error("Unable to select MongoDB server:", err.message);
    } else if (err.name === "MongooseServerSelectionError") {
      console.error("Mongoose server selection error:", err.message);
    }
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
    if (retryCount < MAX_RETRIES) {
      console.log(
        `Attempting to reconnect... (Attempt ${retryCount + 1}/${MAX_RETRIES})`
      );
      setTimeout(connectWithRetry, RETRY_INTERVAL);
    } else {
      console.error(`Failed to reconnect after ${MAX_RETRIES} attempts`);
      process.exit(1);
    }
  });

  process.on("SIGINT", async () => {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
      process.exit(1);
    }
  });
};

module.exports = connectDB;
