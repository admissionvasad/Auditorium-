import type { NotificationProvider, SendMessageInput, SendMessageResult } from './types.js';

export class MetaWhatsAppProvider implements NotificationProvider {
  constructor(
    private readonly accessToken: string,
    private readonly phoneNumberId: string,
    private readonly apiVersion: string,
  ) {}

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const response = await fetch(
      `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: input.to,
          type: 'text',
          text: { body: renderTemplate(input.template, input.variables) },
        }),
      },
    );

    const payload = await response.json() as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };

    if (!response.ok || !payload.messages?.[0]?.id) {
      throw new Error(`Meta WhatsApp send failed: ${payload.error?.message ?? response.statusText}`);
    }

    return {
      providerMessageId: payload.messages[0].id,
      status: 'QUEUED',
      raw: payload,
    };
  }
}

function renderTemplate(template: string, variables?: Record<string, string>) {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => variables?.[key] ?? '');
}