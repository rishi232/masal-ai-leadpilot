import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LeadDetails from './pages/LeadDetails';

export default function App() {
  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="nav-inner">
          <Link to="/" className="nav-brand">
            <div className="brand-badge">LP</div>
            <div>
              <div className="brand-title">LeadPilot AI</div>
              <div className="brand-sub">Real Estate Sales Intelligence</div>
            </div>
          </Link>
          <nav className="nav-links">
            <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
        </Routes>
      </main>
    </div>
  );
}
