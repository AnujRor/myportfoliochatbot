# Anuj's AI Assistant — Portfolio Chatbot

A single-screen AI chat assistant that helps visitors learn about **Anuj Ror** — his story, projects, skills and how to get in touch. Visitors can ask questions in **English, Hindi or Hinglish** and get warm, markdown-formatted answers grounded in a verified portfolio source.

---

## ✨ Features

- 💬 **Single-screen chat UI** — no landing page, sidebar or extra routes; just a fast, focused conversation.
- 🌐 **Multilingual replies** — answers in the same language the visitor uses (English / Hindi / Hinglish).
- 🧠 **Grounded answers only** — the assistant is restricted to a verified portfolio source, so it won't invent projects, links or contact details.
- 🎯 **Suggested questions** — one-tap starters like _"Anuj kaun hai?"_ and _"Saare projects dikhao"_.
- 🔁 **Retry & new chat** — recover from failed requests or start a fresh conversation.
- 💾 **Local-only history** — the conversation is saved in `localStorage`; nothing is persisted server-side.
- ⚡ **Streaming from Groq** — responses stream from Groq and are returned as a single validated reply.
- 🛟 **Resilient by design** — automatic retry on transient errors, with a fallback model if the primary model is unavailable.

---

## 🏗️ Project Structure

This is a **pnpm workspace** monorepo:

| Path | Description |
| --- | --- |
| `artifacts/anuj-ai-assistant/` | The React + Vite chat frontend, plus the Vercel-compatible `api/chat.js` handler and the Express dev server (`server.js`). |
| `artifacts/api-server/` | Express 5 API server hosting the shared `/api/chat` and `/api/healthz` routes (used by the Replit proxy). |
| `artifacts/mockup-sandbox/` | Sandbox app for quickly previewing UI mockups and shared components. |
| `lib/api-spec/` | OpenAPI spec plus Orval config for generating API clients and Zod schemas. |
| `lib/api-client-react/` | Generated React Query client and fetch wrapper. |
| `lib/api-zod/` | Generated Zod validation schemas. |
| `scripts/` | Workspace helper scripts. |

### Request flow

```
Browser  ──POST /api/chat──▶  /api/chat route
                              ├─ Replit  →  api-server (Express)
                              └─ Vercel  →  api/chat.js (serverless function)
                                        │
                                        ▼
                              Groq Chat Completions API
                        llama-3.3-70b-versatile (fallback: openai/gpt-oss-120b)
```

The browser **only** talks to `/api/chat`; the API key never reaches the client bundle.

---

## 🧰 Tech Stack

- **Runtime:** Node.js 24, TypeScript 5.9
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Radix UI, Framer Motion, TanStack Query, Wouter
- **Backend:** Express 5, Pino logging, esbuild (CJS bundle)
- **AI:** Groq Chat Completions API (streaming)
- **Validation & codegen:** Zod (`zod/v4`), Orval (from OpenAPI)
- **Package manager:** pnpm workspaces
- **Deployment:** Vercel + Replit

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 24+**
- **pnpm** (`npm install -g pnpm`)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env` (or set the variable in your host) with:

| Variable | Required | Description |
| --- | --- | --- |
| `GROQ_API_KEY` | ✅ | Server-only Groq API key used by `/api/chat`. Never expose it to the browser. |
| `PORT` | For `api-server` | Port the shared API server listens on (e.g. `5000`). |

### 3. Run the chat app

```bash
pnpm --filter @workspace/anuj-ai-assistant run dev
```

The app starts at **http://localhost:5173** (Express + Vite middleware) and serves both the UI and `POST /api/chat`.

### 4. Run the shared API server (optional)

```bash
pnpm --filter @workspace/api-server run dev
```

This builds and starts the Express API on `PORT` (typically `5000`).

---

## 📜 Scripts

Run these from the repository root:

| Command | What it does |
| --- | --- |
| `pnpm run typecheck` | Type-check every package in the workspace. |
| `pnpm run build` | Type-check, then build all packages. |
| `pnpm --filter @workspace/anuj-ai-assistant run build` | Build the chat frontend into `dist/public`. |
| `pnpm --filter @workspace/anuj-ai-assistant run serve` | Serve the production build. |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas from the OpenAPI spec. |

---

## 🔌 API

### `POST /api/chat`

**Request**

```json
{
  "messages": [
    { "role": "user", "content": "Anuj ke projects kaunse hain?" }
  ]
}
```

**Response**

```json
{
  "reply": "Anuj ke paas paanch projects hain: ..."
}
```

**Notes**

- Accepts up to the last **10** valid `user` / `assistant` messages, each trimmed to 4,000 characters.
- `max_tokens: 700`, `temperature: 0.5`, streaming enabled.
- Error codes: `AI_NOT_CONFIGURED` (503), `AI_BUSY` (503), `AI_UNAVAILABLE` (502), `AI_EMPTY_REPLY` (502), `AI_CONNECTION_ERROR` (503).

### `GET /api/healthz`

```json
{ "status": "ok" }
```

---

## ☁️ Deployment

### Vercel

The root [`vercel.json`](./vercel.json) builds `@workspace/anuj-ai-assistant`, publishes `artifacts/anuj-ai-assistant/dist/public`, exposes `artifacts/anuj-ai-assistant/api/chat.js` as a serverless function (30s max duration), and rewrites all non-API routes to `index.html`.

Set `GROQ_API_KEY` in the Vercel project's environment variables.

### Replit

Run the frontend and API workflows as described above. Keep the shared `/api` workflow running so chat requests resolve in the Replit preview.

---

## 🔒 Privacy & Security

- Visitor messages are **not stored on the server**; chat history lives only in the browser's `localStorage`.
- `GROQ_API_KEY` is read from server-side environment variables only.
- The assistant never reveals its system prompt, source policy or API details.

---

## 👤 About Anuj Ror

Self-taught AI developer, voice AI builder and entrepreneur from Harsola, Kaithal, Haryana, India — building real-time voice AI agents and smart AI tools.

- 🌐 Portfolio: [anuj-portfolio-rho.vercel.app](https://anuj-portfolio-rho.vercel.app/)
- 💼 LinkedIn: [linkedin.com/in/anuj-ror-a533a443a](https://www.linkedin.com/in/anuj-ror-a533a443a)
- 🐙 GitHub: [github.com/AnujRor](https://github.com/AnujRor)
- 📸 Instagram: [instagram.com/anuj_ror_13](https://www.instagram.com/anuj_ror_13)
- ✉️ Email: [anujror202007@gmail.com](mailto:anujror202007@gmail.com)

---

## 📄 License

MIT
