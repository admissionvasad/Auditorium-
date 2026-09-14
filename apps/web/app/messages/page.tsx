'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken } from '../../lib/api';

export default function MessagesPage() {
  const router = useRouter();
  const [channel, setChannel] = useState('BOTH');
  const [to, setTo] = useState('+919876543210');
  const [template, setTemplate] = useState('Dear {{name}}, your examination is scheduled on {{date}} at {{time}}.');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const token = getAuthToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(`${API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel,
          to,
          template,
          variables: { name: 'Rahul Patel', date: '15-09-2026', time: '10:30 AM' },
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Unable to send message');
      }

      setStatus(`Message queued successfully. Provider ID: ${result.data.providerMessageId}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#eef4ff', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', background: 'white', borderRadius: 18, padding: 24, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#5b6b8a', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>SVIT Notify</div>
            <h1 style={{ margin: '8px 0 0', fontSize: 30 }}>Send Message</h1>
          </div>
          <a href="/dashboard" style={{ color: '#0f172a', textDecoration: 'none', fontWeight: 700 }}>Back to Dashboard</a>
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#475569', fontWeight: 600 }}>Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} style={fieldStyle}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="BOTH">BOTH</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, color: '#475569', fontWeight: 600 }}>Recipient</label>
              <input value={to} onChange={(e) => setTo(e.target.value)} style={fieldStyle} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#475569', fontWeight: 600 }}>Template</label>
            <textarea value={template} onChange={(e) => setTemplate(e.target.value)} rows={5} style={{ ...fieldStyle, resize: 'vertical' }} />
          </div>

          {status ? (
            <div style={{ background: status.includes('successfully') ? '#ecfdf5' : '#fef2f2', color: status.includes('successfully') ? '#065f46' : '#b91c1c', borderRadius: 10, padding: '12px 14px' }}>
              {status}
            </div>
          ) : null}

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Sending...' : 'Send now'}
          </button>
        </form>
      </div>
    </main>
  );
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  background: '#2563eb',
  color: 'white',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};
