import { Router } from 'express';
import { z } from 'zod';
import { failure, success } from '../utils/response.js';

const router = Router();

const groupSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

router.get('/', (_req, res) => {
  res.json(success([
    { id: 'group_1', name: 'First Year Students', description: 'FY students' },
    { id: 'group_2', name: 'Faculty', description: 'Teaching staff' },
  ]));
});

router.post('/', (req, res) => {
  try {
    const payload = groupSchema.parse(req.body);
    res.status(201).json(success({
      id: `group_${Date.now()}`,
      ...payload,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid group payload';
    res.status(400).json(failure('INVALID_GROUP', message));
  }
});

export default router;
