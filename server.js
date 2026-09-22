import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { evaluate, MODEL } from "./src/server/evaluate.js";

const app = express();
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, "dist");
app.use(express.json({ limit: "128kb" }));
app.use(express.static(output));

async function localKey() {
  if (process.env.AI_GATEWAY_API_KEY) return process.env.AI_GATEWAY_API_KEY;
  try {
    const localEnv = await readFile(path.join(root, ".env.local"), "utf8");
    return localEnv.match(/^\s*AI_GATEWAY_API_KEY\s*=\s*(.*?)\s*$/m)?.[1]?.replace(/^['"]|['"]$/g, "") || "";
  } catch { return ""; }
}

app.get("/api/status", async (_req, res) => res.json({ configured: Boolean(await localKey()), model: MODEL }));
app.all("/api/evaluate", async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const result = await evaluate(req.body, await localKey());
  res.status(result.status).json(result.body);
});
app.get("*splat", (_req, res) => res.sendFile(path.join(output, "index.html")));

const port = Number(process.env.PORT || 4173);
app.listen(port, "127.0.0.1", () => console.log(`Jev Playground listening at http://127.0.0.1:${port}`));
