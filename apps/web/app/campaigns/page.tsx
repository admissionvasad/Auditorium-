'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  templateId: string;
  groupId?: string;
  status: string;
  scheduledAt?: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
}

interface Template { id: string; name: string; channel: string }
interface Group { id: string; name: string }

const emptyForm = { name: '', channel: 'WHATSAPP' as Campaign['channel'], templateId: '', groupId: '', scheduledAt: '' };

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const sorted = useMemo(() => [...campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [campaigns]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    Promise.all([
      fetch(`${API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => { const d = await r.json(); if (r.ok) setCampaigns(d.data || []); }),
      fetch(`${API_URL}/templates`, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => { const d = await r.json(); if (r.ok) setTemplates(d.data || []); }),
      fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${token}` } }).then(async (r) => { const d = await r.json(); if (r.ok) setGroups(d.data || []); }),
    ]).finally(() => setLoadingList(false));
  }, []);

  async function refresh() {
    const token = getAuthToken();
    if (!token) return;
    const response = await fetch(`${API_URL}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok && result.success) setCampaigns(result.data || []);
  }

  async function createCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const token = getAuthToken();
      if (!token) return;
      const payload = { name: form.name, channel: form.channel, templateId: form.templateId, groupId: form.groupId || undefined, scheduledAt: form.scheduledAt || undefined };
      const response = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Failed to create campaign');
      setNotice('Campaign created.');
      setShowCreate(false);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  async function campaignAction(id: string, action: string) {
    const token = getAuthToken();
    if (!token) return;
    const response = await fetch(`${API_URL}/campaigns/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setError(result.error?.message || `Failed to ${action} campaign`);
      return;
    }
    setNotice(`Campaign ${action}ed.`);
    await refresh();
  }

  async function deleteCampaign(id: string) {
    if (!confirm('Delete this campaign?')) return;
    const token = getAuthToken();
    if (!token) return;
    const response = await fetch(`${API_URL}/campaigns/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setError(result.error?.message || 'Failed to delete campaign');
      return;
    }
    setNotice('Campaign deleted.');
    await refresh();
  }

  return (
    <AppShell title="Campaigns" subtitle="Bulk messaging">
      <section style={{ background: 'white', borderRadius: 18, padding: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
        <button type="button" onClick={() => setShowCreate(!showCreate)} style={primaryBtn}>{showCreate ? 'Close' : '+ New Campaign'}</button>
        <button type="button" onClick={refresh} style={secondaryBtn}>Refresh</button>
      </section>

      {notice ? <div style={noticeStyle}>{notice}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}

      {showCreate && (
        <form onSubmit={createCampaign} style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)', display: 'grid', gap: 14, maxWidth: 700 }}>
          <h2 style={{ marginTop: 0 }}>Create campaign</h2>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Campaign name" style={fieldStyle} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Channel</label>
              <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Campaign['channel'] })} style={fieldStyle}>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Template</label>
              <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} style={fieldStyle} required>
                <option value="">Select template...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Audience group (optional — leave blank for all contacts)</label>
              <select value={form.groupId} onChange={(e) => setForm({ ...form, groupId: e.target.value })} style={fieldStyle}>
                <option value="">All contacts</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Schedule (optional — leave blank for now)</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} style={fieldStyle} />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...primaryBtn, width: 'fit-content' }}>{loading ? 'Creating...' : 'Create Campaign'}</button>
        </form>
      )}

      <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
        <h2 style={{ marginTop: 0 }}>All campaigns ({sorted.length})</h2>
        {loadingList ? <p style={{ color: '#64748b' }}>Loading...</p> : sorted.length === 0 ? (
          <p style={{ color: '#64748b' }}>No campaigns yet. Create your first campaign above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '8px 0' }}>Name</th>
                <th style={{ padding: '8px 0' }}>Channel</th>
                <th style={{ padding: '8px 0' }}>Status</th>
                <th style={{ padding: '8px 0' }}>Recipients</th>
                <th style={{ padding: '8px 0' }}>Delivery</th>
                <th style={{ padding: '8px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((campaign) => {
                const deliveryRate = campaign.totalRecipients > 0
                  ? ((campaign.deliveredCount / campaign.totalRecipients) * 100).toFixed(0)
                  : '0';
                return (
                  <tr key={campaign.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 0', fontWeight: 600 }}>{campaign.name}</td>
                    <td style={{ padding: '12px 0' }}>{campaign.channel}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{ background: statusBg(campaign.status), color: statusFg(campaign.status), padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{campaign.status}</span>
                    </td>
                    <td style={{ padding: '12px 0' }}>{campaign.totalRecipients.toLocaleString()}</td>
                    <td style={{ padding: '12px 0' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <div style={{ background: '#e2e8f0', borderRadius: 999, height: 6, width: 80, overflow: 'hidden' }}>
                          <div style={{ width: `${deliveryRate}%`, background: '#22c55e', height: '100%' }} />
                        </div>
                        <span style={{ fontSize: 12 }}>{deliveryRate}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 0', whiteSpace: 'nowrap', display: 'flex', gap: 4 }}>
                      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                        <button type="button" onClick={() => campaignAction(campaign.id, 'start')} style={actionBtn}>Start</button>
                      )}
                      {campaign.status === 'RUNNING' && (
                        <>
                          <button type="button" onClick={() => campaignAction(campaign.id, 'pause')} style={actionBtn}>Pause</button>
                          <button type="button" onClick={() => campaignAction(campaign.id, 'cancel')} style={{ ...actionBtn, color: '#b91c1c' }}>Cancel</button>
                        </>
                      )}
                      {campaign.status === 'PAUSED' && (
                        <button type="button" onClick={() => campaignAction(campaign.id, 'resume')} style={actionBtn}>Resume</button>
                      )}
                      <button type="button" onClick={() => deleteCampaign(campaign.id)} style={{ ...actionBtn, color: '#b91c1c' }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

function statusBg(status: string) {
  switch (status) {
    case 'COMPLETED': return '#dcfce7';
    case 'RUNNING': return '#dbeafe';
    case 'SCHEDULED': return '#fef3c7';
    case 'PAUSED': return '#e5e7eb';
    case 'CANCELLED': return '#fee2e2';
    case 'FAILED': return '#fee2e2';
    default: return '#f1f5f9';
  }
}

function statusFg(status: string) {
  switch (status) {
    case 'COMPLETED': return '#15803d';
    case 'RUNNING': return '#1d4ed8';
    case 'SCHEDULED': return '#b45309';
    case 'PAUSED': return '#475569';
    case 'CANCELLED': return '#b91c1c';
    case 'FAILED': return '#b91c1c';
    default: return '#475569';
  }
}

const fieldStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 };
const labelStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontSize: 13, marginBottom: 6 };
const primaryBtn: React.CSSProperties = { border: 'none', background: '#2563eb', color: 'white', borderRadius: 10, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { border: '1px solid #cbd5e1', background: 'white', color: '#1e293b', borderRadius: 10, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' };
const actionBtn: React.CSSProperties = { border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: '4px 8px', fontSize: 13 };
const errorStyle: React.CSSProperties = { background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 10, fontSize: 14 };
const noticeStyle: React.CSSProperties = { background: '#ecfdf5', color: '#047857', padding: '10px 12px', borderRadius: 10, fontSize: 14 };