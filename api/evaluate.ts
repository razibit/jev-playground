import { evaluate } from "../src/server/evaluate.js";

type ApiRequest = { method?: string; body?: unknown };
type ApiResponse = { status: (code: number) => { json: (body: unknown) => unknown } };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const result = await evaluate(req.body, process.env.AI_GATEWAY_API_KEY);
  return res.status(result.status).json(result.body);
}
