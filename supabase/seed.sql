insert into organizations (id, name, legal_name, code, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'SVIT Vasad',
  'Shree Vallabh Institute of Technology',
  'SVIT',
  'Asia/Kolkata'
)
on conflict (code) do nothing;

insert into contact_groups (id, organization_id, name, description)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'First Year Students',
  'First-year batch students'
), (
  '33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',
  'Faculty',
  'Teaching and support staff'
)
on conflict do nothing;

insert into message_templates (id, organization_id, name, channel, provider, provider_template_id, language_code, category, body, variables)
values (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  'Exam Notice',
  'WHATSAPP',
  'meta',
  'exam_notice_whatsapp',
  'en',
  'academic',
  'Dear {{name}}, your examination is scheduled on {{date}} at {{time}}. Venue: {{venue}}',
  '["name","date","time","venue"]'::jsonb
), (
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  'Fee Reminder',
  'SMS',
  'twilio',
  'fee_reminder_sms',
  'en',
  'finance',
  'Dear {{name}}, this is a reminder regarding pending fees for {{course}}.',
  '["name","course"]'::jsonb
)
on conflict do nothing;
