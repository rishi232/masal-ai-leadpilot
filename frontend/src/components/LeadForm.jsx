import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLead, analyzeLead } from '../services/api';

const TIMELINE_OPTIONS = [
  'Immediately',
  'Within 30 days',
  '1-3 months',
  '3-6 months',
  '6+ months',
  'Just exploring',
];

export default function LeadForm({ onClose, onLeadCreated }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    property_requirement: '',
    budget: '',
    buying_timeline: 'Immediately',
    customer_message: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFillSample = () => {
    setFormData({
      name: 'Rahul Sharma',
      location: 'Noida Sector 62',
      property_requirement: '3 BHK Apartment near Metro',
      budget: '₹80 Lakhs',
      buying_timeline: 'Within 30 days',
      customer_message: 'Hi, looking for a ready-to-move 3BHK flat near Noida Sector 62 metro station for my family. Prefer gated community with parking.',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic client validation
    if (!formData.name.trim() || !formData.location.trim() || !formData.property_requirement.trim() || !formData.budget.trim() || !formData.customer_message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep('Saving new inbound lead...');

      // 1. POST /leads
      const newLead = await createLead(formData);

      // 2. Immediately POST /leads/{id}/analyze
      setLoadingStep('Running AI analysis & prioritization (Gemini)...');
      try {
        await analyzeLead(newLead.id);
      } catch (analysisErr) {
        console.warn('Analysis error during lead creation:', analysisErr);
        // Even if analysis failed, lead was created. We can still navigate.
      }

      if (onLeadCreated) onLeadCreated(newLead);
      if (onClose) onClose();

      // 3. Navigate to /leads/{id}
      navigate(`/leads/${newLead.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create lead. Please check server connection.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title" style={{ fontSize: '1.25rem' }}>Add Inbound Lead</h2>
            <p className="section-subtitle">Enter customer details to run AI scoring and generate a follow-up plan.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
            onClick={handleFillSample}
          >
            ⚡ Fill Example Lead (Rahul Sharma)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Customer Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="location">Preferred Location *</label>
              <input
                id="location"
                name="location"
                type="text"
                className="form-input"
                placeholder="e.g. Noida Sector 62"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="property_requirement">Property Requirement *</label>
              <input
                id="property_requirement"
                name="property_requirement"
                type="text"
                className="form-input"
                placeholder="e.g. 3 BHK Apartment near Metro"
                value={formData.property_requirement}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="budget">Budget *</label>
              <input
                id="budget"
                name="budget"
                type="text"
                className="form-input"
                placeholder="e.g. ₹80 Lakhs"
                value={formData.budget}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="buying_timeline">Buying Timeline *</label>
            <select
              id="buying_timeline"
              name="buying_timeline"
              className="form-select"
              value={formData.buying_timeline}
              onChange={handleChange}
              disabled={loading}
              required
            >
              {TIMELINE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="customer_message">Customer Inbound Message *</label>
            <textarea
              id="customer_message"
              name="customer_message"
              className="form-textarea"
              placeholder="Paste customer's exact inquiry, email, or chat message..."
              value={formData.customer_message}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>{loadingStep || 'Processing...'}</span>
                </>
              ) : (
                'Save & Analyze Lead →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
