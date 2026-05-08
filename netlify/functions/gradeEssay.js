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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Te egy szigorú, de igazságos magyar felvételi fogalmazás-javító vagy. Értékeld az alábbi fogalmazást a megadott rubrika szerint.

Téma: ${essayPrompt}

Rubrika:
${rubricText}

Diák fogalmazása:
${studentText}

Válaszolj KIZÁRÓLAG ebben a JSON formátumban, semmi más:
{
  "dimensions": {
    "tartalom": <0-3>,
    "szerkezet": <0-3>,
    "stílus": <0-1>,
    "helyesírás": <0-2>,
    "külalak": <0-1>
  },
  "totalScore": <összeg>,
  "feedback": "2-3 mondatos összefoglaló visszajelzés magyarul"
}`
      }]
    });

    const result = JSON.parse(message.content[0].text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: { tartalom: 0, szerkezet: 0, stílus: 0, helyesírás: 0, külalak: 0 },
        totalScore: 0,
        feedback: 'Az értékelés sikertelen, kérlek próbáld újra.'
      })
    };
  }
};
