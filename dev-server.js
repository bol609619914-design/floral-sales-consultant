import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
loadEnv();

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);

    if (url.pathname === '/api/chat' && req.method === 'POST') {
      await handleChat(req, res);
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return;
    }

    await serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Flora AI is running at http://localhost:${PORT}`);
});

async function handleChat(req, res) {
  if (!DEEPSEEK_API_KEY) {
    sendJson(res, 500, { error: 'Missing DEEPSEEK_API_KEY in .env' });
    return;
  }

  const body = await readJson(req);
  const userMessage = String(body.message || '').trim();
  if (!userMessage) {
    sendJson(res, 400, { error: 'Message is required' });
    return;
  }

  const scene = body.scene || null;
  const flowerRef = Array.isArray(body.flowerRef) ? body.flowerRef.slice(0, 20) : [];
  const scenes = Array.isArray(body.scenes) ? body.scenes.slice(0, 12) : [];

  const promptContext = {
    currentScene: scene,
    availableScenes: scenes.map((item) => ({
      id: item.id,
      name: item.name,
      brief: item.brief,
      customerAsk: item.customerAsk,
      flowers: item.flowers,
      scripts: item.scripts,
      tips: item.tips,
      avoid: item.avoid
    })),
    flowerReference: flowerRef
  };

  const upstream = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.55,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: [
            '你是 Flora AI，面向花店导购的中文销售话术教练。',
            '你的任务是根据场景、花材库和用户描述，给出可直接用于门店沟通的建议。',
            '回复必须简洁、具体、可执行，避免空泛鸡汤。',
            '优先输出：场景判断、推荐花材、顾客话术、追问问题、避坑提醒。',
            '如果用户在练习话术，你可以扮演顾客继续追问，也可以点评并改写。',
            '不要编造医疗功效，不要建议违法或冒犯习俗的表达。',
            '用 Markdown 回复，最多 5 个小段落。'
          ].join('\n')
        },
        {
          role: 'user',
          content: `训练资料 JSON：\n${JSON.stringify(promptContext)}\n\n用户输入：${userMessage}`
        }
      ]
    })
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error('DeepSeek error:', upstream.status, data);
    sendJson(res, upstream.status, {
      error: data.error?.message || 'DeepSeek request failed'
    });
    return;
  }

  sendJson(res, 200, {
    reply: data.choices?.[0]?.message?.content || '我暂时没有生成出有效回复，请换一种描述再试。'
  });
}

async function serveStatic(pathname, res) {
  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = normalize(join(root, requested));
  if (!filePath.startsWith(root)) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(content);
  } catch {
    sendJson(res, 404, { error: 'Not found' });
  }
}

function loadEnv() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}
