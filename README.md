# The Learning Machine

A wholly independent, browser-first **Socratic learning environment** for the proposed Right to Learn and Ephemeral Processing Act. Learners formulate hypotheses, predict outcomes, run experiments, observe results, defend or revise explanations, design alternative laws and apply discoveries to new problems.

## Development sources of truth

- [Complete plan: all 96 PR-sized units](docs/DEVELOPMENT_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Canonical PR work registry](registry/prs.json) and [registry contract](registry/PR_FORMAT.md)
- [Testing](docs/TEST_STRATEGY.md), [Privacy](docs/SECURITY_PRIVACY.md), [Release gates](docs/RELEASE_GATES.md)
- [Developer/agent instructions](AGENTS.md)

## Foundation scope

TLM-001 brings real documentation, validation and a dependency-free **small executable Socratic state demonstration**. This is not the completed learning engine, the 8 lessons, the legal engine, a trained neural model or deployment. Future scopes are planned and acceptance-tested separately.

## Verify

The dependency-free foundation runs with Node 22.16 or later (`npm run check` and `npm test`). TLM-002 will pin and integrate the production Node 24/pnpm/TypeScript/Astro lockfile/toolchain. No credentials, databases or third-party services required.
