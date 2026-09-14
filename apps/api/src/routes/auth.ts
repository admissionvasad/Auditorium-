import { Router } from 'express';
import { z } from 'zod';
import { failure, success } from '../utils/response.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);

    if (payload.email.toLowerCase() === 'admin@svit.edu' && payload.password === 'admin123') {
      return res.json(success({
        token: 'mock-admin-token',
        user: {
          id: 'user_1',
          fullName: 'SVIT Admin',
          email: payload.email,
          role: 'ADMIN',
        },
      }));
    }

    return res.status(401).json(failure('INVALID_CREDENTIALS', 'Email or password is incorrect.'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid login payload';
    return res.status(400).json(failure('INVALID_LOGIN', message));
  }
});

router.get('/me', (_req, res) => {
  return res.json(success({
    id: 'user_1',
    fullName: 'SVIT Admin',
    email: 'admin@svit.edu',
    role: 'ADMIN',
  }));
});

export default router;
