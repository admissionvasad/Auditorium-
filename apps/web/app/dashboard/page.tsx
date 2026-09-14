'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, clearAuthToken, getAuthToken } from '../../lib/api';

const stats = [
  { label: 'Total Contacts', value: '12,540' },
  { label: 'WhatsApp Enabled', value: '11,920' },
  { label: 'SMS Enabled', value: '12,100' },
  { label: 'Messages Today', value: '4,850' },
  { label: 'Scheduled', value: '324' },
];

const recentRows = [
  ['Admission Notice', 'WhatsApp', 'Delivered', '96%'],
  ['Exam Reminder', 'SMS', 'Pending', '82%'],
  ['Fee Alert', 'Both', 'Failed', '21%'],
  ['Scholarship Circle', 'WhatsApp', 'Sent', '100%'],
];

const moduleCards = ['Dashboard', 'Contacts', 'Groups', 'Templates', 'Send Message', 'Campaigns', 'Reports', 'Provider Settings'];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName?: string; role?: string } | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    async function loadUser() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error('Unauthorized');
        }

        setUser(result.data);
      } catch {
        clearAuthToken();
        router.replace('/login');
      }
    }

    loadUser();
  }, [router]);

  function logout() {
    clearAuthToken();
    router.push('/login');
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', background: '#eef4ff', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <aside style={{ background: '#0f172a', color: 'white', borderRadius: 18, padding: 22 }}>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 28 }}>SVIT Notify</div>
          <nav style={{ display: 'grid', gap: 10 }}>
            {moduleCards.map((item, index) => (
              <div
                key={item}
                style={{
                  background: index === 0 ? '#1e293b' : 'transparent',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <section style={{ display: 'grid', gap: 20 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 18, padding: '20px 24px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)' }}>
            <div>
              <p style={{ margin: 0, color: '#5b6b8a', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Overview</p>
              <h1 style={{ margin: '8px 0 0', fontSize: 34 }}>Central Notification Dashboard</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>{user?.fullName || 'Admin'}</div>
              <button onClick={logout} style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: 12, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>Logout</button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
            {stats.map((item) => (
              <div key={item.label} style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
                <div style={{ color: '#64748b', fontSize: 13 }}>{item.label}</div>
                <div style={{ fontSize: 30, fontWeight: 700, marginTop: 10 }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
              <h2 style={{ margin: '0 0 12px' }}>Recent campaigns</h2>
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
                  {recentRows.map(([campaign, channel, status, delivery]) => (
                    <tr key={campaign} style={{ borderTop: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 0' }}>{campaign}</td>
                      <td style={{ padding: '12px 0' }}>{channel}</td>
                      <td style={{ padding: '12px 0' }}>{status}</td>
                      <td style={{ padding: '12px 0' }}>{delivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
              <h2 style={{ margin: '0 0 16px' }}>Delivery overview</h2>
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: '#64748b', marginBottom: 8 }}>WhatsApp delivery</div>
                <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: '96%', background: '#22c55e', height: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: '#64748b', marginBottom: 8 }}>SMS delivery</div>
                <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: '94%', background: '#3b82f6', height: '100%' }} />
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', marginBottom: 8 }}>Failed retries</div>
                <div style={{ background: '#e2e8f0', borderRadius: 999, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: '18%', background: '#f59e0b', height: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
            <h2 style={{ marginTop: 0 }}>Message composer</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: 8 }}>Channel</label>
                <select defaultValue="BOTH" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                  <option>WhatsApp</option>
                  <option>SMS</option>
                  <option>BOTH</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: 8 }}>Audience</label>
                <select defaultValue="Group" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                  <option>Group</option>
                  <option>Individual</option>
                  <option>Imported</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748b', marginBottom: 8 }}>Template</label>
                <select defaultValue="Exam Notice" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                  <option>Exam Notice</option>
                  <option>Fee Reminder</option>
                  <option>Admission Update</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <strong>Preview:</strong> Dear {'{{name}}'}, your examination is scheduled on {'{{date}}'} at {'{{time}}'}.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
