'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { API_URL, getAuthToken } from '../../lib/api';
import AppShell from '../../components/AppShell';

interface InboxMessage {
  id: string;
  from_number: string;
  to_number: string;
  body: string | null;
  message_type: string;
  direction: string;
  status: string;
  created_at: string;
}

export default function InboxPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return router.replace('/login');

    async function loadMessages() {
      const response = await fetch(`${API_URL}/inbox`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || 'Unable to load inbox');
      setMessages(result.data || []);
    }

    loadMessages().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load inbox'));
    const timer = window.setInterval(() => { loadMessages().catch(() => undefined); }, 10000);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
    const channel = supabase?.channel('inbox-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages' }, (payload) => {
      setMessages((current) => [payload.new as InboxMessage, ...current]);
    }).subscribe();

    return () => {
      window.clearInterval(timer);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <AppShell title="WhatsApp Inbox" subtitle="Realtime messages">
      {error ? <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: 10, padding: 12 }}>{error}</div> : null}
      <section style={{ background: 'white', borderRadius: 18, padding: 20, boxShadow: '0 10px 25px rgba(15,23,42,0.06)' }}>
        {messages.length === 0 ? <p style={{ color: '#64748b' }}>No messages received yet.</p> : messages.map((message) => (
          <article key={message.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '14px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{message.from_number || message.to_number}</strong><span style={{ color: '#64748b', fontSize: 13 }}>{new Date(message.created_at).toLocaleString()}</span></div>
            <p style={{ margin: '8px 0', color: '#334155' }}>{message.body || `[${message.message_type}]`}</p>
            <small style={{ color: '#64748b' }}>{message.direction} · {message.status}</small>
          </article>
        ))}
      </section>
    </AppShell>
  );
}