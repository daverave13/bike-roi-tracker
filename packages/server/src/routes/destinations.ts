import { Router } from 'express';
import { getDb, saveDb } from '../db.js';

const router = Router();

interface Destination {
  id: number;
  title: string;
  distance: number;  // driving distance
  biking_distance: number | null;
}

// GET /api/destinations - List all destinations
router.get('/', (req, res) => {
  const db = getDb();
  const destinations: Destination[] = [];
  const stmt = db.prepare('SELECT * FROM destinations ORDER BY title');
  while (stmt.step()) {
    destinations.push(stmt.getAsObject() as unknown as Destination);
  }
  stmt.free();
  res.json(destinations);
});

// POST /api/destinations - Create new destination
router.post('/', (req, res) => {
  const db = getDb();
  const { title, distance, biking_distance } = req.body;

  if (!title || !distance) {
    return res.status(400).json({ error: 'Title and distance are required' });
  }

  db.run(
    'INSERT INTO destinations (title, distance, biking_distance) VALUES (?, ?, ?)',
    [title, parseFloat(distance), biking_distance ? parseFloat(biking_distance) : null]
  );
  saveDb();

  const stmt = db.prepare('SELECT * FROM destinations WHERE id = last_insert_rowid()');
  stmt.step();
  const destination = stmt.getAsObject() as unknown as Destination;
  stmt.free();

  res.status(201).json(destination);
});

// PUT /api/destinations/:id - Update a destination
router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { title, distance, biking_distance } = req.body;

  const checkStmt = db.prepare('SELECT id FROM destinations WHERE id = ?');
  checkStmt.bind([id]);
  const exists = checkStmt.step();
  checkStmt.free();

  if (!exists) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  db.run(
    `UPDATE destinations
     SET title = COALESCE(?, title),
         distance = COALESCE(?, distance),
         biking_distance = COALESCE(?, biking_distance)
     WHERE id = ?`,
    [
      title || null,
      distance ? parseFloat(distance) : null,
      biking_distance !== undefined ? (biking_distance ? parseFloat(biking_distance) : null) : null,
      id
    ]
  );
  saveDb();

  const stmt = db.prepare('SELECT * FROM destinations WHERE id = ?');
  stmt.bind([id]);
  stmt.step();
  const destination = stmt.getAsObject() as unknown as Destination;
  stmt.free();

  res.json(destination);
});

// DELETE /api/destinations/:id - Delete a destination
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);

  const checkStmt = db.prepare('SELECT id FROM destinations WHERE id = ?');
  checkStmt.bind([id]);
  const exists = checkStmt.step();
  checkStmt.free();

  if (!exists) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  db.run('DELETE FROM destinations WHERE id = ?', [id]);
  saveDb();

  res.status(204).send();
});

export default router;
