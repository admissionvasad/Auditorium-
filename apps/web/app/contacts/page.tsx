'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface Contact {
  id: string;
  fullName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  department: string;
  course: string;
  semester: string;
  group: string;
  active: boolean;
}

const initialForm = {
  fullName: '',
  mobile: '',
  whatsapp: '',
  email: '',
  department: '',
  course: '',
  semester: '',
  group: '',
};

export default function ContactsPage() {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [bulkImporting, setBulkImporting] = useState(false);

  const bulkCount = useMemo(() => bulkText.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.replace(/\D/g, '').length >= 8).length, [bulkText]);

  function addCountryCode() {
    const code = countryCode.replace(/\D/g, '');
    if (!code) {
      setError('Enter a country code first (e.g. 91 for India).');
      return;
    }
    const lines = bulkText.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
    const normalized = lines.map((line) => {
      const digits = line.replace(/\D/g, '');
      if (!digits) return line;
      if (line.startsWith('+')) return line;
      if (code.length > 0 && digits.length >= 11 && digits.startsWith(code)) return `+${digits}`;
      return `+${code}${digits}`;
    });
    setBulkText(normalized.join('\n'));
    setNotice(`Country code +${code} applied.`);
    setError('');
  }

  async function importBulk() {
    const lines = bulkText.split(/[\n,;]+/).map((l) => l.trim()).filter((l) => l.startsWith('+') && l.replace(/\D/g, '').length >= 8);
    if (lines.length === 0) {
      setError('No valid numbers found. Apply a country code first.');
      return;
    }
    const token = getAuthToken();
    if (!token) return router.replace('/login');
    setBulkImporting(true);
    setError('');
    setNotice('');
    let imported = 0;
    for (const number of lines) {
      try {
        const response = await fetch(`${API_URL}/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fullName: '', mobile: number }),
        });
        if (response.ok) imported += 1;
      } catch {
        // skip individual failures, continue with the rest
      }
    }
    try {
      const response = await fetch(`${API_URL}/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (response.ok && result.success) setContacts(result.data || []);
    } catch {
      // list refresh best-effort
    }
    setNotice(`${imported} of ${lines.length} numbers added as contacts.`);
    setBulkText('');
    setBulkOpen(false);
    setBulkImporting(false);
  }

  const filteredContacts = useMemo(() => contacts.filter((contact) => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [contact.fullName, contact.mobile, contact.email, contact.department, contact.group]
      .some((value) => value.toLowerCase().includes(query));
    const matchesDepartment = departmentFilter === 'All' || contact.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' ? contact.active : !contact.active);
    return matchesSearch && matchesDepartment && matchesStatus;
  }), [contacts, search, departmentFilter, statusFilter]);

  const departments = Array.from(new Set(contacts.map((contact) => contact.department).filter(Boolean))).sort();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load contacts');
        const result = await response.json();
        setContacts(result.data || []);
      })
      .catch(() => {
        setContacts([
          {
            id: 'contact_1',
            fullName: 'Rahul Patel',
            mobile: '+919876543210',
            whatsapp: '+919876543210',
            email: 'rahul.patel@svit.edu',
            department: 'Computer Science',
            course: 'B.Tech',
            semester: 'Sem 7',
            group: 'Students',
            active: true,
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

      const response = await fetch(`${API_URL}/contacts${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, whatsapp: form.whatsapp || undefined }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Unable to create contact');
      }

      setForm(initialForm);
      setEditingId(null);
      setContacts((prev) => editingId ? prev.map((contact) => contact.id === editingId ? result.data : contact) : [result.data, ...prev]);
      setNotice(editingId ? 'Contact updated successfully.' : 'Contact added successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create contact');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(contact: Contact) {
    setEditingId(contact.id);
    setForm({ fullName: contact.fullName, mobile: contact.mobile, whatsapp: contact.whatsapp, email: contact.email, department: contact.department, course: contact.course, semester: contact.semester, group: contact.group });
    setError('');
    setNotice('');
  }

  async function toggleActive(contact: Contact) {
    const token = getAuthToken();
    if (!token) return router.replace('/login');
    try {
      const response = await fetch(`${API_URL}/contacts/${contact.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ active: !contact.active }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to update contact');
      setContacts((prev) => prev.map((item) => item.id === contact.id ? result.data : item));
      setNotice(`${contact.fullName} ${contact.active ? 'deactivated' : 'activated'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update contact');
    }
  }

  function exportContacts() {
    const rows = filteredContacts.map((contact) => ({ Name: contact.fullName, Mobile: contact.mobile, WhatsApp: contact.whatsapp, Email: contact.email, Department: contact.department, Course: contact.course, Semester: contact.semester, Group: contact.group, Status: contact.active ? 'Active' : 'Inactive' }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'Contacts');
    XLSX.writeFile(workbook, 'svit-contacts.xlsx');
  }

  async function importContacts(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]]);
      const token = getAuthToken();
      if (!token) return router.replace('/login');
      let imported = 0;
      for (const row of rows) {
        const payload = { fullName: String(row.Name ?? row['Full Name'] ?? ''), mobile: String(row.Mobile ?? ''), whatsapp: String(row.WhatsApp ?? '') || undefined, email: String(row.Email ?? ''), department: String(row.Department ?? ''), course: String(row.Course ?? ''), semester: String(row.Semester ?? ''), group: String(row.Group ?? '') };
        if (payload.fullName.length < 2 || payload.mobile.length < 8) continue;
        const response = await fetch(`${API_URL}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (response.ok) imported += 1;
      }
      const response = await fetch(`${API_URL}/contacts`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (response.ok && result.success) setContacts(result.data || []);
      setNotice(`${imported} contact${imported === 1 ? '' : 's'} imported.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import Excel file');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Contacts" subtitle="Manage your contact directory">
      <section style={{ background: 'white', borderRadius: 18, padding: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
        <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); setError(''); setNotice(''); }} style={primaryButtonStyle}>+ Add Contact</button>
        <button type="button" onClick={() => setBulkOpen(!bulkOpen)} style={secondaryButtonStyle}>{bulkOpen ? 'Close Bulk Paste' : 'Bulk Paste Numbers'}</button>
        <button type="button" onClick={() => importInputRef.current?.click()} style={secondaryButtonStyle}>Import Excel</button>
        <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importContacts} style={{ display: 'none' }} />
        <button type="button" onClick={exportContacts} style={secondaryButtonStyle}>Export Excel</button>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts..." style={{ ...fieldStyle, flex: '1 1 220px', minWidth: 220 }} />
        <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} style={selectStyle}>
          <option value="All">All departments</option>
          {departments.map((department) => <option key={department}>{department}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={selectStyle}>
          <option value="Active">Active contacts</option>
          <option value="Inactive">Inactive contacts</option>
          <option value="All">All statuses</option>
        </select>
      </section>

      {bulkOpen && (
        <section style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)', display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Bulk paste contact numbers</h2>
            <span style={{ color: '#64748b', fontSize: 14 }}>{bulkCount} valid number{bulkCount === 1 ? '' : 's'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 12, alignItems: 'end' }}>
            <div>
              <label style={bulkLabelStyle}>Paste numbers (one per line, or separated by comma/semicolon)</label>
              <textarea
                value={bulkText}
                onChange={(e) => { setBulkText(e.target.value); setError(''); }}
                placeholder={'9876543210\n9988776655\n+919812345678'}
                rows={7}
                style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label style={bulkLabelStyle}>Country code (without +)</label>
              <input value={countryCode} onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, ''))} placeholder="91" style={fieldStyle} />
              <button type="button" onClick={addCountryCode} style={{ ...secondaryButtonStyle, width: '100%', marginTop: 10 }}>Insert Country Code</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button type="button" onClick={importBulk} disabled={bulkImporting || bulkCount === 0} style={primaryButtonStyle}>
              {bulkImporting ? 'Importing...' : `Create ${bulkCount} Contact${bulkCount === 1 ? '' : 's'}`}
            </button>
            <button type="button" onClick={() => setBulkText('')} style={secondaryButtonStyle}>Clear</button>
          </div>
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit contact' : 'Add contact'}</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" style={fieldStyle} />
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile number" style={fieldStyle} />
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp number" style={fieldStyle} />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" style={fieldStyle} />
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" style={fieldStyle} />
              <input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Course" style={fieldStyle} />
              <input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} placeholder="Semester" style={fieldStyle} />
              <input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Group" style={fieldStyle} />

              {error ? <div style={errorStyle}>{error}</div> : null}
              {notice ? <div style={noticeStyle}>{notice}</div> : null}

              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? 'Saving...' : editingId ? 'Update contact' : 'Save contact'}
              </button>
              {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm(initialForm); }} style={secondaryButtonStyle}>Cancel edit</button> : null}
            </div>
          </form>

          <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <h2 style={{ marginTop: 0 }}>Contact list ({filteredContacts.length})</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 0' }}>Name</th>
                  <th style={{ padding: '8px 0' }}>Mobile</th>
                  <th style={{ padding: '8px 0' }}>Department</th>
                  <th style={{ padding: '8px 0' }}>Group</th>
                  <th style={{ padding: '8px 0' }}>Status</th>
                  <th style={{ padding: '8px 0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 0' }}>{contact.fullName}</td>
                    <td style={{ padding: '10px 0' }}>{contact.mobile}</td>
                    <td style={{ padding: '10px 0' }}>{contact.department || '—'}</td>
                    <td style={{ padding: '10px 0' }}>{contact.group || '—'}</td>
                    <td style={{ padding: '10px 0', color: contact.active ? '#15803d' : '#b91c1c' }}>{contact.active ? 'Active' : 'Inactive'}</td>
                    <td style={{ padding: '10px 0', whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={() => startEdit(contact)} style={tableButtonStyle}>Edit</button>
                      <button type="button" onClick={() => toggleActive(contact)} style={tableButtonStyle}>{contact.active ? 'Deactivate' : 'Activate'}</button>
                    </td>
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

const bulkLabelStyle: React.CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 13,
  marginBottom: 6,
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

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  background: 'white',
  color: '#1e293b',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const selectStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: 'white',
};

const tableButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#2563eb',
  fontWeight: 700,
  cursor: 'pointer',
  padding: '4px 6px',
};

const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  color: '#b91c1c',
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
};

const noticeStyle: React.CSSProperties = {
  background: '#ecfdf5',
  color: '#047857',
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
};
