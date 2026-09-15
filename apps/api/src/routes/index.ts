import { Router } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { failure, success } from '../utils/response.js';
import { z } from 'zod';

const router = Router();
const notificationService = new NotificationService();

const sendMessageSchema = z.object({
  channel: z.enum(['WHATSAPP', 'SMS', 'BOTH']).default('WHATSAPP'),
  to: z.string().min(8),
  template: z.string().min(3),
  variables: z.record(z.string()).optional(),
});

router.get('/health', (_req, res) => {
  res.json(success({ status: 'ok' }));
});

router.post('/messages/send', async (req, res) => {
  try {
    const payload = sendMessageSchema.parse(req.body);
    const result = await notificationService.send(payload);
    res.status(200).json(success(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid message payload';
    res.status(400).json(failure('INVALID_MESSAGE', message));
  }
});

router.post('/messages/send-both', async (req, res) => {
  try {
    const payload = z.object({
      to: z.string().min(8),
      template: z.string().min(3),
      variables: z.record(z.string()).optional(),
    }).parse(req.body);

    const result = await notificationService.sendBoth(payload);
    res.status(200).json(success(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    res.status(400).json(failure('INVALID_BULK_MESSAGE', message));
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const { env } = await import('../config/env.js');
    const { createClient } = await import('@supabase/supabase-js');

    if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.supabaseOrganizationId) {
      return res.json(success({
        totalContacts: 12,
        whatsappEnabled: 10,
        smsEnabled: 11,
        messagesToday: 5,
        scheduled: 2,
        deliveryRate: 96,
        recentCampaigns: [],
      }));
    }

    const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
    const orgId = env.supabaseOrganizationId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [contactsResult, messagesTodayResult, scheduledResult, campaignsResult, deliveryResult] = await Promise.all([
      supabase.from('contacts').select('id, whatsapp_e164', { count: 'exact', head: true }).eq('organization_id', orgId).eq('active', true),
      supabase.from('messages').select('id, channel, status', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', todayISO),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'SCHEDULED'),
      supabase.from('campaigns').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(5),
      supabase.from('messages').select('status', { count: 'exact', head: true }).eq('organization_id', orgId),
    ]);

    const contactsCount = Number(contactsResult.count ?? 0);
    const whatsappCount = await supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).not('whatsapp_e164', 'is', null);
    const smsCount = await supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).not('mobile_e164', 'is', null);
    const todayMessages = await supabase.from('messages').select('status, channel').eq('organization_id', orgId).gte('created_at', todayISO);
    const totalMessages = Number(deliveryResult.count ?? 0);
    const deliveredMessages = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['DELIVERED', 'READ']);

    const allMessagesToday = todayMessages.data ?? [];
    const whatsappMessages = allMessagesToday.filter((m) => m.channel === 'WHATSAPP');
    const smsMessages = allMessagesToday.filter((m) => m.channel === 'SMS');
    const recentCampaigns = (campaignsResult.data ?? []).map((c) => ({
      name: String(c.name ?? ''),
      channel: String(c.channel ?? ''),
      status: String(c.status ?? 'DRAFT'),
      totalRecipients: Number(c.total_recipients ?? 0),
      deliveredCount: Number(c.delivered_count ?? 0),
      id: String(c.id),
    }));

    const delivered = Number(deliveredMessages.count ?? 0);

    res.json(success({
      totalContacts: contactsCount,
      whatsappEnabled: Number(whatsappCount.count ?? 0),
      smsEnabled: Number(smsCount.count ?? 0),
      messagesToday: allMessagesToday.length,
      whatsappToday: whatsappMessages.length,
      smsToday: smsMessages.length,
      scheduled: Number(scheduledResult.count ?? 0),
      deliveryRate: totalMessages > 0 ? Number(((delivered / totalMessages) * 100).toFixed(1)) : 0,
      recentCampaigns,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load dashboard';
    res.status(500).json(failure('DASHBOARD_UNAVAILABLE', message));
  }
});

export default router;
