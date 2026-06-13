const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!DEEPSEEK_API_KEY) {
    res.status(500).json({ error: 'Missing DEEPSEEK_API_KEY' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const userMessage = String(body.message || '').trim();
  if (!userMessage) {
    res.status(400).json({ error: 'Message is required' });
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

  try {
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
      res.status(upstream.status).json({
        error: data.error?.message || 'DeepSeek request failed'
      });
      return;
    }

    res.status(200).json({
      reply: data.choices?.[0]?.message?.content || '我暂时没有生成出有效回复，请换一种描述再试。'
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
};
