import { Router } from 'express';
import { z } from 'zod';
import { CampaignService } from '../services/campaign.service.js';
import { failure, success } from '../utils/response.js';

const router = Router();
const campaignService = new CampaignService();

const campaignSchema = z.object({
  name: z.string().min(2),
  channel: z.enum(['WHATSAPP', 'SMS', 'BOTH']).default('WHATSAPP'),
  templateId: z.string().min(1),
  groupId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

router.get('/', async (_req, res) => {
  try {
    res.json(success(await campaignService.listCampaigns()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load campaigns';
    res.status(502).json(failure('CAMPAIGNS_UNAVAILABLE', message));
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await campaignService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json(failure('CAMPAIGN_NOT_FOUND', 'Campaign not found'));
    res.json(success(campaign));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load campaign';
    res.status(500).json(failure('CAMPAIGN_UNAVAILABLE', message));
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = campaignSchema.parse(req.body);
    res.status(201).json(success(await campaignService.createCampaign(payload)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid campaign payload';
    res.status(400).json(failure('INVALID_CAMPAIGN', message));
  }
});

router.post('/:id/start', async (req, res) => {
  try {
    res.json(success(await campaignService.startCampaign(req.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start campaign';
    res.status(400).json(failure('START_CAMPAIGN_FAILED', message));
  }
});

router.post('/:id/pause', async (req, res) => {
  try {
    res.json(success(await campaignService.stopCampaign(req.params.id, 'PAUSED')));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to pause campaign';
    res.status(400).json(failure('PAUSE_CAMPAIGN_FAILED', message));
  }
});

router.post('/:id/resume', async (req, res) => {
  try {
    res.json(success(await campaignService.startCampaign(req.params.id)));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to resume campaign';
    res.status(400).json(failure('RESUME_CAMPAIGN_FAILED', message));
  }
});

router.post('/:id/cancel', async (req, res) => {
  try {
    res.json(success(await campaignService.stopCampaign(req.params.id, 'CANCELLED')));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to cancel campaign';
    res.status(400).json(failure('CANCEL_CAMPAIGN_FAILED', message));
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await campaignService.deleteCampaign(req.params.id);
    res.json(success({ deleted: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete campaign';
    res.status(400).json(failure('DELETE_CAMPAIGN_FAILED', message));
  }
});

export default router;