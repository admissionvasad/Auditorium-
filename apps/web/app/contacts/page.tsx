'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken } from '../../lib/api';

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      const response = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Unable to create contact');
      }

      setForm(initialForm);
      setContacts((prev) => [result.data, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create contact');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#eef4ff', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 }}>
        <header style={{ background: '#0f172a', color: 'white', borderRadius: 18, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.75 }}>SVIT Notify</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 30 }}>Contacts</h1>
          </div>
          <a href="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>Back to Dashboard</a>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20 }}>
          <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <h2 style={{ marginTop: 0 }}>Add contact</h2>
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

              <button type="submit" disabled={loading} style={primaryButtonStyle}>
                {loading ? 'Saving...' : 'Save contact'}
              </button>
            </div>
          </form>

          <div style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
            <h2 style={{ marginTop: 0 }}>Contact list</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '8px 0' }}>Name</th>
                  <th style={{ padding: '8px 0' }}>Mobile</th>
                  <th style={{ padding: '8px 0' }}>Department</th>
                  <th style={{ padding: '8px 0' }}>Group</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 0' }}>{contact.fullName}</td>
                    <td style={{ padding: '10px 0' }}>{contact.mobile}</td>
                    <td style={{ padding: '10px 0' }}>{contact.department || '—'}</td>
                    <td style={{ padding: '10px 0' }}>{contact.group || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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

const errorStyle: React.CSSProperties = {
  background: '#fef2f2',
  color: '#b91c1c',
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
};
