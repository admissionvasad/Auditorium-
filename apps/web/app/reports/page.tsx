'use client';

import { useEffect, useState } from 'react';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface Report {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  failureRate: number;
  byChannel: Record<string, { total: number; delivered: number; failed: number }>;
  last7Days: Array<{ date: string; sent: number; delivered: number; failed: number }>;
}

const emptyReport: Report = { total: 0, sent: 0, delivered: 0, read: 0, failed: 0, deliveryRate: 0, failureRate: 0, byChannel: {}, last7Days: [] };

export default function ReportsPage() {
  const [report, setReport] = useState<Report>(emptyReport);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_URL}/reports`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error?.message);
        setReport(result.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const channels = Object.entries(report.byChannel);

  return (
    <AppShell title="Reports" subtitle="Delivery statistics">
      {loading ? <p style={{ color: '#64748b' }}>Loading reports...</p> : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 18 }}>
        {[
          { label: 'Total Messages', value: report.total, color: '#0f172a' },
          { label: 'Sent', value: report.sent, color: '#1d4ed8' },
          { label: 'Delivered', value: report.delivered, color: '#15803d' },
          { label: 'Read', value: report.read, color: '#7c3aed' },
          { label: 'Failed', value: report.failed, color: '#b91c1c' },
          { label: 'Delivery Rate', value: `${report.deliveryRate}%`, color: '#15803d' },
          { label: 'Failure Rate', value: `${report.failureRate}%`, color: '#b91c1c' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {channels.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ marginTop: 0 }}>By channel</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {channels.map(([channel, stats]) => {
              const rate = stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0';
              return (
                <div key={channel} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 18 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{channel}</div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total</span><span>{stats.total}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Delivered</span><span>{stats.delivered}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Failed</span><span style={{ color: '#b91c1c' }}>{stats.failed}</span></div>
                    <div style={{ background: '#e2e8f0', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, background: '#22c55e', height: '100%', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: '#64748b' }}>Delivery rate</span><span style={{ fontWeight: 700 }}>{rate}%</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {report.last7Days.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ marginTop: 0 }}>Last 7 days</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '8px 0' }}>Date</th>
                <th style={{ padding: '8px 0' }}>Sent</th>
                <th style={{ padding: '8px 0' }}>Delivered</th>
                <th style={{ padding: '8px 0' }}>Failed</th>
              </tr>
            </thead>
            <tbody>
              {report.last7Days.map((day) => (
                <tr key={day.date} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 0' }}>{day.date}</td>
                  <td style={{ padding: '10px 0' }}>{day.sent}</td>
                  <td style={{ padding: '10px 0' }}>{day.delivered}</td>
                  <td style={{ padding: '10px 0', color: '#b91c1c' }}>{day.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}