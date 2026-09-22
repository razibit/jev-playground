# Jev Playground

A compact, three-pane playground for running Jev evaluations with typed questions and probability output.

## Local development

1. Install Node.js 22 or newer.
2. Add `AI_GATEWAY_API_KEY` to the ignored `.env.local` file in the project root. The key is read by the local Node server only; never use a `VITE_` variable.
3. Run `npm install` and `npm run dev`.
4. Open <http://127.0.0.1:5173>.

`npm run dev` starts Vite and the local Express API. The API reads `.env.local` on request and sends Jev calls from the server to Vercel AI Gateway. `npm run build` type-checks the app and creates the static client in `dist`. `npm start` serves that build and the local API on port 4173.

## Deploy to Vercel

Create a public GitHub repository and import it into Vercel with these project settings:

| Setting | Value |
| --- | --- |
| Repository | `razibit/jev-playground` |
| Project name | `jev-playground` |
| Framework Preset | `Vite` |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

Add `AI_GATEWAY_API_KEY` in Vercel’s Environment Variables form and paste the value in the Vercel dashboard. Select **Production** and **Preview**. The deployment includes server functions at `/api/evaluate` and `/api/status`; the key remains server-side. Never commit `.env.local` or set a `VITE_` key.

## Playground

Four editable starting scenarios are included: support triage, content moderation, agent next step, and resume screening. Each evaluation can contain up to 12 Boolean, Choice, or Score questions. Recent evaluations are saved in the browser’s local storage and can be exported as JSON.

Jev requests use `typesafe-ai/jev` through `POST https://ai-gateway.vercel.sh/v1/evaluate`. The local Express routes and Vercel Functions share the same validation and Gateway request handler.
