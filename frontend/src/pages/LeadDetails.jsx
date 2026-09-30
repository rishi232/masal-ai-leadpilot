import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getLead, analyzeLead, deleteLead } from '../services/api';
import AnalysisPanel from '../components/AnalysisPanel';
import FollowUpPlanner from '../components/FollowUpPlanner';
import Copilot from '../components/Copilot';

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getLead(id);
      setLead(data);
    } catch (err) {
      console.error('Error fetching lead:', err);
      setError(err.message || 'Failed to load lead details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError('');
      setActionNotice('Running Gemini AI analysis & generating follow-up strategy...');
      const updatedLead = await analyzeLead(id);
      setLead(updatedLead);
      setActionNotice('AI Analysis updated successfully!');
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err.message || 'AI analysis failed. Please verify your GEMINI_API_KEY.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete lead #${id} (${lead?.name})?`)) {
      return;
    }
    try {
      await deleteLead(id);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to delete lead.');
    }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading lead #{id}...</p>
      </div>
    );
  }

  if (!lead && !loading) {
    return (
      <div className="empty-state">
        <h2>Lead Not Found</h2>
        <p className="empty-desc">The requested lead #{id} could not be located in the database.</p>
        <Link to="/" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Parse JSON analysis and follow_up_plan
  let parsedAnalysis = null;
  if (lead.analysis) {
    try {
      parsedAnalysis = typeof lead.analysis === 'string' ? JSON.parse(lead.analysis) : lead.analysis;
    } catch (e) {
      console.warn('Could not parse analysis JSON:', e);
    }
  }

  let parsedFollowUpPlan = null;
  if (lead.follow_up_plan) {
    try {
      parsedFollowUpPlan = typeof lead.follow_up_plan === 'string' ? JSON.parse(lead.follow_up_plan) : lead.follow_up_plan;
    } catch (e) {
      console.warn('Could not parse follow_up_plan JSON:', e);
    }
  } else if (parsedAnalysis && parsedAnalysis.follow_up_plan) {
    parsedFollowUpPlan = parsedAnalysis.follow_up_plan;
  }

  const priority = lead.priority ? lead.priority.toUpperCase() : null;
  const score = lead.score;

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'HOT': return 'badge-hot';
      case 'WARM': return 'badge-warm';
      case 'COLD': return 'badge-cold';
      default: return 'badge-none';
    }
  };

  return (
    <div>
      {/* Navigation header */}
      <div className="lead-details-header">
        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>
      </div>

      {actionNotice && <div className="alert alert-info">{actionNotice}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Raw Lead Overview Card */}
      <div className="lead-overview-card">
        <div className="lead-overview-top">
          <div className="lead-headline-group">
            <h1 className="lead-headline">{lead.name}</h1>
            {priority && (
              <span className={`badge ${getPriorityBadgeClass(priority)}`}>
                {priority} PRIORITY
              </span>
            )}
            {score !== null && score !== undefined && (
              <span className="score-badge" style={{ fontSize: '0.95rem', padding: '0.35rem 0.85rem' }}>
                Score: <strong>{score} / 100</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {parsedAnalysis ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRunAnalysis}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <span className="spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--text-main)' }}></span>
                    <span>Re-analyzing...</span>
                  </>
                ) : (
                  '⚡ Re-run Analysis'
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunAnalysis}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <span className="spinner-sm"></span>
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  '🧠 Run AI Analysis'
                )}
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={handleDelete}
              title="Delete this lead"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Raw Fields */}
        <div className="lead-raw-grid">
          <div className="lead-raw-item">
            <span className="lead-raw-label">Target Location</span>
            <span className="lead-raw-value">{lead.location}</span>
          </div>
          <div className="lead-raw-item">
            <span className="lead-raw-label">Property Requirement</span>
            <span className="lead-raw-value">{lead.property_requirement}</span>
          </div>
          <div className="lead-raw-item">
            <span className="lead-raw-label">Stated Budget</span>
            <span className="lead-raw-value">{lead.budget}</span>
          </div>
          <div className="lead-raw-item">
            <span className="lead-raw-label">Buying Timeline</span>
            <span className="lead-raw-value">{lead.buying_timeline}</span>
          </div>
          <div className="lead-raw-item">
            <span className="lead-raw-label">Lead Created</span>
            <span className="lead-raw-value" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
              {new Date(lead.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Customer Message */}
        <div className="lead-message-box">
          <div className="lead-message-box-label">Inbound Customer Message</div>
          <div className="lead-message-box-text">{lead.customer_message}</div>
        </div>
      </div>

      {/* AI Intelligence Section */}
      {!parsedAnalysis && !analyzing && (
        <div className="empty-state" style={{ marginBottom: '2rem' }}>
          <div className="empty-icon">🤖</div>
          <h2 className="empty-title">Ready for AI Qualification</h2>
          <p className="empty-desc">
            Click "Run AI Analysis" to calculate lead priority, extract objections, draft a custom response, and generate a strategic follow-up plan.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleRunAnalysis}
          >
            🧠 Run AI Analysis Now
          </button>
        </div>
      )}

      {/* When analysis exists, render AnalysisPanel, FollowUpPlanner, Copilot */}
      {parsedAnalysis && (
        <div className="detail-panels-grid">
          <div>
            <AnalysisPanel analysis={parsedAnalysis} />
            <FollowUpPlanner plan={parsedFollowUpPlan} />
          </div>

          <div>
            <Copilot leadId={lead.id} leadName={lead.name} />
          </div>
        </div>
      )}
    </div>
  );
}
