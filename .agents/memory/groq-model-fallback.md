---
name: Groq model access
description: Provider-specific model availability for the portfolio assistant.
---

The Groq key used by this project may not have access to the requested `llama-3.3-70b-versatile` model. The server should attempt that model first, then retry with an accessible fallback only when Groq returns `model_not_found`.

**Why:** Groq model availability is account-specific and can change independently of the app, while the chat should remain usable rather than fail for every visitor.

**How to apply:** Preserve the preferred model in configuration and keep the fallback server-side. Do not expose the key or silently substitute a model for unrelated provider errors.