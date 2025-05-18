import DeviceData from '../models/deviceData.js';

// Mock data for demonstration when DB is not available
const mockData = [
  {
    _id: 'mock1',
    deviceId: 'device001',
    temperature: 23.5,
    humidity: 48.2,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock2',
    deviceId: 'device002',
    temperature: 21.8,
    humidity: 52.4,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'mock3',
    deviceId: 'device003',
    temperature: 24.2,
    humidity: 45.7,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

// In-memory store for demo purposes
let inMemoryData = [...mockData];

// Track which devices have been deleted
let deletedDevices = new Set();

// Timer to generate data at consistent intervals 
let dataGenerationInterval;
let lastUpdatedTime = new Date();

// Get active devices (not deleted)
const getActiveDevices = () => {
  const defaultDevices = ['device001', 'device002', 'device003'];
  return defaultDevices.filter(deviceId => !deletedDevices.has(deviceId));
};

// Start generating data periodically (every 10 seconds)
const startDataGeneration = () => {
  // Clear any existing interval
  if (dataGenerationInterval) {
    clearInterval(dataGenerationInterval);
  }
  
  // Generate data every 10 seconds
  dataGenerationInterval = setInterval(() => {
    // Update last updated time
    lastUpdatedTime = new Date();
    
    // Generate new data only for active devices (not deleted)
    const devices = getActiveDevices();
    
    if (devices.length === 0) {
      console.log('No active devices to generate data for');
      return;
    }
    
    devices.forEach(deviceId => {
      // Create data for in-memory storage
      const newMockData = {
        _id: `mock${Date.now()}_${deviceId}`,
        deviceId,
        temperature: parseFloat((20 + Math.random() * 10).toFixed(1)),
        humidity: parseFloat((40 + Math.random() * 20).toFixed(1)),
        timestamp: lastUpdatedTime,
        createdAt: lastUpdatedTime,
        updatedAt: lastUpdatedTime,
      };
      
      // Add to in-memory store
      inMemoryData.unshift(newMockData);
      
      // Try to save to DB as well (without custom _id)
      try {
        DeviceData.create({
          deviceId,
          temperature: newMockData.temperature,
          humidity: newMockData.humidity,
          timestamp: lastUpdatedTime,
        }).catch(err => {
          console.log('Error saving generated data to DB:', err.message);
        });
      } catch (error) {
        console.log('Error creating device data:', error.message);
      }
    });
    
    // Keep memory store reasonable (100 records max)
    if (inMemoryData.length > 100) {
      inMemoryData = inMemoryData.slice(0, 100);
    }
    
    console.log(`Generated new data at ${lastUpdatedTime.toISOString()} for ${devices.length} devices`);
  }, 10000); // 10 seconds
  
  console.log('Started automatic data generation every 10 seconds');
};

// Start data generation right away
startDataGeneration();

// Utility function to handle database operations with fallback
const safeDbOperation = async (dbOperation, fallbackData) => {
  try {
    return await dbOperation();
  } catch (error) {
    console.log('⚠️ Using mock data due to DB error:', error.message);
    return fallbackData;
  }
};

// @desc    Create new device data
// @route   POST /api/data
// @access  Public
const createDeviceData = async (req, res) => {
  try {
    const { deviceId, temperature, humidity } = req.body;

    if (!deviceId || temperature === undefined || humidity === undefined) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // If this device was previously deleted, remove it from deleted list
    if (deletedDevices.has(deviceId)) {
      deletedDevices.delete(deviceId);
      console.log(`Device ${deviceId} reactivated`);
    }

    // Use current timestamp
    const currentTime = new Date();

    // Create data for MongoDB (without _id)
    const dbData = {
      deviceId,
      temperature,
      humidity,
      timestamp: currentTime,
    };

    // Mock data for fallback with custom _id
    const mockDataRecord = {
      _id: `mock${Date.now()}`,
      ...dbData,
      createdAt: currentTime,
      updatedAt: currentTime,
    };

    const deviceData = await safeDbOperation(
      async () => await DeviceData.create(dbData),
      mockDataRecord
    );

    // If using fallback, add to in-memory store
    if (deviceData._id.toString().includes('mock')) {
      inMemoryData.unshift(deviceData);
    }

    // Update the last updated time
    lastUpdatedTime = currentTime;

    res.status(201).json(deviceData);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get latest device data
// @route   GET /api/data/latest
// @access  Public
const getLatestDeviceData = async (req, res) => {
  try {
    // Try database operation first, fallback to memory if it fails
    const latestData = await safeDbOperation(
      async () => {
        return await DeviceData.aggregate([
          { $sort: { timestamp: -1 } },
          { $group: { _id: '$deviceId', latestEntry: { $first: '$$ROOT' } } },
          { $replaceRoot: { newRoot: '$latestEntry' } },
        ]);
      },
      // Group in-memory data by deviceId and get the latest
      Object.values(
        inMemoryData.reduce((acc, item) => {
          if (!acc[item.deviceId] || new Date(acc[item.deviceId].timestamp) < new Date(item.timestamp)) {
            acc[item.deviceId] = item;
          }
          return acc;
        }, {})
      )
    );

    // Attach the last updated time to the response
    res.json({
      lastUpdated: lastUpdatedTime,
      data: latestData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all device data
// @route   GET /api/data
// @access  Public
const getAllDeviceData = async (req, res) => {
  try {
    // Try database operation first, fallback to memory if it fails
    const deviceData = await safeDbOperation(
      async () => await DeviceData.find({}).sort({ timestamp: -1 }).limit(100),
      inMemoryData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    );

    // Attach the last updated time to the response
    res.json({
      lastUpdated: lastUpdatedTime,
      data: deviceData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get simulation status and last updated time
// @route   GET /api/data/status
// @access  Public
const getSimulationStatus = (req, res) => {
  res.json({
    simulationActive: !!dataGenerationInterval,
    lastUpdated: lastUpdatedTime,
    devices: getActiveDevices(),
    deletedDevices: Array.from(deletedDevices),
    updateInterval: 10000 // 10 seconds
  });
};

// @desc    Delete all data for a specific device
// @route   DELETE /api/data/:deviceId
// @access  Public
const deleteDeviceData = async (req, res) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      res.status(400);
      throw new Error('Please provide a device ID');
    }

    // Add to deleted devices set to prevent future data generation
    deletedDevices.add(deviceId);

    // Delete from database
    const result = await safeDbOperation(
      async () => await DeviceData.deleteMany({ deviceId }),
      { deletedCount: 0 }
    );

    // Delete from in-memory store
    const initialLength = inMemoryData.length;
    inMemoryData = inMemoryData.filter(item => item.deviceId !== deviceId);
    const memoryDeletedCount = initialLength - inMemoryData.length;

    // Use either DB result or memory result
    const deletedCount = result.deletedCount || memoryDeletedCount;

    // If no records found
    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No data found for device: ${deviceId}`
      });
    }

    // Log successful deletion
    console.log(`Successfully deleted device: ${deviceId} - Removed ${deletedCount} records`);
    console.log(`Active devices after deletion: ${getActiveDevices().join(', ')}`);

    res.json({
      success: true,
      message: `Successfully deleted all data for device: ${deviceId}`,
      deletedCount,
      activeDevices: getActiveDevices()
    });
  } catch (error) {
    console.error('Error deleting device data:', error.message);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export { createDeviceData, getLatestDeviceData, getAllDeviceData, getSimulationStatus, deleteDeviceData }; 