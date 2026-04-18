import { Router } from 'express';
import { getGasPrice } from '../services/eia.js';

const router = Router();

// GET /api/gas-price - Get current gas price from EIA
router.get('/', async (req, res) => {
  try {
    const price = await getGasPrice();

    if (price === null) {
      return res.status(503).json({
        error: 'Could not fetch gas price. Please configure your EIA API key in Settings.'
      });
    }

    res.json({ price, unit: 'USD/gallon' });
  } catch (error) {
    console.error('Error fetching gas price:', error);
    res.status(500).json({ error: 'Failed to fetch gas price' });
  }
});

export default router;
