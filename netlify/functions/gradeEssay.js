// netlify/functions/gradeEssay.js
const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { studentText, prompt: essayPrompt, checklist } = body;

  if (!studentText || studentText.trim().length < 20) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: { tartalom: 0, szerkezet: 0, stílus: 0, helyesírás: 0, külalak: 0 },
        totalScore: 0,
        feedback: 'A fogalmazás túl rövid az értékeléshez.'
      })
    };
  }

  const rubricText = (checklist || [])
    .map(item => `- ${item.label} (max ${item.maxPoints} pont)`)
    .join('\n');

  const client = new Anthropic({ apiKey: process.env.gege_magyar_API });

  const dimensionKeys = (checklist || []).map(item => {
    const label = item.label.trim();
    const colonIdx = label.indexOf(':');
    const commaIdx = label.indexOf(',');
    const end = [colonIdx, commaIdx].filter(i => i > 0).sort((a, b) => a - b)[0] ?? label.length;
    return label.slice(0, end).toLowerCase();
  });
  const dimensionTemplate = dimensionKeys.map(k => `    "${k}": <0-${(checklist.find(c => c.label.toLowerCase().startsWith(k)) || {}).maxPoints ?? '?'}>`).join(',\n');

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Te egy igazságos magyar felvételi fogalmazás-javító vagy. Értékeld az alábbi fogalmazást a megadott rubrika szerint.

Téma: ${essayPrompt}

Rubrika:
${rubricText}

Diák fogalmazása:
${studentText}

Válaszolj KIZÁRÓLAG ebben a JSON formátumban, semmi más (a kulcsok pontosan így legyenek):
{
  "dimensions": {
${dimensionTemplate}
  },
  "totalScore": <összeg>,
  "feedback": "2-3 mondatos összefoglaló visszajelzés magyarul"
}`
      }]
    });

    const raw = message.content[0].text
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    console.log('gradeEssay raw response:', raw);
    const result = JSON.parse(raw);

    // Validate and recompute totalScore from dimensions to catch AI arithmetic errors
    const recomputed = Object.entries(result.dimensions || {})
      .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);
    result.totalScore = recomputed;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('gradeEssay error:', err.message);
    const emptyDims = Object.fromEntries(dimensionKeys.map(k => [k, 0]));
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: emptyDims,
        totalScore: 0,
        feedback: 'Az értékelés sikertelen, kérlek próbáld újra.'
      })
    };
  }
};
