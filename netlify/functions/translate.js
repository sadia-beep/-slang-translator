export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const { text, direction } = JSON.parse(event.body || "{}");

  if (!text || !text.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "No text provided" }) };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server missing GROQ_API_KEY" }),
    };
  }

  const isToFormal = direction !== "toSlang";

  const systemPrompt = isToFormal
    ? `You translate Gen-Z slang / internet "brainrot" text into polished, professional formal English suitable for a workplace email. Keep the original meaning exactly. Do not add commentary. Respond ONLY with strict JSON in this shape: {"translated": "...", "slangTermsFound": ["term1", "term2"]} where slangTermsFound lists the slang/informal terms you detected and replaced (lowercase, no duplicates).`
    : `You translate formal, professional English into current Gen-Z slang / internet "brainrot" style, playful and casual. Keep the original meaning exactly. Do not add commentary. Respond ONLY with strict JSON in this shape: {"translated": "...", "slangTermsFound": []}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Groq API error", detail: errText }) };
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { translated: raw, slangTermsFound: [] };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
