import { Router } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { failure, success } from '../utils/response.js';
import { z } from 'zod';

const router = Router();
const notificationService = new NotificationService();

const sendMessageSchema = z.object({
  channel: z.enum(['WHATSAPP', 'SMS', 'BOTH']).default('WHATSAPP'),
  to: z.string().min(8),
  template: z.string().min(3),
  variables: z.record(z.string()).optional(),
});

router.get('/health', (_req, res) => {
  res.json(success({ status: 'ok' }));
});

router.post('/messages/send', async (req, res) => {
  try {
    const payload = sendMessageSchema.parse(req.body);
    const result = await notificationService.send(payload);
    res.status(200).json(success(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid message payload';
    res.status(400).json(failure('INVALID_MESSAGE', message));
  }
});

router.post('/messages/send-both', async (req, res) => {
  try {
    const payload = z.object({
      to: z.string().min(8),
      template: z.string().min(3),
      variables: z.record(z.string()).optional(),
    }).parse(req.body);

    const result = await notificationService.sendBoth(payload);
    res.status(200).json(success(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    res.status(400).json(failure('INVALID_BULK_MESSAGE', message));
  }
});

router.get('/dashboard', (_req, res) => {
  res.json(success({
    totalContacts: 12540,
    whatsappEnabled: 11920,
    smsEnabled: 12100,
    messagesToday: 4850,
    delivery: { whatsapp: 96, sms: 94 },
  }));
});

export default router;
