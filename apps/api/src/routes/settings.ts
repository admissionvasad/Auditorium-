import { Router } from 'express';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service.js';
import { failure, success } from '../utils/response.js';

const router = Router();
const settingsService = new SettingsService();

const settingsSchema = z.object({
  providerType: z.enum(['WHATSAPP', 'SMS']),
  providerName: z.string().min(1),
  whatsappSender: z.string().optional(),
  smsSender: z.string().optional(),
  active: z.boolean().optional(),
});

router.get('/', async (_req, res) => {
  try {
    res.json(success(await settingsService.list()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load provider settings';
    res.status(502).json(failure('SETTINGS_UNAVAILABLE', message));
  }
});

router.put('/:providerType', async (req, res) => {
  try {
    const providerType = req.params.providerType.toUpperCase();
    if (providerType !== 'WHATSAPP' && providerType !== 'SMS') {
      return res.status(400).json(failure('INVALID_PROVIDER', 'Provider must be WHATSAPP or SMS'));
    }
    const payload = settingsSchema.partial().parse(req.body);
    res.json(success(await settingsService.update(providerType, payload)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update provider settings';
    res.status(400).json(failure('INVALID_SETTINGS', message));
  }
});

export default router;