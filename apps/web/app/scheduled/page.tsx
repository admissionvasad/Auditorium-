'use client';

import { useEffect, useState } from 'react';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  scheduledAt?: string;
  totalRecipients: number;
}

export default function ScheduledPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) {
          const scheduled = (result.data || []).filter((c: Campaign) => c.status === 'SCHEDULED');
          setCampaigns(scheduled);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startCampaign(id: string) {
    const token = getAuthToken();
    if (!token) return;
    await fetch(`${API_URL}/campaigns/${id}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'RUNNING' } : c));
  }

  async function cancelCampaign(id: string) {
    if (!confirm('Cancel this scheduled campaign?')) return;
    const token = getAuthToken();
    if (!token) return;
    await fetch(`${API_URL}/campaigns/${id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  }

  function formatDate(iso?: string) {
    if (!iso) return 'Not scheduled';
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  return (
    <AppShell title="Scheduled Campaigns" subtitle="Upcoming scheduled sends">
      {loading ? <p style={{ color: '#64748b' }}>Loading...</p> : campaigns.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <p style={{ color: '#64748b', margin: 0 }}>No scheduled campaigns. <a href="/campaigns">Create a campaign</a> to schedule it.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ marginTop: 0 }}>Upcoming campaigns ({campaigns.length})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '8px 0' }}>Name</th>
                <th style={{ padding: '8px 0' }}>Channel</th>
                <th style={{ padding: '8px 0' }}>Scheduled</th>
                <th style={{ padding: '8px 0' }}>Recipients</th>
                <th style={{ padding: '8px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{campaign.name}</td>
                  <td style={{ padding: '12px 0' }}>{campaign.channel}</td>
                  <td style={{ padding: '12px 0' }}>{formatDate(campaign.scheduledAt)}</td>
                  <td style={{ padding: '12px 0' }}>{campaign.totalRecipients.toLocaleString()}</td>
                  <td style={{ padding: '12px 0' }}>
                    <button type="button" onClick={() => startCampaign(campaign.id)} style={actionBtn}>Start now</button>
                    <button type="button" onClick={() => cancelCampaign(campaign.id)} style={{ ...actionBtn, color: '#b91c1c' }}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}

const actionBtn: React.CSSProperties = { border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: '4px 8px' };