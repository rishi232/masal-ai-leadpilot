/**
 * LeadPilot AI - API Client Service
 * Connects to FastAPI backend endpoints.
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(res) {
  if (!res.ok) {
    let errorMessage = `HTTP error ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Pydantic validation error format
          errorMessage = data.detail.map((err) => `${err.loc?.join('.') || 'field'}: ${err.msg}`).join(', ');
        } else {
          errorMessage = JSON.stringify(data.detail);
        }
      }
    } catch {
      // Not JSON
      const text = await res.text().catch(() => '');
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function getLeads() {
  const res = await fetch(`${API_BASE}/leads`);
  return handleResponse(res);
}

export async function getLead(id) {
  const res = await fetch(`${API_BASE}/leads/${id}`);
  return handleResponse(res);
}

export async function createLead(payload) {
  const res = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function analyzeLead(id) {
  const res = await fetch(`${API_BASE}/leads/${id}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res);
}

export async function chatWithLead(id, question) {
  const res = await fetch(`${API_BASE}/leads/${id}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  return handleResponse(res);
}

export async function deleteLead(id) {
  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}
