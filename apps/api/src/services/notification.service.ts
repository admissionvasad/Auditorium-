import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { MockProvider } from '../providers/mock-provider.js';
import { MetaWhatsAppProvider } from '../providers/meta-whatsapp-provider.js';
import { TwilioProvider } from '../providers/twilio-provider.js';
import type { NotificationProvider, SendMessageInput } from '../providers/types.js';

export class NotificationService {
  private readonly whatsappProvider: NotificationProvider;
  private readonly smsProvider: NotificationProvider;
  private readonly supabase: SupabaseClient | null;

  constructor() {
    const whatsappProviderName = env.whatsAppProvider;
    const smsProviderName = env.smsProvider;

    if (!['mock', 'meta'].includes(whatsappProviderName)) {
      throw new Error(`Unsupported WhatsApp provider: ${whatsappProviderName}`);
    }

    if (!['mock', 'twilio'].includes(smsProviderName)) {
      throw new Error(`Unsupported SMS provider: ${smsProviderName}`);
    }

    if (whatsappProviderName === 'meta' && (!env.whatsAppAccessToken || !env.whatsAppPhoneNumberId)) {
      throw new Error('Missing WhatsApp credentials for the meta provider');
    }

    if (smsProviderName === 'twilio' && (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioSmsSender)) {
      throw new Error('Missing Twilio credentials for the twilio provider');
    }

    this.whatsappProvider = whatsappProviderName === 'meta'
      ? new MetaWhatsAppProvider(env.whatsAppAccessToken, env.whatsAppPhoneNumberId, env.whatsAppApiVersion)
      : new MockProvider('WHATSAPP');
    this.smsProvider = smsProviderName === 'twilio'
      ? new TwilioProvider(env.twilioAccountSid, env.twilioAuthToken, env.twilioSmsSender)
      : new MockProvider('SMS');
    this.supabase = env.supabaseUrl && env.supabaseServiceRoleKey
      ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey)
      : null;
  }

  async send(input: SendMessageInput): Promise<{ providerMessageId: string; status: string }> {
    const normalizedChannel = input.channel || 'WHATSAPP';

    if (normalizedChannel === 'BOTH') {
      await this.send({ channel: 'WHATSAPP', to: input.to, template: input.template, variables: input.variables });
      const result = await this.send({ channel: 'SMS', to: input.to, template: input.template, variables: input.variables });
      return result;
    }

    const provider = normalizedChannel === 'WHATSAPP' ? this.whatsappProvider : this.smsProvider;
    const result = await provider.send(input);
    await this.persistMessage(input, result);
    return { providerMessageId: result.providerMessageId, status: result.status };
  }

  async sendBoth(input: { to: string; template: string; variables?: Record<string, string> }) {
    return Promise.all([
      this.send({ channel: 'WHATSAPP', to: input.to, template: input.template, variables: input.variables }),
      this.send({ channel: 'SMS', to: input.to, template: input.template, variables: input.variables }),
    ]);
  }

  private async persistMessage(
    input: SendMessageInput,
    result: { providerMessageId: string; status: string },
  ) {
    if (!this.supabase || !env.supabaseOrganizationId) {
      return;
    }

    const { error } = await this.supabase.from('messages').insert({
      organization_id: env.supabaseOrganizationId,
      channel: input.channel,
      to_number: input.to,
      body: input.template,
      provider: input.channel === 'WHATSAPP' ? env.whatsAppProvider : env.smsProvider,
      provider_message_id: result.providerMessageId,
      status: result.status,
      metadata: { variables: input.variables ?? {} },
    });

    if (error) {
      throw new Error(`Unable to persist message: ${error.message}`);
    }
  }
}
