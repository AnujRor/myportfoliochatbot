---
name: Portfolio knowledge source
description: The verified public portfolio pages are the authoritative source for the assistant's Anuj facts, projects and links.
---

The assistant should use the verified portfolio pages as its only source for Anuj-related answers. The portfolio contact page includes the email and social links, but does not list a phone number.

**Why:** The user wants every answer about Anuj, his projects and links to match the portfolio rather than older manually entered facts or general model knowledge.

**How to apply:** When the portfolio changes, refresh the source content and update both chat API prompts together. If a detail is absent from the portfolio, say it is not listed instead of guessing.