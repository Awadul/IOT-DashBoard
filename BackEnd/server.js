import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import deviceDataRoutes from './routes/deviceDataRoutes.js';

// Use ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables properly
// First try to load from .env file
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading .env file from:', envPath);
  dotenv.config({ path: envPath });
} else {
  // Fallback to default dotenv behavior
  console.log('Using default dotenv configuration');
  dotenv.config();
}

// Set environment variables if not set already
if (!process.env.PORT) process.env.PORT = '5000';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

// Only set MongoDB URI if not already set via .env file
if (!process.env.MONGODB_URI) {
  // Use production MongoDB connection string
  process.env.MONGODB_URI = 'mongodb+srv://admin:admin@cluster0.43ch1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
}

console.log('Environment:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI.substring(0, 25) + '...' // Log partial URI for security
});

// Connect to MongoDB
connectDB();

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
    environment: process.env.NODE_ENV,
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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
}); 