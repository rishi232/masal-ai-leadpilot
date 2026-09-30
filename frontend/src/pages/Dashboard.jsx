import React, { useEffect, useState } from 'react';
import { getLeads } from '../services/api';
import LeadCard from '../components/LeadCard';
import LeadForm from '../components/LeadForm';

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError(err.message || 'Failed to connect to the backend server. Make sure the FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Compute stats
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.priority?.toUpperCase() === 'HOT').length;
  const warmLeads = leads.filter((l) => l.priority?.toUpperCase() === 'WARM').length;
  const coldLeads = leads.filter((l) => l.priority?.toUpperCase() === 'COLD').length;

  return (
    <div>
      {/* Stat Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Leads</div>
          <div className="stat-value">{totalLeads}</div>
        </div>
        <div className="stat-card hot">
          <div className="stat-label">🔥 HOT Leads (Score &ge; 75)</div>
          <div className="stat-value">{hotLeads}</div>
        </div>
        <div className="stat-card warm">
          <div className="stat-label">⚡ WARM Leads (Score 45-74)</div>
          <div className="stat-value">{warmLeads}</div>
        </div>
        <div className="stat-card cold">
          <div className="stat-label">❄️ COLD Leads (Score &lt; 45)</div>
          <div className="stat-value">{coldLeads}</div>
        </div>
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Inbound Lead Pipeline</h1>
          <p className="section-subtitle">
            AI-prioritized real estate prospects ranked by buying urgency and purchase intent.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchLeads}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowFormModal(true)}
          >
            + Add Inbound Lead
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger">
          <div>
            <strong>Backend Connection Issue:</strong> {error}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Loading lead pipeline...
          </p>
        </div>
      ) : leads.length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-icon">🏡</div>
          <h2 className="empty-title">No leads in pipeline yet</h2>
          <p className="empty-desc">
            Add your first inbound buyer inquiry to see AI qualification, timeline scoring, and actionable follow-up plans.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowFormModal(true)}
          >
            + Add First Lead
          </button>
        </div>
      ) : (
        /* Leads Grid */
        <div className="leads-grid">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {/* Add Lead Modal */}
      {showFormModal && (
        <LeadForm
          onClose={() => setShowFormModal(false)}
          onLeadCreated={() => {
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}
