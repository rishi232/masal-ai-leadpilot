import React, { useState } from 'react';

export default function AnalysisPanel({ analysis }) {
  const [copied, setCopied] = useState(false);

  if (!analysis) {
    return (
      <div className="panel-card">
        <h3 className="panel-title">AI Lead Analysis</h3>
        <p className="analysis-text" style={{ color: 'var(--text-muted)' }}>
          No AI analysis available for this lead yet.
        </p>
      </div>
    );
  }

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <span>🧠</span> AI Sales Assessment
        </h3>
        {analysis.intent && (
          <span className="badge badge-none" style={{ textTransform: 'none', fontSize: '0.8rem' }}>
            Intent: <strong>{analysis.intent}</strong>
          </span>
        )}
      </div>

      {analysis.summary && (
        <div className="analysis-section">
          <div className="analysis-label">Executive Summary</div>
          <p className="analysis-text">{analysis.summary}</p>
        </div>
      )}

      {analysis.recommended_action && (
        <div className="analysis-section">
          <div className="analysis-label">Recommended Next Action</div>
          <div className="analysis-action-box">
            🎯 {analysis.recommended_action}
          </div>
        </div>
      )}

      {analysis.key_requirements && analysis.key_requirements.length > 0 && (
        <div className="analysis-section">
          <div className="analysis-label">Key Requirements</div>
          <ul className="analysis-pills-list">
            {analysis.key_requirements.map((req, idx) => (
              <li key={idx} className="analysis-pill-item">
                <span>✓</span>
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.objections && analysis.objections.length > 0 && (
        <div className="analysis-section">
          <div className="analysis-label">Potential Objections & Deal Risks</div>
          <ul className="analysis-pills-list">
            {analysis.objections.map((obj, idx) => (
              <li key={idx} className="analysis-pill-item objection">
                <span>⚠️</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.suggested_response && (
        <div className="analysis-section" style={{ marginBottom: 0 }}>
          <div className="analysis-label">Suggested Response to Customer</div>
          <div className="copyable-block">
            <div className="copyable-header">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Ready to send message:
              </span>
              <button
                type="button"
                className={`btn-copy ${copied ? 'copied' : ''}`}
                onClick={() => handleCopy(analysis.suggested_response)}
              >
                {copied ? '✓ Copied' : '📋 Copy Message'}
              </button>
            </div>
            <div className="copyable-content">{analysis.suggested_response}</div>
          </div>
        </div>
      )}
    </div>
  );
}
