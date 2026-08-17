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

  const glossary = `
GLOSSARY (use these actual meanings, not literal word meanings):
- "aura" / "aura points" = one's overall vibe, presence, confidence, or reputation (e.g. "that took away his aura" = that made him look less impressive/confident)
- "ate" / "ate that" = did something excellently, performed impressively
- "no cap" / "cap" = no lie / a lie (e.g. "that's cap" = that's false)
- "fr" / "fr fr" = for real, seriously
- "cooked" = in serious trouble, doomed, exhausted
- "mid" = mediocre, unimpressive
- "bussin" = really good (usually food, but can extend to anything)
- "rizz" = charisma, ability to attract others
- "sus" = suspicious
- "slaps" / "hits different" = is excellent, exceptionally good
- "lowkey" / "highkey" = somewhat / very, low-key or openly
- "bet" = okay, agreed, sure
- "based" = admirable for being authentic/unapologetic
- "npc" = someone acting mindless or scripted, lacking individuality
- "delulu" = delusional (usually self-aware, playful)
- "goated" = greatest of all time, exceptional
- "ick" = sudden feeling of being turned off/repulsed by someone
- "main character energy" = confidently acting like the center of attention
- "living rent free" = something someone can't stop thinking about
- "the vibes are off/not it" = the mood or feeling is bad
- "glow up" = a positive transformation, especially appearance/confidence
- "ghosted" = suddenly cut off all communication with someone
- "salty" = bitter, upset over something minor
- "we're so back" = things are improving / good again
- "it's giving [X]" = it has the energy/vibe of X
`;

  const systemPrompt = isToFormal
    ? `You translate Gen-Z slang / internet "brainrot" text into polished, professional formal English suitable for a workplace email. You must translate the ACTUAL MEANING of slang terms, never their literal dictionary definition — for example "he thought he ate" means "he believed he had performed excellently," NOT anything about literal eating. CRITICAL RULE: every single slang, informal, or internet-brainrot word or phrase in the input must be replaced with its formal equivalent in the output — never leave a slang word sitting untranslated in the final sentence, even if it isn't in the glossary below; use your best judgment for its formal meaning. The output should read as fully professional English with zero slang remaining. Use the glossary for reference and apply the same logic to slang terms not listed. Keep the original intent and tone exactly. Do not add commentary.
${glossary}
EXAMPLES:
Input: "bro thought he ate with that presentation"
Correct: "He believed his presentation was excellent."
WRONG (do not do this): "He believed he had eaten during his presentation."

Input: "Chat, deploy the emergency aura"
Correct: "Team, please activate the emergency confidence protocol."
WRONG (do not do this): "Please initiate the emergency aura." (leaves "aura" untranslated)

Respond ONLY with strict JSON in this shape: {"translated": "...", "slangTermsFound": ["term1", "term2"]} where slangTermsFound lists the slang/informal terms you detected and replaced (lowercase, no duplicates).`
    : `You translate formal, professional English into current Gen-Z slang / internet "brainrot" style, playful and casual. Use real, currently-used slang (see glossary below for style reference) rather than outdated or made-up slang. Keep the original meaning and intent exactly. Do not add commentary.
${glossary}
Respond ONLY with strict JSON in this shape: {"translated": "...", "slangTermsFound": []}`;

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
        temperature: 0.4,
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
