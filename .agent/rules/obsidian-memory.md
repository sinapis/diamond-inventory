---
trigger: always_on
---

# Obsidian memory rule

This workspace uses Obsidian as the canonical long-term engineering memory.

## Goals
- Reuse prior engineering knowledge before planning, coding, debugging, or refactoring.
- Store only durable, reusable knowledge back into Obsidian.
- Avoid dumping raw chat transcripts or noisy notes into the vault.
- Keep engineering decisions aligned with deployment, reliability, and testing standards.

## Canonical standards
Always treat these notes as default planning and implementation constraints when relevant:
- [[Web Engineering Standard]]
- [[Web Application Planning Standard]]

Specifically prefer these defaults unless a project decision overrides them:
- Node.js for backend and server-side logic
- React for frontend UI
- Zod for API validation
- Docker containers for frontend and backend
- MariaDB as the database
- dedicated database per app in a shared production MariaDB instance
- volume mapping for user-generated content
- Linux deployment behind NGINX reverse proxy
- testable components
- high automated coverage for critical flows

## Retrieval policy
Before planning features, changing architecture, or fixing bugs:

1. Identify the current:
   - project
   - area or subsystem
   - task type (feature, bug, refactor, decision)
   - relevant technologies

2. Retrieve relevant Obsidian notes in this order:
   - canonical standards
   - notes from the same project and same area
   - project decisions and architecture 