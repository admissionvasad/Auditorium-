'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface Template {
  id: string;
  name: string;
  channel: 'WHATSAPP' | 'SMS';
  body: string;
  variables: string[];
  approvalStatus: string;
}

const initialForm = {
  name: '',
  channel: 'WHATSAPP',
  body: 'Dear {{name}}, your admission is confirmed.',
  variables: 'name',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/templates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load templates');
        const result = await response.json();
        setTemplates(result.data || []);
      })
      .catch(() => {
        setTemplates([
          {
            id: 'tpl_1',
            name: 'Admission Confirmation',
            channel: 'WHATSAPP',
            body: 'Dear {{name}}, your admission is confirmed.',
            variables: ['name'],
            approvalStatus: 'APPROVED',
          },
        ]);
      });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = getAuthToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const payload = {
        name: form.name,
        channel: form.channel,
        body: form.body,
        variables: form.variables.split(',').map((item) => item.trim()).filter(Boolean),
      };

      const response = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Unable to create template');
      }

      setForm(initialForm);
      setTemplates((prev) => [result.data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create template');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Templates" subtitle="Message template library">
      <section style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <h2 style={{ marginTop: 0 }}>Create template</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Template name" style={fieldStyle} />
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as 'WHATSAPP' | 'SMS' })} style={fieldStyle}>
                <option value="WHATSAPP">WHATSAPP</option>
                <option value="SMS">SMS</option>
              </select>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Template body" rows={5} style={{ ...fieldStyle, resize: 'vertical' }} />
              <input value={form.variables} onChange={(e) => setForm({ ...form, variables: e.target.value })} placeholder="Variables: name, date, time" style={fieldStyle} />

              {error ? <div style={errorStyle}>{error}</div> : null}

              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? 'Saving...' : 'Save template'}
              </button>
            </div>
          </form>

          <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <h2 style={{ marginTop: 0 }}>Template library</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 0' }}>Name</th>
                  <th style={{ padding: '8px 0' }}>Channel</th>
                  <th style={{ padding: '8px 0' }}>Variables</th>
                  <th style={{ padding: '8px 0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 0' }}>{template.name}</td>
                    <td style={{ padding: '10px 0' }}>{template.channel}</td>
                    <td style={{ padding: '10px 0' }}>{template.variables.join(', ') || '—'}</td>
                    <td style={{ padding: '10px 0' }}>{template.approvalStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
    </AppShell>
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

const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  color: '#b91c1c',
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
};
