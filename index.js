require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const Database = require('@replit/database');
const path = require('path');
const EgaugeClient = require('./lib/egauge-client');

const app = express();
const db = new Database();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const egauge = new EgaugeClient({
  host: process.env.EGAUGE_HOST,
  username: process.env.EGAUGE_USERNAME,
  password: process.env.EGAUGE_PASSWORD
});

// Proxy to eGauge API
app.use('/api/egauge', async (req, res) => {
  try {
    const response = await egauge.proxy(req.originalUrl.replace('/api/egauge', ''));
    res.json(response);
  } catch (err) {
    console.error('eGauge proxy error:', err.message);
    res.status(500).json({ error: 'eGauge proxy failed' });
  }
});

app.get('/api/config', async (req, res) => {
  const config = await db.get('config');
  res.json(config || {});
});

app.post('/api/config', async (req, res) => {
  await db.set('config', req.body);
  res.json({ ok: true });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('client connected');
  let timer;

  const sendData = async () => {
    try {
      const power = await egauge.getCurrentPower();
      ws.send(JSON.stringify({ power }));
    } catch (err) {
      ws.send(JSON.stringify({ error: 'Unable to fetch power' }));
    }
  };

  timer = setInterval(sendData, 1000);
  sendData();

  ws.on('close', () => {
    clearInterval(timer);
    console.log('client disconnected');
  });
});
