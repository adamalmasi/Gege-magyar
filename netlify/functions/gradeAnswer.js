// netlify/functions/gradeAnswer.js
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

  const { studentAnswer, correctAnswer, explanation, instruction } = body;
  if (!studentAnswer || !correctAnswer) {
    return { statusCode: 400, body: JSON.stringify({ score: 0, feedback: 'Hiányzó adat.' }) };
  }

  const client = new Anthropic({ apiKey: process.env.gege_magyar_API });

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Te egy szigorú, de igazságos magyar nyelvi felvételi javító vagy. Dönts, hogy a diák válasza szemantikailag egyenértékű-e a helyes válasszal.

Feladat: ${instruction}
Helyes válasz: ${correctAnswer}
Elfogadható variánsok / megjegyzés: ${explanation || 'nincs'}
Diák válasza: ${studentAnswer}

Válaszolj KIZÁRÓLAG ebben a JSON formátumban, semmi más:
{"score": 0 vagy 1, "feedback": "max 2 mondatos magyar visszajelzés"}`
      }]
    });

    const result = JSON.parse(message.content[0].text);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (err) {
    console.error('gradeAnswer error:', err.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 0, feedback: `Hiba: ${err.message}` })
    };
  }
};
