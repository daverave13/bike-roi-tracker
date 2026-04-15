# Bike ROI Tracker - Architecture

## Tech Stack
- **Monorepo**: npm workspaces
- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via sql.js (pure JavaScript, no native compilation needed)
- **Charts**: Chart.js

## Project Structure
```
bike-roi-tracker/
├── package.json                 # Root workspace config
├── packages/
│   ├── client/                  # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/      # React components
│   │   │   ├── hooks/           # API hooks
│   │   │   └── App.tsx
│   │   └── dist/                # Production build output
│   └── server/                  # Express backend
│       ├── src/
│       │   ├── routes/          # API route handlers
│       │   ├── services/        # Gas price fetching
│       │   ├── db.ts            # SQLite setup
│       │   └── index.ts         # Express app
│       └── dist/                # Compiled JS
└── data/
    └── bike-roi.db              # SQLite database file
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rides | List all rides |
| POST | /api/rides | Create new ride |
| PUT | /api/rides/:id | Update a ride |
| DELETE | /api/rides/:id | Delete a ride |
| GET | /api/stats | Get aggregate statistics |
| GET | /api/gas-price | Fetch current gas price (GasBuddy) |
| GET | /api/settings | Get app settings |
| PUT | /api/settings | Update settings |

## Build & Run
```bash
# Install dependencies
npm install

# Development (runs both client & server)
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Environment
- **PORT**: Server port (default: 3000)
- No other env vars required

## Hosting Requirements
- Node.js 18+
- Single process serves both API and static frontend
- SQLite database file needs persistent storage (`/data/bike-roi.db`)
- No external database or services required
- Stateless except for SQLite file

## Production Deployment Notes
1. Run `npm run build` to compile TypeScript and build React
2. Server serves static files from `packages/client/dist/`
3. All routes fall through to `index.html` for client-side routing
4. Database auto-creates on first run
5. Ensure `/data/` directory has write permissions
