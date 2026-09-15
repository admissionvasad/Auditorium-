'use client';

import { useEffect, useMemo, useState } from 'react';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

const emptyForm = { name: '', description: '' };

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  const filteredGroups = useMemo(
    () => groups.filter((g) => !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase())),
    [groups, search],
  );

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load groups');
        const result = await response.json();
        setGroups(result.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/groups${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Failed to save group');

      setForm(emptyForm);
      setEditingId(null);
      setNotice(editingId ? 'Group updated.' : 'Group created.');
      refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save group');
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroup(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/groups/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Failed to delete group');
      setNotice('Group deleted.');
      refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    }
  }

  async function refreshList() {
    const token = getAuthToken();
    if (!token) return;
    const response = await fetch(`${API_URL}/groups`, { headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (response.ok && result.success) setGroups(result.data || []);
  }

  return (
    <AppShell title="Groups" subtitle="Manage contact groups">
      <section style={{ background: 'white', borderRadius: 18, padding: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
        <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setError(''); setNotice(''); }} style={primaryBtn}>+ New Group</button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." style={{ ...fieldStyle, flex: '1 1 220px', minWidth: 200 }} />
      </section>

      {notice ? <div style={noticeStyle}>{notice}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}

      <section style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 20 }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit group' : 'New group'}</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Group name" style={fieldStyle} />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={3} style={fieldStyle} />
            <button type="submit" disabled={loading} style={primaryBtn}>{loading ? 'Saving...' : editingId ? 'Update' : 'Create group'}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} style={secondaryBtn}>Cancel</button> : null}
          </div>
        </form>

        <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)' }}>
          <h2 style={{ marginTop: 0 }}>Groups ({filteredGroups.length})</h2>
          {loadingList ? <p style={{ color: '#64748b' }}>Loading groups...</p> : filteredGroups.length === 0 ? (
            <p style={{ color: '#64748b' }}>No groups found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 0' }}>Name</th>
                  <th style={{ padding: '8px 0' }}>Description</th>
                  <th style={{ padding: '8px 0' }}>Members</th>
                  <th style={{ padding: '8px 0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 0', fontWeight: 600 }}>{group.name}</td>
                    <td style={{ padding: '12px 0', color: '#64748b' }}>{group.description || '—'}</td>
                    <td style={{ padding: '12px 0' }}>{group.memberCount}</td>
                    <td style={{ padding: '12px 0', whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={() => { setEditingId(group.id); setForm({ name: group.name, description: group.description }); }} style={tableBtn}>Edit</button>
                      <button type="button" onClick={() => deleteGroup(group.id, group.name)} style={{ ...tableBtn, color: '#b91c1c' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </AppShell>
  );
}

const fieldStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, resize: 'vertical' };
const primaryBtn: React.CSSProperties = { border: 'none', background: '#2563eb', color: 'white', borderRadius: 10, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { border: '1px solid #cbd5e1', background: 'white', color: '#1e293b', borderRadius: 10, padding: '12px 16px', fontWeight: 700, cursor: 'pointer' };
const tableBtn: React.CSSProperties = { border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: '4px 8px' };
const errorStyle: React.CSSProperties = { background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 10, fontSize: 14 };
const noticeStyle: React.CSSProperties = { background: '#ecfdf5', color: '#047857', padding: '10px 12px', borderRadius: 10, fontSize: 14 };