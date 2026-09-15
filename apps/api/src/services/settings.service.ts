import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface ProviderSettingsInput {
  providerType: 'WHATSAPP' | 'SMS';
  providerName: string;
  whatsappSender?: string;
  smsSender?: string;
  active?: boolean;
}

export interface ProviderSettings extends ProviderSettingsInput {
  id: string;
}

export class SettingsService {
  private readonly supabase: SupabaseClient | null;

  constructor() {
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async list(): Promise<ProviderSettings[]> {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return [
        { id: 'settings_1', providerType: 'WHATSAPP', providerName: 'mock', whatsappSender: '', smsSender: '', active: true },
        { id: 'settings_2', providerType: 'SMS', providerName: 'mock', whatsappSender: '', smsSender: '', active: true },
      ];
    }

    const { data, error } = await this.supabase
      .from('provider_settings')
      .select('*')
      .eq('organization_id', env.supabaseOrganizationId)
      .order('provider_type');

    if (error) {
      throw new Error(`Unable to load provider settings: ${error.message}`);
    }

    return (data ?? []).map((row) => this.toSettings(row));
  }

  async update(providerType: 'WHATSAPP' | 'SMS', input: Partial<ProviderSettingsInput>): Promise<ProviderSettings> {
    if (this.supabase && env.supabaseOrganizationId) {
      const updates: Record<string, unknown> = {};
      if (input.providerName !== undefined) updates.provider_name = input.providerName;
      if (input.whatsappSender !== undefined) updates.whatsapp_sender = input.whatsappSender ?? null;
      if (input.smsSender !== undefined) updates.sms_sender = input.smsSender ?? null;
      if (input.active !== undefined) updates.active = input.active;

      const { data, error } = await this.supabase
        .from('provider_settings')
        .update(updates)
        .eq('organization_id', env.supabaseOrganizationId)
        .eq('provider_type', providerType)
        .select('*')
        .single();

      if (error) {
        const upsert = await this.supabase
          .from('provider_settings')
          .upsert(
            { organization_id: env.supabaseOrganizationId, provider_type: providerType, provider_name: input.providerName ?? 'mock', ...updates },
            { onConflict: 'organization_id, provider_type' }
          )
          .select('*')
          .single();
        if (upsert.error) throw new Error(`Unable to update provider settings: ${upsert.error.message}`);
        return this.toSettings(upsert.data);
      }

      return this.toSettings(data);
    }

    return { id: `settings_${providerType}`, providerType, providerName: input.providerName ?? 'mock', whatsappSender: input.whatsappSender, smsSender: input.smsSender, active: input.active ?? true };
  }

  private toSettings(row: Record<string, unknown>): ProviderSettings {
    return {
      id: String(row.id),
      providerType: row.provider_type === 'SMS' ? 'SMS' : 'WHATSAPP',
      providerName: String(row.provider_name ?? ''),
      whatsappSender: String(row.whatsapp_sender ?? ''),
      smsSender: String(row.sms_sender ?? ''),
      active: Boolean(row.active),
    };
  }
}