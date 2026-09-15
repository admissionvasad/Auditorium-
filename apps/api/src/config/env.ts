import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4001),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBase: '/api/v1',
  whatsAppProvider: process.env.WHATSAPP_PROVIDER || 'mock',
  whatsAppAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsAppPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsAppApiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
  smsProvider: process.env.SMS_PROVIDER || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsAppSender: process.env.TWILIO_WHATSAPP_SENDER || '',
  twilioSmsSender: process.env.TWILIO_SMS_SENDER || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseOrganizationId: process.env.SUPABASE_ORGANIZATION_ID || '',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
};
