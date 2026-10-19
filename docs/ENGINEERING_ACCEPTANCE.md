# Engineering acceptance and work scheduling

The independent work registry `registry/prs.json` contains 96 acceptance units and their prerequisite graph. Its `TLM-NNN` IDs are stable scope identifiers and never assumed to match GitHub PR numbers. `pnpm ready` lists **advisory** registry-ready work; contributors must verify actual GitHub branch heads, CI checks and merge state before selecting or merging a unit.

**Required behavior for each PR**: full acceptance criteria, real executable tests (including meaningful negative paths), contract/type compatibility, privacy and accessibility impact, updated source evidence, no invented measurements or legal facts, and verification against the exact current PR head. If blocked, document the blocker and continue another independently ready unit. Do not record a partially implemented work unit as merged. The `CODEOWNERS` file is informational and does not create an independent human approval dependency.

**No false launch status**: a green build or merger is not a production release. G11 requires an actual independently hosted origin and real automated browser, accessibility, content, privacy, incident response and rollback evidence.

**CI commands**: `pnpm check` includes registry, contract, compiler, experiment, Socratic runtime, package boundary, secret scan, web typecheck/build and static smoke. `pnpm test:browser` exercises desktop and mobile Chromium journeys including local-only user reasoning. Node and pnpm versions are pinned; dependencies use committed frozen lockfiles.
