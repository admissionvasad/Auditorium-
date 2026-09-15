import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface DeliveryReport {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number;
  failureRate: number;
  byChannel: Record<string, { total: number; delivered: number; failed: number }>;
  last7Days: Array<{ date: string; sent: number; delivered: number; failed: number }>;
}

export class ReportService {
  private readonly supabase: SupabaseClient | null;

  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async overall(): Promise<DeliveryReport> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return {
        total: 1790,
        sent: 1570,
        delivered: 1500,
        read: 980,
        failed: 220,
        deliveryRate: 95.5,
        failureRate: 12.3,
        byChannel: {
          WHATSAPP: { total: 1250, delivered: 1200, failed: 50 },
          SMS: { total: 540, delivered: 300, failed: 170 },
        },
        last7Days: [],
      };
    }

    const orgId = env.supabaseOrganizationId;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalResult, lastSevenResult, byChannelResult] = await Promise.all([
      this.supabase
        .from('messages')
        .select('status', { count: 'exact', head: true })
        .eq('organization_id', orgId),
      this.supabase
        .from('messages')
        .select('status, channel, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', sevenDaysAgo),
      this.supabase
        .from('messages')
        .select('status, channel')
        .eq('organization_id', orgId),
    ]);

    const rows = lastSevenResult.data ?? [];
    const byChannelRows = byChannelResult.data ?? [];

    const byChannel: DeliveryReport['byChannel'] = {};
    for (const row of byChannelRows) {
      const channel = String(row.channel ?? 'WHATSAPP');
      const bucket = byChannel[channel] ?? { total: 0, delivered: 0, failed: 0 };
      bucket.total += 1;
      if (row.status === 'DELIVERED' || row.status === 'READ') bucket.delivered += 1;
      if (row.status === 'FAILED') bucket.failed += 1;
      byChannel[channel] = bucket;
    }

    const byDay = new Map<string, { sent: number; delivered: number; failed: number }>();
    for (const row of rows) {
      const day = String(row.created_at ?? '').slice(0, 10);
      const bucket = byDay.get(day) ?? { sent: 0, delivered: 0, failed: 0 };
      if (row.status === 'FAILED') bucket.failed += 1;
      else if (row.status === 'READ' || row.status === 'DELIVERED') bucket.delivered += 1;
      else bucket.sent += 1;
      byDay.set(day, bucket);
    }

    const total = Number(totalResult.count ?? 0);
    const delivered = byChannelRows.filter((row) => row.status === 'DELIVERED' || row.status === 'READ').length;
    const failed = byChannelRows.filter((row) => row.status === 'FAILED').length;
    const sent = total - failed;

    return {
      total,
      sent,
      delivered,
      read: byChannelRows.filter((row) => row.status === 'READ').length,
      failed,
      deliveryRate: sent > 0 ? Number(((delivered / sent) * 100).toFixed(1)) : 0,
      failureRate: sent > 0 ? Number(((failed / sent) * 100).toFixed(1)) : 0,
      byChannel,
      last7Days: Array.from(byDay.entries()).map(([date, value]) => ({ date, ...value })),
    };
  }
}