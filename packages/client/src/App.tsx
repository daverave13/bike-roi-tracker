import { useState, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { RideList } from './components/RideList';
import { LogRideForm } from './components/LogRideForm';
import { Settings } from './components/Settings';
import { useStats } from './hooks/useApi';

type Tab = 'dashboard' | 'log' | 'history' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { refresh: refreshStats } = useStats();

  const handleRideLogged = useCallback(() => {
    refreshStats();
  }, [refreshStats]);

  return (
    <div className="app">
      <header>
        <h1>Bike ROI Tracker</h1>
        <p>Track how much you save by biking to work</p>
        <nav>
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'log' ? 'active' : ''}
            onClick={() => setActiveTab('log')}
          >
            Log Ride
          </button>
          <button
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'log' && <LogRideForm onSuccess={handleRideLogged} />}
        {activeTab === 'history' && <RideList onRefreshStats={refreshStats} />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
