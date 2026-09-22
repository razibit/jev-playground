const ENDPOINT = "https://ai-gateway.vercel.sh/v1/evaluate";
const MODEL = "typesafe-ai/jev";

export function validatePayload(payload) {
  const { state, questions } = payload ?? {};
  if (!(typeof state === "string" || (state && typeof state === "object")) || !questions || typeof questions !== "object" || Array.isArray(questions) || !Object.keys(questions).length) {
    return "Provide a state and at least one named question.";
  }
  if (typeof state === "string" && state.length > 50000) return "State must be at most 50,000 characters.";
  if (Object.keys(questions).length > 12) return "Use at most 12 questions per evaluation.";
  for (const [name, question] of Object.entries(questions)) {
    if (!/^[a-zA-Z][\w-]{0,63}$/.test(name) || !question || !["boolean", "choice", "score"].includes(question.type) || typeof question.instructions !== "string" || !question.instructions.trim()) {
      return `Question "${name}" needs a valid name, type (boolean/choice/score), and instructions.`;
    }
    if (question.type === "choice" && (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 20 || question.options.some((option) => typeof option !== "string" || !option.trim()))) return `Question "${name}" needs 2 to 20 non-empty options.`;
    if (question.type === "score" && (!Array.isArray(question.scale) || question.scale.length < 2 || question.scale.length > 20 || question.scale.some((entry) => typeof entry !== "string" || !entry.trim()))) return `Question "${name}" needs a scale with 2 to 20 non-empty entries.`;
  }
  return null;
}

export async function evaluate(payload, apiKey) {
  const validationError = validatePayload(payload);
  if (validationError) return { status: 400, body: { error: validationError } };
  if (!apiKey) return { status: 503, body: { error: "AI Gateway is not configured. Set AI_GATEWAY_API_KEY in the server environment." } };

  const gatewayQuestions = Object.fromEntries(Object.entries(payload.questions).map(([name, question]) => {
    if (question.type === "choice") return [name, { type: "choice", instructions: question.instructions, criteria: Object.fromEntries(question.options.map((option) => [option, null])) }];
    if (question.type === "score") return [name, { type: "score", instructions: question.instructions, criteria: question.scale }];
    return [name, { type: "boolean", instructions: question.instructions }];
  }));

  const started = Date.now();
  try {
    const upstream = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, state: payload.state, questions: gatewayQuestions }),
      signal: AbortSignal.timeout(55000),
    });
    const response = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return { status: upstream.status, body: { error: response.error?.message || response.message || `Vercel AI Gateway returned HTTP ${upstream.status}` } };
    return { status: 200, body: { result: response, elapsedMs: Date.now() - started } };
  } catch (error) {
    return { status: 502, body: { error: error?.name === "TimeoutError" ? "Request timed out after 55 seconds." : "Could not reach Vercel AI Gateway." } };
  }
}

export { MODEL };
