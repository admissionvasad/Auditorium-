'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { API_URL, clearAuthToken, getAuthToken } from '../lib/api';

export const NAV_ITEMS: Array<{ label: string; href?: string }> = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Contacts', href: '/contacts' },
  { label: 'WhatsApp Inbox', href: '/inbox' },
  { label: 'Groups', href: '/groups' },
  { label: 'Templates', href: '/templates' },
  { label: 'Send Message', href: '/messages' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Scheduled', href: '/scheduled' },
  { label: 'Reports', href: '/reports' },
  { label: 'Provider Settings', href: '/settings' },
];

export default function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unauthorized');
        const result = await response.json();
        if (result.success) setUserName(result.data.fullName || result.data.email || 'Admin');
      })
      .catch(() => {
        clearAuthToken();
        router.replace('/login');
      });
  }, [router]);

  function logout() {
    clearAuthToken();
    router.push('/login');
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', background: '#eef4ff', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        <aside style={{ background: '#0f172a', color: 'white', borderRadius: 18, padding: 22, alignSelf: 'start' }}>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 26 }}>SVIT Notify</div>
          <nav style={{ display: 'grid', gap: 10 }}>
            {NAV_ITEMS.map((item) => {
              const active = item.href && pathname.startsWith(item.href);
              return (
                <a
                  key={item.label}
                  href={item.href || undefined}
                  style={{
                    background: active ? '#1e293b' : 'transparent',
                    borderRadius: 10,
                    padding: '10px 12px',
                    color: item.href ? '#e2e8f0' : '#64748b',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: item.href ? 'pointer' : 'default',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <section style={{ display: 'grid', gap: 20 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 18, padding: '20px 24px', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)' }}>
            <div>
              {subtitle ? <p style={{ margin: 0, color: '#5b6b8a', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{subtitle}</p> : null}
              <h1 style={{ margin: subtitle ? '8px 0 0' : 0, fontSize: 30 }}>{title}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>{userName}</div>
              <button onClick={logout} style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: 12, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }}>Logout</button>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}