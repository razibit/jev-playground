import { MODEL } from "../src/server/evaluate.js";

type ApiResponse = { status: (code: number) => { json: (body: unknown) => unknown } };

export default function handler(_req: unknown, res: ApiResponse) {
  return res.status(200).json({ configured: Boolean(process.env.AI_GATEWAY_API_KEY), model: MODEL });
}
