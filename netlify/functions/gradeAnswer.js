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
        content: `Te egy igazságos magyar nyelvi felvételi javító vagy. Dönts, hogy a diák válasza elfogadható-e.

Feladat: ${instruction}
Helyes válasz: ${correctAnswer}
Elfogadható variánsok / megjegyzés: ${explanation || 'nincs'}
Diák válasza: ${studentAnswer}

Fontos szabályok az értékeléshez:
- A kis- és nagybetű különbsége ne számítson (pl. "IGAZ" = "igaz" = "I")
- A névelő (a/az) hiánya vagy megléte ne számítson (pl. "csillagok" = "a csillagok")
- Ha a helyes válasz több alternatívát tartalmaz (pl. "tört vagy elem"), bármelyik elfogadható
- Ha a feladat halmazból való választást kér (pl. 5 szám közül 5-öt), a diák válasza pontot kap, ha szerepel a helyes halmazban
- Ha a diák a betűjel helyett a szót írta (pl. "piramis" a "B" helyett), fogadd el, ha a tartalom helyes
- Fogadj el rokon értelmű szavakat és toldalékváltozatokat, ha a tartalom egyértelmű

Válaszolj KIZÁRÓLAG ebben a JSON formátumban, semmi más:
{"score": 0 vagy 1, "feedback": "max 2 mondatos magyar visszajelzés"}`
      }]
    });

    const raw = message.content[0].text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(raw);
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
      body: JSON.stringify({ score: 0, feedback: 'Az értékelés sikertelen, kérlek ellenőrizd magad.' })
    };
  }
};
