import { Router } from 'express';
import { getDb, getSetting, saveDb } from '../db.js';
import { calculateSavings } from '../services/eia.js';

const router = Router();

interface Ride {
  id: number;
  date: string;
  gas_price: number;
  distance: number;  // biking distance (actual miles ridden)
  driving_distance: number | null;  // for savings calculation
  savings: number;
  notes: string | null;
  weather: string | null;
  created_at: string;
}

// GET /api/rides - List all rides
router.get('/', (req, res) => {
  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  const rides: Ride[] = [];
  const stmt = db.prepare(`
    SELECT * FROM rides
    ORDER BY date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `);
  stmt.bind([limit, offset]);
  while (stmt.step()) {
    rides.push(stmt.getAsObject() as unknown as Ride);
  }
  stmt.free();

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM rides');
  countStmt.step();
  const total = (countStmt.getAsObject() as unknown as { count: number }).count;
  countStmt.free();

  res.json({
    rides,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// GET /api/rides/:id - Get single ride
router.get('/:id', (req, res) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM rides WHERE id = ?');
  stmt.bind([parseInt(req.params.id)]);

  if (stmt.step()) {
    const ride = stmt.getAsObject() as unknown as Ride;
    stmt.free();
    return res.json(ride);
  }

  stmt.free();
  return res.status(404).json({ error: 'Ride not found' });
});

// POST /api/rides - Log new ride
router.post('/', (req, res) => {
  try {
    const db = getDb();
    const { date, distance, driving_distance, notes, weather, gas_price } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!gas_price) {
      return res.status(400).json({ error: 'Gas price is required' });
    }

    // Get settings
    const defaultDistance = parseFloat(getSetting('default_distance') || '26');
    const mpg = parseFloat(getSetting('mpg') || '19');

    const rideDistance = distance ? parseFloat(distance) : defaultDistance;
    const drivingDist = driving_distance ? parseFloat(driving_distance) : null;
    const gasPrice = parseFloat(gas_price);

    // Calculate savings using driving distance if provided, otherwise use ride distance
    const savingsDistance = drivingDist ?? rideDistance;
    const savings = calculateSavings(savingsDistance, mpg, gasPrice);

    // Insert ride
    db.run(`
      INSERT INTO rides (date, gas_price, distance, driving_distance, savings, notes, weather)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [date, gasPrice, rideDistance, drivingDist, savings, notes || null, weather || null]);

    saveDb();

    // Get last inserted row
    const stmt = db.prepare('SELECT * FROM rides WHERE id = last_insert_rowid()');
    stmt.step();
    const ride = stmt.getAsObject() as unknown as Ride;
    stmt.free();

    res.status(201).json(ride);
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// PUT /api/rides/:id - Update a ride
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { date, distance, gas_price, notes, weather } = req.body;

  // Check if ride exists
  const checkStmt = db.prepare('SELECT * FROM rides WHERE id = ?');
  checkStmt.bind([id]);
  if (!checkStmt.step()) {
    checkStmt.free();
    return res.status(404).json({ error: 'Ride not found' });
  }
  checkStmt.free();

  // Recalculate savings if distance or gas_price changed
  const mpg = parseFloat(getSetting('mpg') || '19');
  const newDistance = distance ? parseFloat(distance) : undefined;
  const newGasPrice = gas_price ? parseFloat(gas_price) : undefined;

  // Get current values for recalculation
  const currentStmt = db.prepare('SELECT distance, gas_price FROM rides WHERE id = ?');
  currentStmt.bind([id]);
  currentStmt.step();
  const current = currentStmt.getAsObject() as unknown as { distance: number; gas_price: number };
  currentStmt.free();

  const finalDistance = newDistance ?? current.distance;
  const finalGasPrice = newGasPrice ?? current.gas_price;
  const savings = calculateSavings(finalDistance, mpg, finalGasPrice);

  db.run(`
    UPDATE rides
    SET date = COALESCE(?, date),
        distance = COALESCE(?, distance),
        gas_price = COALESCE(?, gas_price),
        savings = ?,
        notes = COALESCE(?, notes),
        weather = COALESCE(?, weather)
    WHERE id = ?
  `, [date || null, newDistance || null, newGasPrice || null, savings, notes ?? null, weather ?? null, id]);

  saveDb();

  // Return updated ride
  const stmt = db.prepare('SELECT * FROM rides WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  const ride = stmt.getAsObject() as unknown as Ride;
  stmt.free();

  res.json(ride);
});

// DELETE /api/rides/:id - Delete a ride
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  // Check if ride exists
  const checkStmt = db.prepare('SELECT id FROM rides WHERE id = ?');
  checkStmt.bind([id]);
  const exists = checkStmt.step();
  checkStmt.free();

  if (!exists) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  db.run('DELETE FROM rides WHERE id = ?', [id]);
  saveDb();

  res.status(204).send();
});

export default router;
