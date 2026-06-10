import { Router } from 'express';
import { AnalyticsService } from './analytics.service.js';

const router = Router();

router.get('/dashboard-stats', async (req, res) => {
  try {
    const data = await AnalyticsService.getDashboardStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/turnover', async (req, res) => {
  try {
    const data = await AnalyticsService.getTurnoverData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch turnover data' });
  }
});

router.get('/attendance-heatmap', async (req, res) => {
  try {
    const data = await AnalyticsService.getAttendanceHeatmap();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

router.get('/cost-prediction', async (req, res) => {
  try {
    const data = await AnalyticsService.getCostPrediction();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cost predictions' });
  }
});

router.get('/turnover-breakdown', async (req, res) => {
  try {
    const data = await AnalyticsService.getTurnoverBreakdown();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch turnover breakdown' });
  }
});

export default router;
