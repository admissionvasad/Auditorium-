import type { NotificationProvider, SendMessageInput, SendMessageResult } from './types.js';

export class MockProvider implements NotificationProvider {
  constructor(private readonly channel: 'WHATSAPP' | 'SMS') {}

  async send(input: SendMessageInput): Promise<SendMessageResult> {
    const providerMessageId = `mock-${this.channel.toLowerCase()}-${Date.now()}`;

    return {
      providerMessageId,
      status: 'QUEUED',
      raw: {
        channel: input.channel,
        to: input.to,
        template: input.template,
        variables: input.variables ?? {},
      },
    };
  }
}
