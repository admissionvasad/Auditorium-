export type Channel = 'WHATSAPP' | 'SMS' | 'BOTH';

export interface SendMessageInput {
  channel: Channel;
  to: string;
  template: string;
  variables?: Record<string, string>;
}

export interface SendMessageResult {
  providerMessageId: string;
  status: string;
  raw?: unknown;
}

export interface NotificationProvider {
  send(input: SendMessageInput): Promise<SendMessageResult>;
}
