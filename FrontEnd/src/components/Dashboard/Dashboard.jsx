import { useMemo } from 'react';
import { useDeviceData } from '../../context/DeviceDataContext';
import DeviceCard from './DeviceCard';

const Dashboard = () => {
  const { deviceData, loading, error, apiAvailable, lastUpdated } = useDeviceData();

  // Get unique device entries (latest data for each device)
  const uniqueDevices = useMemo(() => {
    const deviceMap = {};
    deviceData.forEach(device => {
      const id = device.deviceId;
      // If device doesn't exist in map or has a newer timestamp, update it
      if (!deviceMap[id] || new Date(deviceMap[id].timestamp) < new Date(device.timestamp)) {
        deviceMap[id] = device;
      }
    });
    return Object.values(deviceMap);
  }, [deviceData]);

  // Format timestamp for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <h2>Loading device data...</h2>
      </div>
    );
  }

  if (error && uniqueDevices.length === 0) {
    return (
      <div className="dashboard error">
        <h2>Error loading data</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (uniqueDevices.length === 0) {
    return (
      <div className="dashboard empty">
        <h2>No Active Devices</h2>
        <p>All devices have been deleted or no data is available.</p>
        <p>Please add device data through the Admin Console.</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>IoT Device Dashboard</h2>
        <p>Real-time monitoring of IoT devices</p>
        <p className="last-updated">Last Data Update: {formatDateTime(lastUpdated)}</p>
        
        {!apiAvailable && (
          <div className="api-status-warning">
            <p>⚠️ Backend API unavailable. Using sample data for demonstration.</p>
          </div>
        )}
        
        {error && (
          <div className="api-status-error">
            <p>{error}</p>
          </div>
        )}
      </div>
      
      <div className="devices-grid">
        {uniqueDevices.map((device) => (
          <DeviceCard key={device._id} device={device} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 