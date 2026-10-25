const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./src/routes/api');
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend Vite dev server (usually port 5173 or 3000)
app.use(cors());
app.use(express.json());

// Main API Router
app.use('/api', apiRoutes);

// Root health check endpoint
app.get('/', (req, res) => {
  res.json({
    system: 'ExamMatrix ERP',
    version: '1.0.0',
    status: 'ACTIVE',
    db_engine: db.getEngineStatus()
  });
});

app.listen(PORT, () => {
  console.log(`\n  ExamMatrix ERP Backend`);
  console.log(`  Server running on http://localhost:${PORT}`);
  console.log(`  Database: ${db.getEngineStatus().engineName}\n`);
});
