import { useState } from 'react';
import Receptionist from './pages/Receptionist';
import WaitingRoom from './pages/WaitingRoom';
import './App.css';

export default function App() {
  const [view, setView] = useState('waiting');

  return (
    <div className="app-wrapper">
      <nav className="nav">
        <span className="nav-brand">🏥 Queue Cure</span>
        <div className="nav-links">
          <button
            className={view === 'waiting' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('waiting')}
          >
            Waiting Room
          </button>
          <button
            className={view === 'receptionist' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('receptionist')}
          >
            Receptionist
          </button>
        </div>
      </nav>
      <main className="main-content">
        {view === 'receptionist' ? <Receptionist /> : <WaitingRoom />}
      </main>
    </div>
  );
}