import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment variables
    const mongoURI = process.env.MONGODB_URI;
    
    // Show only partial URI in logs for security
    const partialURI = mongoURI ? `${mongoURI.substring(0, 25)}...` : 'undefined';
    console.log('MongoDB URI (partial for security):', partialURI);
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB Atlas...');
    
    // Try to connect with appropriate options
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      connectTimeoutMS: 10000, // Timeout for initial connection
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    
    // For demonstration purposes, let's make the app continue even if DB connection fails
    console.log('⚠️ Continuing without MongoDB connection for demo purposes');
    
    // In production, you might want to exit with: 
    if (process.env.NODE_ENV === 'production') {
      console.error('Application requires MongoDB connection in production mode');
      // Uncomment to force exit on connection failure in production
      // process.exit(1);
    }
    
    return null;
  }
};

export default connectDB; 