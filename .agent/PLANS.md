# Agents and ExecPlans

This repository uses **ExecPlans** to design and implement any non-trivial
feature, system, or refactor. ExecPlans are living documents and are the
single source of truth for planning and execution.

The rules, standards, and required structure for ExecPlans are defined in:

- `.agent/PLANS.md`

All concrete ExecPlans must be placed under:

- `.agent/execplans/*.md`

## Agent Responsibilities

When you (the coding agent) are asked to build or modify a substantial part
of the system — e.g. setting up the backend, designing the CRM data model,
building CRUD modules, authentication, or workflow features — you MUST:

1. **Create or update an ExecPlan** under `.agent/execplans/`.
2. **Follow that ExecPlan** as the authoritative specification.
3. Keep the following sections updated as work progresses:
   - `Progress`
   - `Surprises & Discoveries`
   - `Decision Log`
   - `Outcomes & Retrospective`
4. Ensure all work is:
   - Self-contained and fully documented
   - Broken down into small, reviewable tasks
   - Validated against acceptance criteria

## High-Level Goal of This Repository

This repository will be used to build a full-featured CRM system using:

- **Node.js**
- **Express**
- **Prisma**
- **PostgreSQL**

The agent will be responsible for:
- Designing the backend structure
- Setting up the development environment
- Implementing all CRM entities and workflows
- Providing all necessary instructions and file changes

ExecPlans drive all non-trivial work. All tasks must originate from an
ExecPlan.
