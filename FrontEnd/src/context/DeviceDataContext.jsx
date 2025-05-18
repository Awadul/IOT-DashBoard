import { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';

const DeviceDataContext = createContext();

// API settings
const API_URL = 'http://localhost:5000/api/data';

// Generate random temperature between 15-35°C
const getRandomTemperature = () => Math.round((15 + Math.random() * 20) * 10) / 10;

// Generate random humidity between 30-80%
const getRandomHumidity = () => Math.round((30 + Math.random() * 50) * 10) / 10;

// Initial mock data
const generateMockData = () => [
  {
    _id: 'mock1',
    deviceId: 'device001',
    temperature: getRandomTemperature(),
    humidity: getRandomHumidity(),
    timestamp: new Date().toISOString(),
  },
  {
    _id: 'mock2',
    deviceId: 'device002',
    temperature: getRandomTemperature(),
    humidity: getRandomHumidity(),
    timestamp: new Date().toISOString(),
  },
  {
    _id: 'mock3',
    deviceId: 'device003',
    temperature: getRandomTemperature(),
    humidity: getRandomHumidity(),
    timestamp: new Date().toISOString(),
  },
];

// Set to true to use mock data regardless of API status
const USE_MOCK_DATA = false;

export const DeviceDataProvider = ({ children }) => {
  const [deviceData, setDeviceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // References for storing device history
  const deviceHistoryRef = useRef({});
  const mockDataRef = useRef(generateMockData());
  
  // Add data point to device history
  const addToHistory = (device) => {
    const id = device.deviceId;
    if (!deviceHistoryRef.current[id]) {
      deviceHistoryRef.current[id] = [];
    }
    
    // Keep only the last 10 readings
    if (deviceHistoryRef.current[id].length >= 10) {
      deviceHistoryRef.current[id].pop();
    }
    
    deviceHistoryRef.current[id].unshift({
      temperature: device.temperature,
      humidity: device.humidity,
      timestamp: device.timestamp,
    });
  };
  
  // Update mock data with random values
  const updateMockData = () => {
    const updatedMockData = mockDataRef.current.map(device => {
      const updatedDevice = {
        ...device,
        temperature: getRandomTemperature(),
        humidity: getRandomHumidity(),
        timestamp: new Date().toISOString(),
      };
      
      addToHistory(updatedDevice);
      return updatedDevice;
    });
    
    mockDataRef.current = updatedMockData;
    return updatedMockData;
  };

  // Fetch all device data
  const fetchAllData = async () => {
    try {
      if (USE_MOCK_DATA) {
        console.log('Using mock data (forced)');
        const mockData = updateMockData();
        setDeviceData(mockData);
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }

      const response = await axios.get(API_URL, { timeout: 5000 });
      
      if (response.data && response.data.data) {
        // Add each device to history
        response.data.data.forEach(device => addToHistory(device));
        
        setDeviceData(response.data.data);
        setLastUpdated(response.data.lastUpdated);
        setError(null);
        setApiAvailable(true);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err) {
      console.error('API Error:', err.message);
      
      // If API is unavailable, use mock data
      if (!apiAvailable) {
        console.log('Using mock data (API unavailable)');
        const mockData = updateMockData();
        setDeviceData(mockData);
        setLastUpdated(new Date());
      } else {
        setError(`Error fetching data: ${err.message}`);
        setApiAvailable(false);
        // Use mock data after first API failure
        const mockData = updateMockData();
        setDeviceData(mockData);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest device data (for real-time updates)
  const fetchLatestData = async () => {
    try {
      if (USE_MOCK_DATA) {
        const mockData = updateMockData();
        setDeviceData(mockData);
        setLastUpdated(new Date());
        return;
      }

      const response = await axios.get(`${API_URL}/latest`, { timeout: 3000 });
      
      if (response.data && response.data.data) {
        // Add each device to history
        response.data.data.forEach(device => addToHistory(device));
        
        setDeviceData(response.data.data);
        setLastUpdated(response.data.lastUpdated);
        setError(null);
        setApiAvailable(true);
      } else {
        throw new Error('Invalid data format from API');
      }
    } catch (err) {
      if (!apiAvailable) {
        const mockData = updateMockData();
        setDeviceData(mockData);
        setLastUpdated(new Date());
      }
    }
  };

  // Fetch simulation status
  const fetchSimulationStatus = async () => {
    try {
      if (USE_MOCK_DATA) {
        // No need to do anything for mock data
        return;
      }

      const response = await axios.get(`${API_URL}/status`, { timeout: 3000 });
      console.log('Simulation status:', response.data);
      
      if (response.data) {
        // Update last updated time
        setLastUpdated(response.data.lastUpdated);
        
        // Check for any devices that are in our data but have been deleted on the server
        if (response.data.deletedDevices && response.data.deletedDevices.length > 0) {
          // Remove any deleted devices from our local data
          const deletedSet = new Set(response.data.deletedDevices);
          
          setDeviceData(prevData => 
            prevData.filter(device => !deletedSet.has(device.deviceId))
          );
          
          // Also remove from device history
          deletedSet.forEach(deviceId => {
            delete deviceHistoryRef.current[deviceId];
          });
        }
        
        setApiAvailable(true);
        setError(null);
      }
    } catch (err) {
      console.log('Error fetching simulation status:', err.message);
      // No need to update state or handle error - this is just a background check
    }
  };

  // Post new device data
  const addDeviceData = async (data) => {
    try {
      if (USE_MOCK_DATA || !apiAvailable) {
        // Create a mock response with the submitted data
        const mockResponse = {
          ...data,
          _id: `mock${Date.now()}`,
          timestamp: new Date().toISOString(),
        };
        
        console.log('Using mock data for submission');
        
        // Add to mock devices if it doesn't exist
        const existingDeviceIndex = mockDataRef.current.findIndex(
          d => d.deviceId === data.deviceId
        );
        
        if (existingDeviceIndex >= 0) {
          // Update existing device
          mockDataRef.current[existingDeviceIndex] = {
            ...mockDataRef.current[existingDeviceIndex],
            temperature: parseFloat(data.temperature),
            humidity: parseFloat(data.humidity),
            timestamp: new Date().toISOString(),
          };
        } else {
          // Add new device
          mockDataRef.current.push(mockResponse);
        }
        
        addToHistory(mockResponse);
        setDeviceData([...mockDataRef.current]);
        setLastUpdated(new Date());
        return mockResponse;
      }

      const response = await axios.post(API_URL, data, { timeout: 3000 });
      addToHistory(response.data);
      
      // Refresh all data to ensure consistency
      fetchAllData();
      
      setApiAvailable(true);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('API Error during submission:', err.message);
      setApiAvailable(false);
      
      // Create a mock response for the UI to continue working
      const mockResponse = {
        ...data,
        _id: `mock${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      
      addToHistory(mockResponse);
      
      // Add to mock devices
      mockDataRef.current.push(mockResponse);
      setDeviceData([...mockDataRef.current]);
      setLastUpdated(new Date());
      
      setError(`Error saving data: ${err.message}`);
      return mockResponse;
    }
  };
  
  // Delete a device and all its data
  const deleteDevice = async (deviceId) => {
    try {
      if (USE_MOCK_DATA || !apiAvailable) {
        // Handle deletion in mock data
        const initialLength = mockDataRef.current.length;
        mockDataRef.current = mockDataRef.current.filter(d => d.deviceId !== deviceId);
        
        // Remove device history
        delete deviceHistoryRef.current[deviceId];
        
        // Update device data state - remove all instances of this device
        setDeviceData(prevData => prevData.filter(d => d.deviceId !== deviceId));
        setLastUpdated(new Date());
        
        return {
          success: true,
          message: `Successfully deleted device: ${deviceId} (local only)`,
          deletedCount: initialLength - mockDataRef.current.length,
          activeDevices: mockDataRef.current.map(d => d.deviceId)
            .filter((id, index, self) => self.indexOf(id) === index) // unique ids
        };
      }

      // Call the delete API endpoint
      console.log(`Attempting to delete device: ${deviceId}`);
      const response = await axios.delete(`${API_URL}/${deviceId}`, { timeout: 8000 });
      console.log('Delete response:', response.data);
      
      if (response.data && response.data.success) {
        // Remove device history
        delete deviceHistoryRef.current[deviceId];
        
        // Update local state - remove ALL instances of this device
        setDeviceData(prevData => prevData.filter(d => d.deviceId !== deviceId));
        setLastUpdated(new Date());
        
        // Trigger a status check to update active devices info
        try {
          const statusResponse = await axios.get(`${API_URL}/status`, { timeout: 3000 });
          console.log('Updated status after deletion:', statusResponse.data);
        } catch (statusErr) {
          console.log('Could not fetch updated status:', statusErr.message);
        }
        
        setApiAvailable(true);
        setError(null);
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Unknown error occurred during deletion');
      }
    } catch (err) {
      console.error('API Error during deletion:', err.message);
      
      if (!apiAvailable) {
        // Fallback to mock deletion if API is unavailable
        const initialLength = mockDataRef.current.length;
        mockDataRef.current = mockDataRef.current.filter(d => d.deviceId !== deviceId);
        
        // Remove device history
        delete deviceHistoryRef.current[deviceId];
        
        // Update device data state - remove ALL instances
        setDeviceData(prevData => prevData.filter(d => d.deviceId !== deviceId));
        setLastUpdated(new Date());
        
        return {
          success: true,
          message: `Successfully deleted device: ${deviceId} (local only)`,
          deletedCount: initialLength - mockDataRef.current.length
        };
      }
      
      setError(`Error deleting device: ${err.message}`);
      return {
        success: false,
        message: `Error deleting device: ${err.message}`
      };
    }
  };
  
  // Get history for a specific device
  const getDeviceHistory = (deviceId) => {
    return deviceHistoryRef.current[deviceId] || [];
  };

  // Initial data load
  useEffect(() => {
    // Initial data fetch
    fetchAllData();

    // Poll for updates every 10 seconds to match backend simulation timing
    const dataInterval = setInterval(() => {
      fetchLatestData();
    }, 10000);
    
    // Check simulation status every 30 seconds to stay in sync
    const statusInterval = setInterval(() => {
      fetchSimulationStatus();
    }, 30000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <DeviceDataContext.Provider
      value={{
        deviceData,
        loading,
        error,
        apiAvailable,
        lastUpdated,
        addDeviceData,
        deleteDevice,
        getDeviceHistory,
      }}
    >
      {children}
    </DeviceDataContext.Provider>
  );
};

export const useDeviceData = () => useContext(DeviceDataContext);

export default DeviceDataContext; 