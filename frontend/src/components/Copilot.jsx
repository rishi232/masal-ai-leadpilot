import React, { useState, useRef, useEffect } from 'react';
import { chatWithLead } from '../services/api';

const CANNED_QUESTIONS = [
  'What should I emphasize on the call?',
  'Make my reply more assertive.',
  'What is the biggest objection?',
  'Give me 3 qualification questions.',
  'What information is missing from this lead?',
];

export default function Copilot({ leadId, leadName }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your AI sales copilot. I've ingested ${leadName || 'this lead'}'s details and requirements. Ask me for call tactics, objection handling, or tailored messaging.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || inputValue).trim();
    if (!q || loading) return;

    setError('');
    setInputValue('');

    const newMessages = [...messages, { role: 'user', text: q }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await chatWithLead(leadId, q);
      setMessages([...newMessages, { role: 'assistant', text: response.answer }]);
    } catch (err) {
      setError(err.message || 'Failed to get copilot answer.');
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: `⚠️ Error: ${err.message || 'Could not communicate with the AI Copilot. Please check your backend connection.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <h3 className="panel-title">
          <span>🤖</span> Lead-Specific Sales Copilot
        </h3>
        <span className="badge badge-none" style={{ fontSize: '0.75rem' }}>
          Grounded to Lead #{leadId}
        </span>
      </div>

      <div className="copilot-container" style={{ height: '480px' }}>
        <div className="copilot-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              {msg.text}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="spinner-sm" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--accent)' }}></div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Analyzing lead context & formulating response...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="alert alert-danger" style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {error}
          </div>
        )}

        <div className="chips-container">
          {CANNED_QUESTIONS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => handleSend(chip)}
              disabled={loading}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            className="form-input"
            placeholder="Ask a question about this lead..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSend()}
            disabled={loading || !inputValue.trim()}
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
