# Anuj's AI Assistant

A single-screen AI chat assistant that helps visitors learn about Anuj Ror, his story, projects, skills, and how to connect with him.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/anuj-ai-assistant run dev` — run the chat app (managed web workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `GROQ_API_KEY` — server-only Groq API key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/anuj-ai-assistant/src/App.tsx` — single-screen chat UI and localStorage state
- `artifacts/anuj-ai-assistant/src/index.css` — cream/navy visual theme and responsive chat styling
- `artifacts/anuj-ai-assistant/api/chat.js` — Vercel-compatible Groq handler
- `artifacts/anuj-ai-assistant/server.js` — Express + Vite server for Replit
- `artifacts/api-server/src/routes/chat.ts` — shared `/api/chat` route used by the Replit proxy

## Architecture decisions

- The browser only calls `/api/chat`; the shared API server owns that path in Replit, while the app-local handler keeps the same contract for Vercel.
- Chat history is intentionally local-only; no visitor messages are persisted server-side.
- Groq is requested with streaming enabled and the specified model first; if the key cannot access that model, the server retries with an accessible fallback model.

## Product

Visitors can ask about Anuj in English, Hindi, or Hinglish, use suggested questions, see markdown-formatted assistant replies, retry failed requests, start a new chat, and keep their local conversation across refreshes.

## User preferences

- Keep the experience to one chat screen with no landing page, sidebar, menu, or extra routes.

## Gotchas

- Keep `GROQ_API_KEY` server-side only; never expose it in the React bundle.
- The shared `/api` workflow must stay running for chat requests in the Replit preview.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
