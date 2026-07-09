export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: ANTHROPIC_API_KEY not set' });

  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: 'You are a senior private equity operating partner and revenue excellence expert. You evaluate portfolio companies through the CREATE. WIN. GROW. framework with the analytical rigor of a top-tier PE firm. Return only valid JSON with no markdown fences and no text outside the JSON object.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const rawText = await response.text();
    if (!response.ok) return res.status(response.status).json({ error: `Anthropic API error: ${response.status}`, detail: rawText.slice(0, 1000) });

    const data = JSON.parse(rawText);
    const content = (data.content || []).map(b => b.text || '').join('');
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown server error' });
  }
}
