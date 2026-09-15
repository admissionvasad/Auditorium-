import { Router } from 'express';
import { z } from 'zod';
import { GroupService } from '../services/group.service.js';
import { failure, success } from '../utils/response.js';

const router = Router();
const groupService = new GroupService();

const groupSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

const groupUpdateSchema = groupSchema.partial();

router.get('/', async (_req, res) => {
  try {
    res.json(success(await groupService.listGroups()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load groups';
    res.status(502).json(failure('GROUPS_UNAVAILABLE', message));
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = groupSchema.parse(req.body);
    res.status(201).json(success(await groupService.createGroup(payload)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid group payload';
    res.status(400).json(failure('INVALID_GROUP', message));
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const payload = groupUpdateSchema.parse(req.body);
    res.json(success(await groupService.updateGroup(req.params.id, payload)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update group';
    res.status(message === 'Group not found' ? 404 : 400).json(failure('INVALID_GROUP_UPDATE', message));
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await groupService.deleteGroup(req.params.id);
    res.json(success({ deleted: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete group';
    res.status(message === 'Group not found' ? 404 : 400).json(failure('DELETE_GROUP_FAILED', message));
  }
});

export default router;