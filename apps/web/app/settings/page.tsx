'use client';

import { useEffect, useState } from 'react';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface ProviderSettings {
  id: string;
  providerType: 'WHATSAPP' | 'SMS';
  providerName: string;
  whatsappSender: string;
  smsSender: string;
  active: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProviderSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_URL}/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) setSettings(result.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateSetting(setting: ProviderSettings) {
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/settings/${setting.providerType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(setting),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Failed to update settings');
      setNotice(`${setting.providerType} settings saved.`);
      setSettings((prev) => prev.map((s) => s.providerType === setting.providerType ? { ...s, ...result.data } : s));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    }
  }

  const whatsapp = settings.find((s) => s.providerType === 'WHATSAPP') ?? { id: '', providerType: 'WHATSAPP', providerName: 'mock', whatsappSender: '', smsSender: '', active: true };
  const sms = settings.find((s) => s.providerType === 'SMS') ?? { id: '', providerType: 'SMS', providerName: 'mock', whatsappSender: '', smsSender: '', active: true };

  return (
    <AppShell title="Provider Settings" subtitle="Configure messaging providers">
      {loading ? <p style={{ color: '#64748b' }}>Loading settings...</p> : null}
      {notice ? <div style={noticeStyle}>{notice}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ProviderCard
          settings={whatsapp}
          label="WhatsApp Provider"
          onUpdate={(data) => updateSetting({ ...whatsapp, ...data })}
          providerOptions={['mock', 'meta', 'twilio']}
        />
        <ProviderCard
          settings={sms}
          label="SMS Provider"
          onUpdate={(data) => updateSetting({ ...sms, ...data })}
          providerOptions={['mock', 'twilio']}
        />
      </div>
    </AppShell>
  );
}

function ProviderCard({
  settings: initial,
  label,
  onUpdate,
  providerOptions,
}: {
  settings: ProviderSettings;
  label: string;
  onUpdate: (data: Partial<ProviderSettings>) => void;
  providerOptions: string[];
}) {
  const [form, setForm] = useState({
    providerName: initial.providerName,
    whatsappSender: initial.whatsappSender,
    smsSender: initial.smsSender,
    active: initial.active,
  });

  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 22, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
      <h2 style={{ marginTop: 0, marginBottom: 18 }}>{label}</h2>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={labelStyle}>Provider</label>
          <select
            value={form.providerName}
            onChange={(e) => setForm({ ...form, providerName: e.target.value })}
            style={fieldStyle}
          >
            {providerOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>WhatsApp sender</label>
          <input value={form.whatsappSender} onChange={(e) => setForm({ ...form, whatsappSender: e.target.value })} style={fieldStyle} placeholder="Phone number ID or sender" />
        </div>
        <div>
          <label style={labelStyle}>SMS sender</label>
          <input value={form.smsSender} onChange={(e) => setForm({ ...form, smsSender: e.target.value })} style={fieldStyle} placeholder="SMS sender ID" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} id={`${initial.providerType}_active`} />
          <label htmlFor={`${initial.providerType}_active`} style={{ cursor: 'pointer' }}>Active</label>
        </div>
        <button type="button" onClick={() => onUpdate(form)} style={primaryBtn}>Save</button>
      </div>
    </div>
  );
}

const fieldStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14 };
const labelStyle: React.CSSProperties = { display: 'block', color: '#64748b', fontSize: 13, marginBottom: 6 };
const primaryBtn: React.CSSProperties = { border: 'none', background: '#2563eb', color: 'white', borderRadius: 10, padding: '12px 16px', fontWeight: 700, cursor: 'pointer', width: 'fit-content' };
const errorStyle: React.CSSProperties = { background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 10, fontSize: 14 };
const noticeStyle: React.CSSProperties = { background: '#ecfdf5', color: '#047857', padding: '10px 12px', borderRadius: 10, fontSize: 14 };