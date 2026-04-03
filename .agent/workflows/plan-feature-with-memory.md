---
description: Plan a feature using Obsidian standards, decisions, patterns, and incident history before proposing implementation
---

# Plan feature with memory

Use Obsidian memory before producing a feature plan.

## Steps

1. Identify the planning context
- Determine the current project.
- Determine the feature area or subsystem.
- Determine which frontend components, backend services, APIs, database tables, queues, jobs, file-storage paths, or integrations may be affected.
- Determine the main technical and business constraints already known from the request.

2. Retrieve from Obsidian
- Retrieve [[Web Engineering Standard]] first.
- Retrieve [[Web Application Planning Standard]].
- Retrieve project architecture notes relevant to the feature area.
- Retrieve related standards.
- Retrieve prior decisions that affect architecture, API design, security, rollout, file storage, routing, or data model choices.
- Retrieve reusable patterns relevant to the subsystem.
- Retrieve incidents that reveal failure modes relevant to this feature.
- Prefer notes from the same project and same area before using cross-project memory.

3. Summarize the retrieved memory before planning
- Summarize stack defaults that should be followed, including Node.js, React, Zod, Docker, MariaDB, volume-backed file storage, and Linux deployment expectations.
- Summarize architecture rules that should be followed.
- Summarize preferred implementation patterns.
- Summarize prior decisions that constrain the design.
- Summarize known failure modes that the design should avoid.
- Summarize deployment, rollback, routing, monitoring, and test expectations discovered in memory.

4. Produce the feature plan
- Define the goal and scope.
- Define what is in scope and out of scope.
- Describe the proposed architecture and affected layers.
- Describe frontend, backend, API, data model, migration, queue, worker, and integration impacts if relevant.
- Describe containerization expectations for frontend and backend.
- Describe MariaDB usage and whether schema or migration changes are needed.
- Describe volume-mapped storage needs for user-generated content if relevant.
- Describe NGINX routing, domain, deployment, rollback, and backward-compatibility considerations if relevant.
- Describe how the solution aligns with engineering standards such as Node.js, React, Zod, testability, and high automated coverage.
- Describe security, reliability, and observability considerations.
- Describe validation strategy including unit, integration, and end-to-end tests.
- List open assumptions, risks, and unresolved questions.

5. Check for deviation from prior memory
- If the plan differs from a prior standard, decision, or known pattern, explicitly explain why.
- Prefer existing project conventions unless there is a clear reason to change them.

6. Write back to Obsidian when appropriate
- If the feature introduces a meaningful new tradeoff, create or update a decision note in Obsidian.
- If the plan establishes a reusable implementation approach, create or update a pattern note in Obsidian.
- Do not write back low-value or duplicate notes.

7. Final response behavior
- Present the final plan clearly and concisely.
- Make the retrieved memory visible in the rationale, not just the conclusion.
- Highlight major risks, architectural implications, rollout concerns, and reliability concerns first.