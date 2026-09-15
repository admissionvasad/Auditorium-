import { Router } from 'express';
import { z } from 'zod';
import { ContactService } from '../services/contact.service.js';
import { failure, success } from '../utils/response.js';

const router = Router();
const contactService = new ContactService();

const contactSchema = z.object({
  fullName: z.string().min(2),
  mobile: z.string().min(8),
  whatsapp: z.string().min(8).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  department: z.string().optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
  batch: z.string().optional(),
  group: z.string().optional(),
});

const contactUpdateSchema = contactSchema.partial().extend({ active: z.boolean().optional() });

router.get('/', async (_req, res) => {
  try {
    res.json(success(await contactService.listContacts()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load contacts';
    res.status(502).json(failure('CONTACTS_UNAVAILABLE', message));
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = contactSchema.parse(req.body);
    const created = await contactService.createContact(payload);
    res.status(201).json(success(created));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid contact payload';
    res.status(400).json(failure('INVALID_CONTACT', message));
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const payload = contactUpdateSchema.parse(req.body);
    const updated = await contactService.updateContact(req.params.id, payload);
    res.json(success(updated));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update contact';
    res.status(message === 'Contact not found' ? 404 : 400).json(failure('INVALID_CONTACT_UPDATE', message));
  }
});

export default router;
