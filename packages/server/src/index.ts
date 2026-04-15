import express from "express";
import cors from "cors";
import path from "path";

// Import and initialize database
import { initDb } from "./db.js";

// Import routes
import ridesRouter from "./routes/rides.js";
import statsRouter from "./routes/stats.js";
import settingsRouter from "./routes/settings.js";
import gasPriceRouter from "./routes/gas-price.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/rides", ridesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/gas-price", gasPriceRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files in production
const clientPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// Initialize database and start server
async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
