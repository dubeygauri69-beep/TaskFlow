const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    
    // Only use in-memory server in development if URI is missing or a placeholder
    if (process.env.NODE_ENV !== 'production' && (!uri || uri.includes('<username>') || uri.includes('<password>') || uri.includes('<db_password>'))) {
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log('Using in-memory MongoDB server for development');
    } else if (!uri || uri.includes('<password>') || uri.includes('<db_password>')) {
        throw new Error("A valid MONGODB_URI environment variable is required in production. Please replace <password> with your actual password.");
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Removed process.exit(1) to allow the server to start for debugging
  }
};

module.exports = connectDB;
