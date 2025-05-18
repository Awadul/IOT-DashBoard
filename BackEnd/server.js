import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import deviceDataRoutes from './routes/deviceDataRoutes.js';

// Load environment variables with simpler approach
dotenv.config();

console.log('Environment variables loaded');
console.log('Environment:', {
  PORT: process.env.PORT || '5000 (default)',
  NODE_ENV: process.env.NODE_ENV || 'development (default)',
  MONGODB_URI: process.env.MONGODB_URI ? 'Defined' : 'Undefined'
});

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/data', deviceDataRoutes);

// Hello World route
app.get('/', (req, res) => {
  res.json({
    message: 'API is running',
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      { method: 'GET', path: '/api/data', description: 'Get all device data' },
      { method: 'GET', path: '/api/data/latest', description: 'Get latest data for each device' },
      { method: 'POST', path: '/api/data', description: 'Add new device data' }
    ]
  });
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    console.log('Establishing connection to MongoDB...'); 
    await connectDB();
    console.log('MongoDB connected successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    // Don't crash the server in development mode
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode (without MongoDB)`);
      });
    }
  }
}

start();
