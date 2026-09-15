'use client';

import { useEffect, useState } from 'react';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface DashboardData {
  totalContacts: number;
  whatsappEnabled: number;
  smsEnabled: number;
  messagesToday: number;
  whatsappToday: number;
  smsToday: number;
  scheduled: number;
  deliveryRate: number;
  recentCampaigns: Array<{ id: string; name: string; channel: string; status: string; totalRecipients: number; deliveredCount: number }>;
}

const emptyStats: DashboardData = {
  totalContacts: 0,
  whatsappEnabled: 0,
  smsEnabled: 0,
  messagesToday: 0,
  whatsappToday: 0,
  smsToday: 0,
  scheduled: 0,
  deliveryRate: 0,
  recentCampaigns: [],
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message || 'Failed to load dashboard');
        setData(result.data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Contacts', value: data.totalContacts },
    { label: 'WhatsApp Enabled', value: data.whatsappEnabled },
    { label: 'SMS Enabled', value: data.smsEnabled },
    { label: 'Messages Today', value: data.messagesToday },
    { label: 'Scheduled', value: data.scheduled },
  ];

  return (
    <AppShell title="Central Notification Dashboard" subtitle="Overview">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
        {stats.map((item) => (
          <div key={item.label} style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{item.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 10 }}>{loading ? '—' : item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr', gap: 20 }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ margin: '0 0 12px' }}>Recent campaigns</h2>
          {error ? <div style={{ color: '#b91c1c', fontSize: 14 }}>{error}</div> : null}
          {data.recentCampaigns.length === 0 && !loading ? (
            <p style={{ color: '#64748b', fontSize: 14 }}>No campaigns yet. <a href="/campaigns">Create your first campaign</a>.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 0' }}>Campaign</th>
                  <th style={{ padding: '12px 0' }}>Channel</th>
                  <th style={{ padding: '12px 0' }}>Status</th>
                  <th style={{ padding: '12px 0' }}>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCampaigns.map((campaign) => {
                  const rate = campaign.totalRecipients > 0
                    ? ((campaign.deliveredCount / campaign.totalRecipients) * 100).toFixed(0)
                    : '0';
                  return (
                    <tr key={campaign.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 0' }}>{campaign.name}</td>
                      <td style={{ padding: '12px 0' }}>{campaign.channel}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span
                          style={{
                            background: statusColor(campaign.status).bg,
                            color: statusColor(campaign.status).fg,
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >{campaign.status}</span>
                      </td>
                      <td style={{ padding: '12px 0' }}>{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ margin: '0 0 16px' }}>Delivery overview</h2>
          <div style={{ marginBottom: 18 }}>
            <div style={{ color: '#64748b', marginBottom: 8 }}>Today&apos;s messages: {loading ? '—' : data.messagesToday}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
              <span>WhatsApp</span><span>{loading ? '—' : data.whatsappToday}</span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: data.messagesToday > 0 ? `${(data.whatsappToday / data.messagesToday) * 100}%` : '0%',
                  background: '#22c55e',
                  height: '100%',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
              <span>SMS</span><span>{loading ? '—' : data.smsToday}</span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: data.messagesToday > 0 ? `${(data.smsToday / data.messagesToday) * 100}%` : '0%',
                  background: '#3b82f6',
                  height: '100%',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 6 }}>
              <span>Overall delivery rate</span><span>{loading ? '—' : `${data.deliveryRate}%`}</span>
            </div>
            <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${data.deliveryRate}%`,
                  background: '#f59e0b',
                  height: '100%',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
        <h2 style={{ marginTop: 0 }}>Quick actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/messages" style={quickLinkStyle}>Send a message</a>
          <a href="/campaigns" style={quickLinkStyle}>New campaign</a>
          <a href="/contacts" style={quickLinkStyle}>Add contact</a>
          <a href="/templates" style={quickLinkStyle}>Create template</a>
        </div>
      </div>
    </AppShell>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
    case 'DELIVERED':
    case 'READ':
      return { bg: '#dcfce7', fg: '#15803d' };
    case 'RUNNING':
    case 'SENT':
      return { bg: '#dbeafe', fg: '#1d4ed8' };
    case 'FAILED':
    case 'CANCELLED':
      return { bg: '#fee2e2', fg: '#b91c1c' };
    case 'SCHEDULED':
      return { bg: '#fef3c7', fg: '#b45309' };
    default:
      return { bg: '#f1f5f9', fg: '#475569' };
  }
}

const quickLinkStyle: React.CSSProperties = {
  background: '#2563eb',
  color: 'white',
  borderRadius: 10,
  padding: '12px 18px',
  fontWeight: 700,
  textDecoration: 'none',
};