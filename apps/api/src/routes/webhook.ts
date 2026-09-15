import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const router = Router();

router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === env.whatsappVerifyToken && challenge) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

router.post('/whatsapp', async (req, res) => {
  try {
    if (env.supabaseUrl && env.supabaseServiceRoleKey) {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
      const changes = req.body?.entry?.flatMap((entry: any) => entry.changes ?? []) ?? [];
      for (const change of changes) {
        const value = change.value ?? {};
        const messages = value.messages ?? [];
        const statuses = value.statuses ?? [];
        for (const message of messages) {
          await supabase.from('inbox_messages').upsert({
            organization_id: env.supabaseOrganizationId || null,
            provider_message_id: message.id,
            channel: 'WHATSAPP',
            direction: 'INBOUND',
            from_number: message.from,
            to_number: value.metadata?.display_phone_number ?? '',
            body: message.text?.body ?? null,
            message_type: message.type ?? 'text',
            media: message[message.type] ?? {},
            status: 'RECEIVED',
            raw_payload: message,
          }, { onConflict: 'provider_message_id' });
        }
        for (const status of statuses) {
          await supabase.from('messages').update({ status: String(status.status).toUpperCase(), delivered_at: status.status === 'delivered' ? new Date(Number(status.timestamp) * 1000).toISOString() : undefined, read_at: status.status === 'read' ? new Date(Number(status.timestamp) * 1000).toISOString() : undefined }).eq('provider_message_id', status.id);
        }
      }
    }
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
});

export default router;