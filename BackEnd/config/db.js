import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Fallback MongoDB URI if environment variable is not set
const DEFAULT_MONGODB_URI = 'mongodb+srv://admin:admin@cluster0.43ch1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables or use default
    const mongoURI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
    
    // Log a masked version of the URI for debugging
    console.log('MongoDB URI being used:', `${mongoURI.substring(0, 15)}...`);
    console.log('Attempting to connect to MongoDB Atlas...');
    
    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      connectTimeoutMS: 10000, // Timeout for initial connection
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.error('Full error:', error);
    
    // For demonstration purposes, let's make the app continue even if DB connection fails
    console.log('⚠️ Continuing without MongoDB connection for demo purposes');
    
    // In production, you might want to exit with: 
    if (process.env.NODE_ENV === 'production') {
      console.error('Application requires MongoDB connection in production mode');
      process.exit(1);
    }
    
    return null;
  }
};

export default connectDB;