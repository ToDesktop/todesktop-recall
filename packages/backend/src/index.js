require('dotenv').config();

const express = require('express');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 4000;
const recallApiBase = process.env.RECALL_API_BASE || 'https://us-west-2.recall.ai';
const recallApiToken = process.env.RECALL_API_TOKEN;
const corsOrigin = process.env.CORS_ORIGIN || '*';

if (!recallApiToken) {
  console.warn('Warning: RECALL_API_TOKEN is not set. Upload creation will fail until it is configured.');
}

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/create-sdk-upload', async (req, res) => {
  if (!recallApiToken) {
    return res.status(500).json({ error: 'RECALL_API_TOKEN is not configured' });
  }

  const payload = {};

  if (req.body && typeof req.body === 'object') {
    if (req.body.recording_config) {
      payload.recording_config = req.body.recording_config;
    }

    if (req.body.metadata) {
      payload.metadata = req.body.metadata;
    }
  }

  try {
    const response = await axios.post(
      `${recallApiBase}/api/v1/sdk_upload/`,
      payload,
      {
        headers: {
          Authorization: `Token ${recallApiToken}`
        }
      }
    );

    const { id, upload_token, recording_id } = response.data || {};
    res.json({ id, upload_token, recording_id });
  } catch (err) {
    const statusCode = err.response?.status || 500;
    const details = err.response?.data || err.message || 'Unknown error';
    console.error('Failed to create SDK upload:', details);
    res.status(statusCode).json({ error: 'Failed to create SDK upload', details });
  }
});

app.post('/webhooks/recall', (req, res) => {
  console.log('Received Recall webhook:', JSON.stringify(req.body, null, 2));
  res.status(204).end();
});

app.listen(port, () => {
  console.log(`Recall demo backend listening on http://localhost:${port}`);
});
