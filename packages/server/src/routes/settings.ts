import { Router } from 'express';
import { getAllSettings, setSetting } from '../db.js';

const router = Router();

// GET /api/settings - Get all settings
router.get('/', (req, res) => {
  const settings = getAllSettings();
  res.json(settings);
});

// PUT /api/settings - Update settings
router.put('/', (req, res) => {
  const allowedKeys = ['default_distance', 'mpg', 'eia_api_key'];
  const updates: Record<string, string> = {};

  for (const key of allowedKeys) {
    if (req.body[key] !== undefined) {
      setSetting(key, String(req.body[key]));
      updates[key] = String(req.body[key]);
    }
  }

  res.json({ updated: updates });
});

export default router;
