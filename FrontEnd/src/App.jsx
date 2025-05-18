import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard/Dashboard'
import AdminDashboard from './components/Admin/AdminDashboard'
import { DeviceDataProvider } from './context/DeviceDataContext'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <DeviceDataProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>IoT Monitoring System</h1>
          <nav className="app-nav">
            <button
              className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Console
            </button>
          </nav>
        </header>
        
        <main className="app-content">
          {activeTab === 'dashboard' ? <Dashboard /> : <AdminDashboard />}
        </main>
        
        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} IoT Monitoring System | MERN Stack Project</p>
        </footer>
      </div>
    </DeviceDataProvider>
  )
}

export default App
