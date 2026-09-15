import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { NotificationService } from './notification.service.js';

export interface CampaignInput {
  name: string;
  channel: 'WHATSAPP' | 'SMS' | 'BOTH';
  templateId: string;
  groupId?: string;
  scheduledAt?: string;
}

export interface Campaign extends CampaignInput {
  id: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  createdAt: string;
}

export class CampaignService {
  private readonly supabase: SupabaseClient | null;
  private readonly memoryCampaigns: Campaign[] = [
    {
      id: 'camp_1',
      name: 'Admission Notice',
      channel: 'WHATSAPP',
      templateId: 'tpl_1',
      status: 'COMPLETED',
      totalRecipients: 1250,
      sentCount: 1250,
      deliveredCount: 1200,
      readCount: 980,
      failedCount: 50,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'camp_2',
      name: 'Fee Reminder',
      channel: 'SMS',
      templateId: 'tpl_1',
      status: 'RUNNING',
      totalRecipients: 540,
      sentCount: 320,
      deliveredCount: 300,
      readCount: 0,
      failedCount: 20,
      createdAt: new Date().toISOString(),
    },
  ];

  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async listCampaigns(): Promise<Campaign[]> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return this.memoryCampaigns;
    }

    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', env.supabaseOrganizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load campaigns: ${error.message}`);
    }

    return (data ?? []).map((campaign) => this.toCampaign(campaign));
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    if (!this.supabase) {
      return this.memoryCampaigns.find((item) => item.id === id) ?? null;
    }
    const { data, error } = await this.supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return this.toCampaign(data);
  }

  async createCampaign(input: CampaignInput): Promise<Campaign> {
    if (this.supabase && env.supabaseOrganizationId) {
      const audience = await this.resolveAudience(input.groupId);
      const recipients = audience.contacts.map((contact) => contact.phone);
      const totalRecipients = input.channel === 'BOTH' ? recipients.length * 2 : recipients.length;

      const { data, error } = await this.supabase
        .from('campaigns')
        .insert({
          organization_id: env.supabaseOrganizationId,
          name: input.name,
          channel: input.channel,
          template_id: input.templateId,
          group_id: input.groupId ?? null,
          status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
          scheduled_at: input.scheduledAt ?? null,
          total_recipients: totalRecipients,
          metadata: { recipient_count: recipients.length },
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Unable to create campaign: ${error.message}`);
      }

      return this.toCampaign(data);
    }

    const created: Campaign = {
      id: `camp_${Date.now()}`,
      ...input,
      status: input.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      totalRecipients: 0,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.memoryCampaigns.unshift(created);
    return created;
  }

  async startCampaign(id: string): Promise<Campaign> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      const campaign = this.memoryCampaigns.find((item) => item.id === id);
      if (!campaign) throw new Error('Campaign not found');
      campaign.status = 'RUNNING';
      return campaign;
    }

    const campaign = await this.getCampaign(id);
    if (!campaign) throw new Error('Campaign not found');

    const { data: campaignRow, error: campaignError } = await this.supabase
      .from('campaigns')
      .update({ status: 'RUNNING', started_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (campaignError) throw new Error(`Unable to start campaign: ${campaignError.message}`);

    const audience = await this.resolveAudience(campaign.groupId);
    const notificationService = new NotificationService();
    const template = await this.getTemplate(campaign.templateId);

    if (template) {
      await Promise.allSettled(
        audience.contacts.map((contact) =>
          notificationService.send({
            channel: campaign.channel,
            to: contact.phone,
            template: template.body,
            variables: { name: contact.name },
          })
        )
      );
    }

    const { error: doneError } = await this.supabase
      .from('campaigns')
      .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
      .eq('id', id);
    if (doneError) throw new Error(`Unable to complete campaign: ${doneError.message}`);

    return this.toCampaign(campaignRow);
  }

  async stopCampaign(id: string, status: 'PAUSED' | 'CANCELLED'): Promise<Campaign> {
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('campaigns')
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw new Error(`Unable to update campaign: ${error.message}`);
      return this.toCampaign(data);
    }

    const campaign = this.memoryCampaigns.find((item) => item.id === id);
    if (!campaign) throw new Error('Campaign not found');
    campaign.status = status;
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    if (this.supabase) {
      const { error } = await this.supabase.from('campaigns').delete().eq('id', id);
      if (error) throw new Error(`Unable to delete campaign: ${error.message}`);
      return;
    }
    const index = this.memoryCampaigns.findIndex((item) => item.id === id);
    if (index !== -1) this.memoryCampaigns.splice(index, 1);
  }

  private async resolveAudience(groupId?: string): Promise<{ contacts: Array<{ id: string; name: string; phone: string }> }> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return { contacts: [{ id: 'contact_1', name: 'Rahul Patel', phone: '+919876543210' }] };
    }

    let query = this.supabase
      .from('contacts')
      .select('id, full_name, mobile_e164, whatsapp_e164');

    if (groupId) {
      const { data: memberRows, error: memberError } = await this.supabase
        .from('group_members')
        .select('contact_id')
        .eq('group_id', groupId);
      if (memberError) throw new Error(`Unable to load audience: ${memberError.message}`);
      const ids = (memberRows ?? []).map((row) => row.contact_id);
      if (ids.length === 0) return { contacts: [] };
      query = query.in('id', ids);
    } else {
      query = query.eq('organization_id', env.supabaseOrganizationId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Unable to load audience: ${error.message}`);

    return {
      contacts: (data ?? []).map((contact) => ({
        id: String(contact.id),
        name: String(contact.full_name ?? ''),
        phone: String(contact.whatsapp_e164 ?? contact.mobile_e164 ?? ''),
      })).filter((contact) => contact.phone),
    };
  }

  private async getTemplate(templateId: string): Promise<{ body: string } | null> {
    if (!this.supabase) {
      return { body: 'Dear {{name}}, this is a notification from SVIT.' };
    }
    const { data, error } = await this.supabase
      .from('message_templates')
      .select('body')
      .eq('id', templateId)
      .single();
    if (error) return null;
    return { body: String(data.body ?? '') };
  }

  private toCampaign(campaign: Record<string, unknown>): Campaign {
    return {
      id: String(campaign.id),
      name: String(campaign.name ?? ''),
      channel: (campaign.channel as Campaign['channel']) ?? 'WHATSAPP',
      templateId: String(campaign.template_id ?? ''),
      groupId: campaign.group_id ? String(campaign.group_id) : undefined,
      status: String(campaign.status ?? 'DRAFT'),
      scheduledAt: campaign.scheduled_at ? String(campaign.scheduled_at) : undefined,
      totalRecipients: Number(campaign.total_recipients ?? 0),
      sentCount: Number(campaign.sent_count ?? 0),
      deliveredCount: Number(campaign.delivered_count ?? 0),
      readCount: Number(campaign.read_count ?? 0),
      failedCount: Number(campaign.failed_count ?? 0),
      createdAt: String(campaign.created_at ?? ''),
    };
  }
}