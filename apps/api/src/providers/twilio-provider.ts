import type { NotificationProvider, SendMessageInput, SendMessageResult } from './types.js';

export class TwilioProvider implements NotificationProvider {
  constructor(
    private readonly accountSid: string,
    private readonly authToken: string,
    private readonly sender: string,
  ) {}

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const body = new URLSearchParams({
      To: formatRecipient(input.to, input.channel),
      From: this.sender,
      Body: renderTemplate(input.template, input.variables),
    });
    const credentials = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    const payload = await response.json() as { sid?: string; status?: string; message?: string };
    if (!response.ok || !payload.sid) {
      throw new Error(`Twilio send failed: ${payload.message ?? response.statusText}`);
    }

    return {
      providerMessageId: payload.sid,
      status: payload.status?.toUpperCase() ?? 'QUEUED',
      raw: payload,
    };
  }
}

function formatRecipient(number: string, channel: 'WHATSAPP' | 'SMS' | 'BOTH') {
  return channel === 'WHATSAPP' ? `whatsapp:${number}` : number;
}

function renderTemplate(template: string, variables?: Record<string, string>) {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key: string) => variables?.[key] ?? '');
}