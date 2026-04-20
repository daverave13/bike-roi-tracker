import { Router } from "express";
import { getDb } from "../db.js";

const router = Router();

// GET /api/stats - Get aggregate statistics
router.get("/", (req, res) => {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total_rides,
      COALESCE(SUM(savings), 0) as total_savings,
      COALESCE(SUM(distance), 0) as total_distance,
      COALESCE(SUM(driving_distance), 0) as total_driving_distance,
      COALESCE(AVG(savings), 0) as avg_savings,
      COALESCE(AVG(gas_price), 0) as avg_gas_price
    FROM rides
  `);
  stmt.step();
  const stats = stmt.getAsObject() as unknown as {
    total_rides: number;
    total_savings: number;
    total_distance: number;
    total_driving_distance: number;
    avg_savings: number;
    avg_gas_price: number;
  };
  stmt.free();

  // Round values for cleaner output
  res.json({
    totalRides: stats.total_rides,
    totalSavings: Math.round(stats.total_savings * 100) / 100,
    totalDistance: Math.round(stats.total_distance * 10) / 10,
    totalDrivingDistance: Math.round(stats.total_driving_distance * 10) / 10,
    avgSavings: Math.round(stats.avg_savings * 100) / 100,
    avgGasPrice: Math.round(stats.avg_gas_price * 100) / 100,
  });
});

export default router;
