import { useState } from 'react';
import { useDeviceData } from '../../context/DeviceDataContext';

const AdminForm = () => {
  const [formData, setFormData] = useState({
    deviceId: '',
    temperature: '',
    humidity: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addDeviceData, deviceData, apiAvailable } = useDeviceData();
  
  // List of existing device IDs to suggest
  const existingDeviceIds = [...new Set(deviceData.map(device => device.deviceId))];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { deviceId, temperature, humidity } = formData;
    if (!deviceId) {
      setMessage({ type: 'error', text: 'Device ID is required' });
      return false;
    }
    if (!temperature || isNaN(temperature)) {
      setMessage({ type: 'error', text: 'Temperature must be a valid number' });
      return false;
    }
    if (!humidity || isNaN(humidity)) {
      setMessage({ type: 'error', text: 'Humidity must be a valid number' });
      return false;
    }
    if (humidity < 0 || humidity > 100) {
      setMessage({ type: 'error', text: 'Humidity must be between 0 and 100' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const data = {
        ...formData,
        temperature: parseFloat(formData.temperature),
        humidity: parseFloat(formData.humidity),
      };
      
      await addDeviceData(data);
      
      setMessage({ 
        type: 'success', 
        text: apiAvailable 
          ? 'Data added successfully!' 
          : 'Data added to local demo (API unavailable)' 
      });
      
      // Clear form but keep the device ID if it's an existing device
      setFormData({
        deviceId: formData.deviceId,
        temperature: '',
        humidity: '',
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to add data' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate a random device ID
  const generateRandomDeviceId = () => {
    return `device${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  };
  
  // Generate random values
  const generateRandomValues = () => {
    setFormData(prev => ({
      ...prev,
      temperature: (15 + Math.random() * 20).toFixed(1),
      humidity: (30 + Math.random() * 50).toFixed(1),
    }));
  };

  return (
    <div className="admin-form">
      <h2>Add Device Data</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="deviceId">Device ID</label>
          <div className="input-with-buttons">
            <input
              type="text"
              id="deviceId"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleChange}
              placeholder="Enter device ID"
              disabled={isSubmitting}
              list="deviceIdList"
            />
            <button 
              type="button" 
              className="random-btn"
              onClick={() => setFormData(prev => ({...prev, deviceId: generateRandomDeviceId()}))}
            >
              Random
            </button>
          </div>
          
          {existingDeviceIds.length > 0 && (
            <datalist id="deviceIdList">
              {existingDeviceIds.map(id => (
                <option key={id} value={id} />
              ))}
            </datalist>
          )}
          
          {existingDeviceIds.length > 0 && (
            <div className="existing-devices">
              <small>Existing devices: </small>
              {existingDeviceIds.map(id => (
                <button
                  key={id}
                  type="button"
                  className="device-pill"
                  onClick={() => setFormData(prev => ({...prev, deviceId: id}))}
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="temperature">Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            id="temperature"
            name="temperature"
            value={formData.temperature}
            onChange={handleChange}
            placeholder="Enter temperature"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="humidity">Humidity (%)</label>
          <input
            type="number"
            step="0.1"
            id="humidity"
            name="humidity"
            value={formData.humidity}
            onChange={handleChange}
            placeholder="Enter humidity"
            disabled={isSubmitting}
            min="0"
            max="100"
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="random-values-btn"
            onClick={generateRandomValues}
            disabled={isSubmitting}
          >
            Generate Random Values
          </button>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminForm; 