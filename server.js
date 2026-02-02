#!/usr/bin/env node

/**
 * Simple Express server for Mission Control
 * Handles data persistence to data.json
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// GET /api/data - Load tasks
app.get('/api/data', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// POST /api/data - Save tasks
app.post('/api/data', async (req, res) => {
  try {
    const data = req.body;
    data.meta.lastSync = new Date().toISOString();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, lastSync: data.meta.lastSync });
  } catch (error) {
    console.error('Error writing data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Export backup
app.get('/api/export', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Disposition', `attachment; filename=mission-control-backup-${timestamp}.json`);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Mission Control server running at http://localhost:${PORT}`);
  console.log(`📊 Data file: ${DATA_FILE}`);
});
