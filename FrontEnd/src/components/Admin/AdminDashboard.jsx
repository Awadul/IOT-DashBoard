import { useState, useMemo } from 'react';
import AdminForm from './AdminForm';
import { useDeviceData } from '../../context/DeviceDataContext';

const AdminDashboard = () => {
  const { 
    deviceData, 
    loading, 
    error, 
    apiAvailable, 
    lastUpdated, 
    deleteDevice 
  } = useDeviceData();
  
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  // Format timestamp for display
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get unique device IDs and sorted data for display
  const { uniqueDeviceIds, sortedData } = useMemo(() => {
    // Get unique device IDs
    const uniqueIds = [...new Set(deviceData.map(device => device.deviceId))];
    
    // Sort data by timestamp (newest first)
    const sortedDeviceData = [...deviceData].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return {
      uniqueDeviceIds: uniqueIds,
      sortedData: sortedDeviceData
    };
  }, [deviceData]);
  
  // Handle delete confirmation
  const confirmDelete = (deviceId) => {
    setDeviceToDelete(deviceId);
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setDeviceToDelete(null);
  };
  
  // Handle delete action
  const handleDeleteDevice = async (deviceId) => {
    setIsDeleting(true);
    setDeleteMessage(null);
    
    try {
      console.log(`Deleting device: ${deviceId}`);
      const response = await deleteDevice(deviceId);
      console.log('Delete response:', response);
      
      if (response.success) {
        // Show more detailed success message including active devices
        const activeDevicesMessage = response.activeDevices && response.activeDevices.length > 0 
          ? `Active devices: ${response.activeDevices.join(', ')}`
          : 'No active devices remaining';
          
        setDeleteMessage({
          type: 'success',
          text: `${response.message || `Successfully deleted device: ${deviceId}`}. ${activeDevicesMessage}`
        });
      } else {
        setDeleteMessage({
          type: 'error',
          text: response.message || `Failed to delete device: ${deviceId}`
        });
      }
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setDeleteMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Error during device deletion:', error);
      setDeleteMessage({
        type: 'error',
        text: `Error deleting device: ${error.message || 'Unknown error'}`
      });
    } finally {
      setIsDeleting(false);
      setDeviceToDelete(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>IoT Admin Console</h2>
        <p>Add and manage device data</p>
        <p className="last-updated">Last Data Update: {formatDateTime(lastUpdated)}</p>
        
        {!apiAvailable && (
          <div className="api-status-warning">
            <p>⚠️ Backend API unavailable. Using sample data for demonstration.</p>
            <p>Your submissions will be stored locally for the demo.</p>
          </div>
        )}
        
        {deleteMessage && (
          <div className={`message ${deleteMessage.type}`}>
            {deleteMessage.text}
          </div>
        )}
      </div>

      <div className="admin-content">
        <div className="form-section">
          <AdminForm />
          
          {uniqueDeviceIds.length > 0 && (
            <div className="delete-section">
              <h3>Delete Device</h3>
              <p>Select a device to delete all its data:</p>
              
              <div className="device-delete-list">
                {uniqueDeviceIds.map(deviceId => (
                  <div key={deviceId} className="device-delete-item">
                    <span>{deviceId}</span>
                    <button 
                      className="delete-btn"
                      onClick={() => confirmDelete(deviceId)}
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="data-section">
          <h3>Current Device Data</h3>
          
          {loading ? (
            <p>Loading data...</p>
          ) : error && sortedData.length === 0 ? (
            <p className="error">Error: {error}</p>
          ) : sortedData.length === 0 ? (
            <p>No data available. Add your first device data.</p>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Temperature (°C)</th>
                    <th>Humidity (%)</th>
                    <th>Timestamp</th>
                    {!apiAvailable && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((device) => (
                    <tr key={device._id}>
                      <td>{device.deviceId}</td>
                      <td>{device.temperature}</td>
                      <td>{device.humidity}</td>
                      <td>{new Date(device.timestamp).toLocaleString()}</td>
                      {!apiAvailable && (
                        <td>
                          {device._id.toString().includes('mock') ? (
                            <span className="local-data">Local Only</span>
                          ) : (
                            <span className="synced-data">Synced</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deviceToDelete && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete <strong>{deviceToDelete}</strong> and all its data?</p>
            <p className="warning">This action cannot be undone!</p>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={() => handleDeleteDevice(deviceToDelete)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 