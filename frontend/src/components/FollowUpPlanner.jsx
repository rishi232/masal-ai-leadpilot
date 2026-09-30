import React, { useState } from 'react';

export default function FollowUpPlanner({ plan }) {
  const [copied, setCopied] = useState(false);

  if (!plan) {
    return (
      <div className="panel-card">
        <h3 className="panel-title">📅 Follow-Up Planner</h3>
        <p className="analysis-text" style={{ color: 'var(--text-muted)' }}>
          No follow-up plan generated yet. Run analysis to create one.
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

  const getChannelIcon = (ch) => {
    switch (ch?.toLowerCase()) {
      case 'whatsapp':
        return '💬 WhatsApp';
      case 'call':
        return '📞 Phone Call';
      case 'email':
        return '✉️ Email';
      case 'sms':
        return '📱 SMS';
      default:
        return ch || 'Contact';
    }
  };

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3 className="panel-title">
          <span>📅</span> Strategic Follow-Up Planner
        </h3>
        <span className="badge badge-none" style={{ textTransform: 'none', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          Original Feature
        </span>
      </div>

      <div className="planner-meta-grid">
        <div className="planner-meta-item">
          <div className="analysis-label">Recommended Channel</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {getChannelIcon(plan.channel)}
          </div>
        </div>
        <div className="planner-meta-item">
          <div className="analysis-label">Target Timing</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', marginTop: '0.2rem' }}>
            ⏱️ {plan.timing}
          </div>
        </div>
      </div>

      {plan.reason && (
        <div className="analysis-section">
          <div className="analysis-label">Tactical Rationale</div>
          <p className="analysis-text" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            "{plan.reason}"
          </p>
        </div>
      )}

      {plan.suggested_message && (
        <div className="analysis-section">
          <div className="analysis-label">Tailored Outreach Draft</div>
          <div className="copyable-block">
            <div className="copyable-header">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {plan.channel} message draft:
              </span>
              <button
                type="button"
                className={`btn-copy ${copied ? 'copied' : ''}`}
                onClick={() => handleCopy(plan.suggested_message)}
              >
                {copied ? '✓ Copied' : '📋 Copy Outreach'}
              </button>
            </div>
            <div className="copyable-content">{plan.suggested_message}</div>
          </div>
        </div>
      )}

      {plan.qualification_questions && plan.qualification_questions.length > 0 && (
        <div className="analysis-section" style={{ marginBottom: 0 }}>
          <div className="analysis-label">Next Call: 3 Crucial Qualification Questions</div>
          <ol className="questions-list">
            {plan.qualification_questions.map((q, idx) => (
              <li key={idx}>
                <strong>{q}</strong>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
