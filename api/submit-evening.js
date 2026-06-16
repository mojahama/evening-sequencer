const crypto = require('crypto');

const MAX_BODY_BYTES = 64 * 1024;
const ALLOWED_ORIGINS = new Set([
  'https://mojahama.github.io',
  'https://mojahama.github.io/evening-sequencer',
]);

function send(res, status, body, origin) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function normalizePayload(input) {
  const fields = input && typeof input === 'object' ? input.fields || {} : {};
  return {
    source: 'evening-sequencer-web',
    version: 1,
    event_type: 'evening-sequencer.submitted',
    submittedAt: new Date().toISOString(),
    pageUrl: input.pageUrl || '',
    fields: {
      gratitude: String(fields.gratitude || '').slice(0, 4000),
      excited: String(fields.excited || '').slice(0, 4000),
      positiveFrame: String(fields.positiveFrame || '').slice(0, 4000),
      workWise: String(fields.workWise || '').slice(0, 4000),
      forMyself: String(fields.forMyself || '').slice(0, 4000),
      journalNotes: String(fields.journalNotes || '').slice(0, 12000),
      energy: String(fields.energy || '').slice(0, 80),
      body: String(fields.body || '').slice(0, 4000),
      morningYogaWindow: String(fields.morningYogaWindow || '').slice(0, 1000),
      constraints: String(fields.constraints || '').slice(0, 4000),
    },
  };
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin;
  const allowOrigin = origin && (ALLOWED_ORIGINS.has(origin) || /https:\/\/evening-sequencer.*\.vercel\.app$/.test(origin)) ? origin : '';

  if (req.method === 'OPTIONS') return send(res, 204, {}, allowOrigin);
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' }, allowOrigin);

  const hermesUrl = process.env.HERMES_WEBHOOK_URL;
  const hermesSecret = process.env.HERMES_WEBHOOK_SECRET;
  if (!hermesUrl || !hermesSecret) {
    return send(res, 503, { error: 'Hermes webhook is not configured yet' }, allowOrigin);
  }

  let parsed;
  try {
    const raw = await getRawBody(req);
    parsed = JSON.parse(raw.toString('utf8') || '{}');
  } catch (err) {
    return send(res, err.statusCode || 400, { error: err.message || 'Invalid JSON' }, allowOrigin);
  }

  const payload = normalizePayload(parsed);
  const body = Buffer.from(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', hermesSecret).update(body).digest('hex');
  const requestId = crypto.randomUUID();

  try {
    const response = await fetch(hermesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Request-ID': requestId,
      },
      body,
    });

    const text = await response.text();
    let responseBody;
    try { responseBody = JSON.parse(text); } catch (_) { responseBody = { body: text }; }

    return send(res, response.ok ? 202 : 502, {
      status: response.ok ? 'accepted' : 'hermes_error',
      hermesStatus: response.status,
      requestId,
      hermes: responseBody,
    }, allowOrigin);
  } catch (err) {
    return send(res, 502, { error: 'Failed to reach Hermes webhook', detail: err.message, requestId }, allowOrigin);
  }
};
