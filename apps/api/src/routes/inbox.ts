import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { failure, success } from '../utils/response.js';

const router = Router();

router.get('/', async (_req, res) => {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return res.json(success([]));
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
  const { data, error } = await supabase.from('inbox_messages').select('*').eq('organization_id', env.supabaseOrganizationId).order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(502).json(failure('INBOX_UNAVAILABLE', error.message));
  return res.json(success(data ?? []));
});

export default router;