import { Router } from 'express';
import { ReportService } from '../services/report.service.js';
import { failure, success } from '../utils/response.js';

const router = Router();
const reportService = new ReportService();

router.get('/', async (_req, res) => {
  try {
    res.json(success(await reportService.overall()));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load reports';
    res.status(502).json(failure('REPORTS_UNAVAILABLE', message));
  }
});

export default router;