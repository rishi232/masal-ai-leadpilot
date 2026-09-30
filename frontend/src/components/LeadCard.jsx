import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LeadCard({ lead }) {
  const navigate = useNavigate();

  let analysisData = null;
  if (lead.analysis) {
    try {
      analysisData = typeof lead.analysis === 'string' ? JSON.parse(lead.analysis) : lead.analysis;
    } catch {
      analysisData = null;
    }
  }

  const scoreText = lead.score !== null && lead.score !== undefined ? `${lead.score} / 100` : '-- / 100';
  const priority = lead.priority ? lead.priority.toUpperCase() : 'NEW';

  const getPriorityBadgeClass = (p) => {
    switch (p) {
      case 'HOT':
        return 'badge-hot';
      case 'WARM':
        return 'badge-warm';
      case 'COLD':
        return 'badge-cold';
      default:
        return 'badge-none';
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score === null || score === undefined) return '';
    if (score >= 75) return 'high';
    if (score >= 45) return 'med';
    return 'low';
  };

  const recommendedAction = analysisData?.recommended_action || null;

  return (
    <div
      className="lead-card"
      onClick={() => navigate(`/leads/${lead.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/leads/${lead.id}`);
      }}
    >
      <div>
        <div className="lead-card-header">
          <h3 className="lead-card-title">{lead.name}</h3>
          <div className="lead-card-badges">
            <span className={`badge ${getPriorityBadgeClass(priority)}`}>{priority}</span>
            <span className={`score-badge ${getScoreBadgeClass(lead.score)}`}>{scoreText}</span>
          </div>
        </div>

        <div className="lead-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Location</span>
            <span className="meta-value" title={lead.location}>{lead.location}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Budget</span>
            <span className="meta-value" title={lead.budget}>{lead.budget}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Requirement</span>
            <span className="meta-value" title={lead.property_requirement}>{lead.property_requirement}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Timeline</span>
            <span className="meta-value" title={lead.buying_timeline}>{lead.buying_timeline}</span>
          </div>
        </div>

        {recommendedAction && (
          <div className="lead-card-action-snippet">
            <div className="action-snippet-label">
              <span>🎯 Recommended Action</span>
            </div>
            <p className="action-snippet-text">{recommendedAction}</p>
          </div>
        )}
      </div>

      <div className="lead-card-footer">
        <span>Click to view analysis & copilot →</span>
      </div>
    </div>
  );
}
