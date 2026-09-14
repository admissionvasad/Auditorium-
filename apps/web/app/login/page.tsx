'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, setAuthToken } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@svit.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Login failed');
      }

      setAuthToken(result.data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#eef4ff' }}>
      <div style={{ width: 420, background: 'white', borderRadius: 18, padding: 28, boxShadow: '0 20px 45px rgba(15,23,42,0.08)' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, color: '#5b6b8a', letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 12 }}>SVIT Notify</p>
          <h1 style={{ margin: '8px 0 0', fontSize: 32 }}>Admin Login</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 18 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#475569', fontWeight: 600 }}>Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#475569', fontWeight: 600 }}>Password</label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #cbd5e1' }}
            />
          </div>

          {error ? (
            <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 14 }}>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{ border: 'none', background: '#2563eb', color: 'white', padding: '12px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
