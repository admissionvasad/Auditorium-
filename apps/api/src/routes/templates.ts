import { Router } from 'express';
import { z } from 'zod';
import { TemplateService } from '../services/template.service.js';
import { failure, success } from '../utils/response.js';

const router = Router();
const templateService = new TemplateService();

const templateSchema = z.object({
  name: z.string().min(2),
  channel: z.enum(['WHATSAPP', 'SMS']),
  body: z.string().min(10),
  variables: z.array(z.string()).default([]),
});

router.get('/', async (_req, res) => {
  try {
    res.json(success(await templateService.listTemplates()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load templates';
    res.status(502).json(failure('TEMPLATES_UNAVAILABLE', message));
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = templateSchema.parse(req.body);
    res.status(201).json(success(await templateService.createTemplate(payload)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid template payload';
    res.status(400).json(failure('INVALID_TEMPLATE', message));
  }
});

export default router;
