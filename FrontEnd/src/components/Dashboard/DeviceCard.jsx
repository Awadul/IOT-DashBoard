import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useDeviceData } from '../../context/DeviceDataContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DeviceCard = ({ device }) => {
  const { getDeviceHistory } = useDeviceData();
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  // Format timestamp for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  useEffect(() => {
    if (device) {
      // Get device history data
      const history = getDeviceHistory(device.deviceId);
      
      // Combine current reading with history
      const allData = [
        {
          temperature: device.temperature,
          humidity: device.humidity,
          timestamp: device.timestamp,
        },
        ...history,
      ];
      
      // Ensure unique timestamps (no duplicates)
      const uniqueData = [];
      const timestamps = new Set();
      
      allData.forEach(item => {
        if (!timestamps.has(item.timestamp)) {
          timestamps.add(item.timestamp);
          uniqueData.push(item);
        }
      });
      
      // Sort by timestamp (newest first)
      const sortedData = uniqueData.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      // Take the most recent 10 readings (or fewer if not available)
      const recentData = sortedData.slice(0, 10).reverse();
      
      // Create chart data
      setChartData({
        labels: recentData.map(d => formatTime(d.timestamp)),
        datasets: [
          {
            label: 'Temperature (°C)',
            data: recentData.map(d => d.temperature),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Humidity (%)',
            data: recentData.map(d => d.humidity),
            borderColor: 'rgb(53, 162, 235)',
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      });
    }
  }, [device, getDeviceHistory]);

  if (!device) {
    return <div>Loading device data...</div>;
  }

  return (
    <div className="device-card">
      <div className="card-header">
        <h3>Device: {device.deviceId}</h3>
        <span className="timestamp">Last Update: {formatTime(device.timestamp)}</span>
      </div>
      <div className="readings">
        <div className="reading temperature">
          <h4>Temperature</h4>
          <p className="value">{device.temperature}°C</p>
        </div>
        <div className="reading humidity">
          <h4>Humidity</h4>
          <p className="value">{device.humidity}%</p>
        </div>
      </div>
      <div className="chart-container">
        <Line
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'Device Readings Over Time',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default DeviceCard; 