const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');
require('dotenv').config();
const graphRoutes = require('./routes/graphRoutes');
const { driver } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', graphRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

process.on('SIGINT', async () => {
  await driver.close();
  process.exit(0);
});
