# Independent Technical Architecture — The Learning Machine

**Version 1.0 • 2026-10-19 • Proposed architecture; not a claim of completed implementation.**

## Core principle

The experience guides the learner through **encounter → hypothesize → predict → experiment → observe → explain → challenge → revise → transfer**. The act of independently discovering an explanation is the feature, not the retention of material. Challenge a favored hypothesis as rigorously as an opposing one. Allow immediate explanations and noncoercive exits.

## Architecture and independence

An independent browser-first web application with small opt-in publisher/API backend. No architecture, imports, shared schemas, services, databases, APIs, installations or deployments from any other legislative or conversational product. All authority and source content is locally curated for this one bill.

### Target stack

TypeScript strict monorepo, pnpm workspace with lockfile, Astro static shell and React islands, explicit typed state-machine reducer, Canvas/SVG, Web Workers, TensorFlow.js small optional browser models, Web Audio and AudioWorklet, bounded declarative rule evaluator, fixed-point economic engine, immutable static content bundles, optional independent Fastify API, isolated publisher Postgres and independent static hosting/CDN. Node 24 pinned at TLM-002. TLM-001 intentionally uses a dependency-free Node ESM mini-loop for an executable proof before the complete typed runtime.

### Runtime layers

1. **Presentation:** accessible interface sends learner actions and displays observations; cannot fabricate results.
2. **Socratic state engine:** deterministic typed stage transitions, prompts, revision, progressive hints, transfer evidence; cannot amend experiments or laws.
3. **Experiment runtime:** actual measured vision/audio/learning computations in browser; heavy work in bounded, cancelable Workers; source data remains local by default.
4. **U.S. legal-policy runtime:** dated sourced authorities, qualified outcomes, separately versioned proposed bill and visitor-authored conditional policies; unresolved remains unresolved.
5. **Perspective/economics runtime:** distinct actors, rights and authorization graph, money events, defined assumptions and sensitivity; no invented facts.
6. **Content and provenance:** immutable versions for curriculum, source quotes, licenses, algorithms, golden fixtures and release digests.
7. **Optional tutor:** structured evidence-grounded questions behind opt-in network adapter; offline fully-authored route always exists.
8. **Private publishing:** scoped roles/MFA, validated sources and asset licenses, content preview, atomic promotion and rollback.

### Domain contracts

- `LearningSession`: release, active module/node/stage, learner actions, hypotheses, predictions, observations, hints, transfer evidence; ephemeral unless a visitor requests local save.
- `Experiment`: versioned accepted inputs, cancel/reset and timeout, measured/computed/simulated result provenance, accessible equivalent.
- `LegalScenario`: jurisdiction/date, work and parties, lawful access, intermediate reproductions, teaching, retention, outputs, other rights and declared unknowns.
- `PolicyRuleSet`: constrained conditions, exceptions, legal source references and unambiguous version.
- `EconomicScenario`: fixed-point currency, participant balances, event flows and hypothesis ranges.
- `ContentRelease`: immutable asset/content source digests, algorithm compatibility and required acceptance evidence.

### Nonnegotiable invariants

No mandatory account, API keys, payment, server GPU or webcam. Actual computations are not represented by scripted fake animations. No political agreement grading. The current law, statutory proposals, legal interpretations and illustrative simulations are separate. Outputs are not automatically lawful because the model learned. Browser-level deletion is not guaranteed physical memory erasure. Legal/financial uncertainty is modeled explicitly. Every essential learning outcome has an accessible equivalent route.

### Target repository layout

`apps/web`, `apps/api`, `apps/editor`, `packages/contracts`, `packages/socratic`, `packages/experiments`, `packages/vision-lab`, `packages/learning-lab`, `packages/audio-lab`, `packages/policy-lab`, `packages/economics`, `packages/evidence`, `packages/content`, `packages/ui`, `content`, `registry`, `docs`, `infra`, `tests`.

### Release chain

Authored content → bounded validation → source/asset rights checks → experiment golden oracle → accessibility/privacy tests → immutable release digest → atomic publish → browser local execution → versioned observation trace. Documentation alone never passes a coding or launch gate. See `docs/DEVELOPMENT_PLAN.md` and `registry/prs.json`.
