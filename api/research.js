export default async function handler(req, res) {
  const serverKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";

  if (req.method === "GET") {
    return res.status(200).json({ configured: Boolean(serverKey) });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const clientKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const apiKey = clientKey || serverKey;

  if (!apiKey) {
    return res.status(400).json({
      error: "No Google AI API key configured on Vercel (GEMINI_API_KEY) or provided in the panel."
    });
  }
  if (!prompt) {
    return res.status(400).json({ error: "Missing research prompt." });
  }

  // Try current Gemini Flash models in order (matching Curie's gemini-3.8-flash default).
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite"
  ].filter((m, i, arr) => Boolean(m) && arr.indexOf(m) === i);

  let lastStatus = 500;
  let lastError = "Failed to reach Google AI.";
  const attempts = [];

  for (const model of models) {
    try {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }]
          })
        }
      );

      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        const detail = (data && data.error && data.error.message) || "";
        lastStatus = upstream.status;
        lastError =
          "The Google AI request failed (HTTP " +
          upstream.status +
          ")" +
          (detail ? ": " + detail : ".");
        attempts.push({ model, status: upstream.status, detail: detail.slice(0, 180) });
        // Retry next candidate model on 404 (not found) or 429 (quota/rate limit) or 503 (overloaded).
        if (upstream.status === 404 || upstream.status === 429 || upstream.status === 503) {
          continue;
        }
        return res.status(upstream.status).json({ error: lastError, attempts });
      }

      const cand = data && data.candidates && data.candidates[0];
      const parts = (cand && cand.content && cand.content.parts) || [];
      const text = parts.map((p) => p.text || "").join("\n").trim();
      if (!text) {
        lastStatus = 502;
        lastError = "The agent returned an empty answer. Try again, or rephrase the topic.";
        continue;
      }

      const chunks = (cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || [];
      const seen = new Set();
      const sources = [];
      for (const c of chunks) {
        const web = c && c.web;
        if (web && web.uri && !seen.has(web.uri)) {
          seen.add(web.uri);
          sources.push({ title: web.title || web.uri, uri: web.uri });
        }
      }

      return res.status(200).json({ text, sources, model });
    } catch (err) {
      lastStatus = 500;
      lastError = (err && err.message) || "Failed to reach Google AI.";
    }
  }

  return res.status(lastStatus).json({ error: lastError, attempts });
}
