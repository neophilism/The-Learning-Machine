# The Learning Machine — Comprehensive Development and Pull Request Plan

**Project:** neophilism/The-Learning-Machine  
**Plan date:** October 19, 2026  
**Scope:** Standalone, bill-specific Socratic experiential learning product.  
**Canonical machine-readable registry:** `registry/prs.json`  
**Total planned work units:** 96; each is an independently testable intended PR, not an opened GitHub PR. Only TLM-001 is in progress. None is represented as merged.

## Product and architectural boundaries

The product implements encounter → hypothesize → predict → experiment → observe → explain → challenge → revise → transfer. Learners test real image and musical processing, train genuine small local classifiers, examine the limits of generalization and memorization, explore sourced U.S. copyright law, compare current law and a proposed bill, model money/information/authority and write and challenge their own hypothetical rule. Reasoned disagreement must count as successful learning. Core lessons require no account, remote AI, paid GPU, payment service or third-party app.

The Learning Machine owns its entire technical architecture, repo, source and legal content, learning engines, contracts, data, auth, assets and deployment. It does not call, embed, import, integrate with or technically depend upon any other legislative application. Public learning defaults to browser-only; the optional publisher/API services belong solely to this repository.

## Scope summary and release gates

| Phase | Workstream | Release gate | PR-sized units |
|---|---|---|---:|
| P0 | Executable foundations | Reproducible plan, registered DAG and tested Socratic demonstration | 8 |
| P1 | Socratic engine | Complete discover-experiment-revise-transfer cycle without remote AI | 8 |
| P2 | Vision laboratory | Functional selective detection with honest alternatives | 8 |
| P3 | Trainable classification laboratory | Genuine generalization on unseen data | 8 |
| P4 | Model internals and retention | Accurate distinction between learning and source retention | 8 |
| P5 | Music and audio learning | Real original-media audio classification and accessible alternatives | 8 |
| P6 | U.S. legal evidence and policy engine | Sourced, qualified U.S. law evaluation | 8 |
| P7 | Legal cases, education and creator rights | Non-misleading full legal learning scenarios | 8 |
| P8 | Economic flows and perspectives | Transparent actor-based economics with no invented facts | 8 |
| P9 | Design your own law and transfer | Functional impartial hypothetical law-making studio | 8 |
| P10 | Publishing and optional AI assistance | Immutable curated source releases; no mandatory model calls | 8 |
| P11 | Full acceptance and public deployment | Independently verified accessible production system | 8 |
| | **TOTAL** | **G0–G11** | **96** |

## Definitions of a planned PR and completed PR

A `TLM-NNN` number identifies a stable planned unit, **not** a GitHub PR number. Actual GitHub PR numbers and links are entered only after creation. The legal order of statuses is `planned` → `in_progress` → `in_review` → `merged`, with `blocked` and justified `superseded` available. Plan descriptions, open pull requests and partly implemented functions are never counted as completed. A unit is accepted only after the complete scope, error cases, accessibility and privacy requirements are implemented, the declared tests pass on the exact PR head and the PR is actually merged. Production release remains separate.

## PR execution rules

Each work unit requires: scoped implementation and tests; actual predecessor checks against main; updated content/schema docs; fail-closed invalid-input behavior; accessible interaction or equivalent where applicable; versioned authored evidence; no made-up measurement, source or economic fact. Use short-lived branches `feature/tlm-NNN-...`. Parallel PRs must avoid shared mutable files and be rebased or updated with fresh verified heads before acceptance. A blocked unit records the exact blocker and chooses the next dependency-ready unit; never mark missing functionality partially accepted.

## Source and licensing requirements

All legal authority in the actual U.S.-law mode is source-linked with date and scope; a judicial holding is not conflated with a proposal, interpretation or policy preference. A full legislative draft must actually exist before publication as exact statutory text. The curriculum uses original or properly authorized default media. User drawings/video/audio remain local by default; optional remote tutor receives only separately consented minimum context. Do not promise guaranteed physical-memory erasure. Models can memorize recoverable expression; uncertainty must be disclosed. Economic figures remain illustrative until externally validated.

## Dependency and parallelism policy

Gate G0 supplies the contract and build foundation. G1 and G2 form a complete Socratic demonstrator. Image and ML labs feed subsequent model-internals demonstrations. U.S. legal evidence, original audio and economic modeling can proceed in parallel after prerequisites. Publishing, accessibility, security and production acceptance are final release dependencies but their design must be considered within each PR. Never infer readiness from an ID sequence; compute readiness from accepted dependencies in the registry.

## Acceptance strategy

- **Per PR:** explicit acceptance criterion and measurable verification below.
- **Foundation:** dependency-free Node unit tests + valid registry DAG + first executable mini-cycle.
- **Later:** frozen install, TypeScript strict typecheck, unit and property tests, browser E2E, accessibility parity, media privacy negative tests, legal golden scenarios, bounded worker performance and content integrity.
- **Curriculum:** eight verified authored modules with genuine alternate conclusions, not a hidden agreement test.
- **G11:** independently tested production URL, no mandatory external model, complete security/accessibility/rollback evidence.

## All 96 PR specifications

## P0 — Executable foundations

**Gate:** Reproducible plan, registered DAG and tested Socratic demonstration

### TLM-001 — Foundational architecture, roadmap and mini-loop

**Dependencies:** None  
**Implementation:** Complete canonical plan, registry, smoke-tested pure learner reducer and CI  
**Acceptance criterion:** Basic encounter-hypothesis-prediction-observation cycle runs; no future features marked done  
**Required verification:** Node tests and roadmap validation prove real executable foundation

### TLM-002 — Pinned TypeScript workspace and Astro/React build

**Dependencies:** TLM-001  
**Implementation:** Pin Node 24, pnpm, lockfile, strict TypeScript and browser build  
**Acceptance criterion:** Clean frozen install, typecheck and production preview succeed  
**Required verification:** CI builds from empty checkout

### TLM-003 — Versioned contracts and schema validation

**Dependencies:** TLM-002  
**Implementation:** Validate events, modules, experiments, measurements, scenarios and releases at boundaries  
**Acceptance criterion:** Malformed or unsupported versions fail closed  
**Required verification:** Schema/property negative tests pass

### TLM-004 — Lesson graph DSL and compiler

**Dependencies:** TLM-003  
**Implementation:** Author and compile bounded branching lesson graphs and prerequisites  
**Acceptance criterion:** Invalid edges, dead ends and inaccessible required routes are rejected  
**Required verification:** Graph fixtures exercise branches, alternative endings and cycles

### TLM-005 — Full deterministic Socratic state machine

**Dependencies:** TLM-003, TLM-004  
**Implementation:** Typed learner stages, guards, skips, explanation routes and replayable actions  
**Acceptance criterion:** Only permitted transitions occur; direct answers remain accessible  
**Required verification:** Table-driven transition and navigation tests pass

### TLM-006 — Observation provenance and experiment replay

**Dependencies:** TLM-003, TLM-005  
**Implementation:** Record measurements versus simulations, algorithm versions, run IDs and seeds  
**Acceptance criterion:** Deterministic experiments replay and cannot relabel simulated values as measured  
**Required verification:** Golden replay and trace validation pass

### TLM-007 — Responsive accessible learning shell

**Dependencies:** TLM-002, TLM-005  
**Implementation:** Build semantic public app with question, stage, evidence and accessible interaction  
**Acceptance criterion:** Keyboard-only visitor can complete and reset a miniature lesson  
**Required verification:** Playwright desktop/mobile accessibility smoke passes

### TLM-008 — Foundational CI and PR quality enforcement

**Dependencies:** TLM-002, TLM-003, TLM-004, TLM-005, TLM-006, TLM-007  
**Implementation:** Require lint, typecheck, tests, registry validation and security gates  
**Acceptance criterion:** Required jobs fail on actual defects and run against exact PR head  
**Required verification:** Fresh-checkout CI and negative tests pass


## P1 — Socratic engine

**Gate:** Complete discover-experiment-revise-transfer cycle without remote AI

### TLM-009 — Open-ended encounter and hypothesis input

**Dependencies:** TLM-005, TLM-007  
**Implementation:** Capture multiple plausible learner explanations and suggested alternatives  
**Acceptance criterion:** Valid unusual solutions are not rejected to force an approved answer  
**Required verification:** Noncanonical answer fixtures pass

### TLM-010 — Prediction before reveal

**Dependencies:** TLM-009, TLM-006  
**Implementation:** Associate learner predictions with experiments and prevent premature result disclosure  
**Acceptance criterion:** Prediction appears beside actual observation after execution  
**Required verification:** Leakage and edit/reset tests pass

### TLM-011 — Experiment dispatch, cancellation and retries

**Dependencies:** TLM-003, TLM-006, TLM-010  
**Implementation:** Route learner actions to typed local experiments with controlled retries  
**Acceptance criterion:** Failure and cancellation do not corrupt the learning state  
**Required verification:** Timeout and retry integration tests pass

### TLM-012 — Evidence-bound observation stage

**Dependencies:** TLM-011, TLM-006  
**Implementation:** Turn experiment outputs into source-labeled learner observations  
**Acceptance criterion:** Measured, computed, simulated and unknown are visibly distinct  
**Required verification:** Mislabelled evidence and unknown-value tests pass

### TLM-013 — Contextual Socratic question selection

**Dependencies:** TLM-009, TLM-010, TLM-012  
**Implementation:** Select questions from learner claims, prerequisites and observed outcomes  
**Acceptance criterion:** Different learner approaches elicit meaningfully different questions  
**Required verification:** Branching dialogue fixtures pass

### TLM-014 — Progressive scaffolding and direct explanation

**Dependencies:** TLM-013  
**Implementation:** Offer clear hints, accessibility support and immediate explanations on request  
**Acceptance criterion:** Visitor can skip or seek help without punitive scoring  
**Required verification:** Hint-level and bypass tests pass

### TLM-015 — Counterexample selection and competing approaches

**Dependencies:** TLM-012, TLM-013  
**Implementation:** Challenge weak hypotheses with balanced, actual counterexamples  
**Acceptance criterion:** Bill-supporting and bill-opposing hypotheses receive equally rigorous scrutiny  
**Required verification:** Adversarial question selection fixtures pass

### TLM-016 — Revision, transfer and reasoning evidence

**Dependencies:** TLM-014, TLM-015  
**Implementation:** Record revisions and test ideas on novel tasks rather than political agreement  
**Acceptance criterion:** Reasoned disagreement can complete an experience  
**Required verification:** Transfer and alternative-outcome E2E passes


## P2 — Vision laboratory

**Gate:** Functional selective detection with honest alternatives

### TLM-017 — Synthetic image scenes and accessible drawing inputs

**Dependencies:** TLM-007, TLM-011  
**Implementation:** Use original symbols, Canvas and SVG descriptions to build scene fixtures  
**Acceptance criterion:** Scenes need no unauthorized logos and remain reproducible  
**Required verification:** Image snapshots and descriptions pass

### TLM-018 — Actual frame/pixel operations and trace

**Dependencies:** TLM-017, TLM-006  
**Implementation:** Instrument real pixel buffer transformations, not merely animations  
**Acceptance criterion:** Displayed processing steps match executed pixel operations  
**Required verification:** Reference frame calculations pass

### TLM-019 — Real selective recognizer for synthetic icons

**Dependencies:** TLM-017, TLM-018  
**Implementation:** Implement bounded template/geometric detection across varied locations  
**Acceptance criterion:** Recognizer detects novel placements and rejects distractors  
**Required verification:** Precision and recall golden fixtures pass

### TLM-020 — Manual, blanket and selective masking alternatives

**Dependencies:** TLM-019  
**Implementation:** Implement masking methods with differing recognition requirements  
**Acceptance criterion:** Blanket masking works without recognizing the target  
**Required verification:** Rendered pixel-output tests pass

### TLM-021 — False positives, misses and uncertainty display

**Dependencies:** TLM-019, TLM-020  
**Implementation:** Compute confusion counts and denominators from classified synthetic frames  
**Acceptance criterion:** Metrics change accurately as frames and thresholds change  
**Required verification:** Edge-case accuracy fixtures pass

### TLM-022 — Worker-backed vision compute and cancellation

**Dependencies:** TLM-011, TLM-018, TLM-021  
**Implementation:** Move heavy pixel work to cancellable budgeted Workers  
**Acceptance criterion:** Stale frame results cannot appear after reset  
**Required verification:** Race and timeout stress tests pass

### TLM-023 — Explicit opt-in local webcam mode

**Dependencies:** TLM-022  
**Implementation:** Add gesture-triggered webcam capture with local-only processing default  
**Acceptance criterion:** No capture without permission and no frame upload  
**Required verification:** Denied/revoked permission and network tests pass

### TLM-024 — Module 1: complete selective-masking Socratic journey

**Dependencies:** TLM-017, TLM-020, TLM-021, TLM-022, TLM-023, TLM-016  
**Implementation:** Publish encounter-through-transfer lesson with alternative technical solutions  
**Acceptance criterion:** Visitors discover differing information requirements, not forced conclusions  
**Required verification:** Keyboard/mobile/adversarial journey tests pass


## P3 — Trainable classification laboratory

**Gate:** Genuine generalization on unseen data

### TLM-025 — Local drawing examples and editable labels

**Dependencies:** TLM-007, TLM-011  
**Implementation:** Capture user-drawn examples for at least two classes inside browser  
**Acceptance criterion:** Learner can add/edit/remove examples without sending them remotely  
**Required verification:** Local-only input and mutation tests pass

### TLM-026 — Train/test separation and dataset provenance

**Dependencies:** TLM-025, TLM-006  
**Implementation:** Make reproducible distinct training and holdout partitions  
**Acceptance criterion:** Holdout examples do not leak into training  
**Required verification:** Partition property tests and seed replay pass

### TLM-027 — Transparent real trainable classifier

**Dependencies:** TLM-025, TLM-026, TLM-011  
**Implementation:** Implement working small numerical classifier with real updated parameters  
**Acceptance criterion:** Training changes predictions by actual computation  
**Required verification:** Reference numeric update tests pass

### TLM-028 — Unseen-example inference and score display

**Dependencies:** TLM-027  
**Implementation:** Predict on new drawings with score and limitation text  
**Acceptance criterion:** New predictions are calculated rather than scripted  
**Required verification:** Holdout inference fixtures pass

### TLM-029 — Confusion matrix and balanced metrics

**Dependencies:** TLM-026, TLM-028  
**Implementation:** Display per-class precision, recall and confusion counts  
**Acceptance criterion:** Displayed results match actual labeled predictions  
**Required verification:** Imbalanced and empty-class tests pass

### TLM-030 — Memorization versus generalization trials

**Dependencies:** TLM-027, TLM-028, TLM-029  
**Implementation:** Compare memorizing nearest examples with a generalizing learner  
**Acceptance criterion:** Unseen scenarios reveal where each method fails  
**Required verification:** Both algorithms run under identical holdout sets

### TLM-031 — Noise, outliers and adversarial input experiments

**Dependencies:** TLM-029, TLM-030  
**Implementation:** Offer reproducible disturbances and misleading examples  
**Acceptance criterion:** Accuracy changes trace back to declared perturbations  
**Required verification:** Seed and label-integrity tests pass

### TLM-032 — Module 2: Teach a Machine

**Dependencies:** TLM-025, TLM-026, TLM-027, TLM-028, TLM-029, TLM-030, TLM-031, TLM-016  
**Implementation:** Integrate training, test, failure, revision and transfer into one real lesson  
**Acceptance criterion:** Visitor trains and tests an actual local model  
**Required verification:** E2E training and accessible route tests pass


## P4 — Model internals and retention

**Gate:** Accurate distinction between learning and source retention

### TLM-033 — Optional small neural-network TensorFlow.js backend

**Dependencies:** TLM-027, TLM-030  
**Implementation:** Lazy-load real local neural training with CPU fallback and limits  
**Acceptance criterion:** Backend can be disabled without losing the lesson  
**Required verification:** Fallback, timing and tolerance tests pass

### TLM-034 — Actual model parameter inspector

**Dependencies:** TLM-027, TLM-033  
**Implementation:** Expose real weights/centroids and changes caused by training  
**Acceptance criterion:** Visual states correspond to stored numerical parameters  
**Required verification:** Serialize/deserialize parameter tests pass

### TLM-035 — Dataset disposal and retained-model demonstration

**Dependencies:** TLM-026, TLM-034  
**Implementation:** Demonstrate application-store cleanup versus retained learned model  
**Acceptance criterion:** System never promises guaranteed physical memory erasure or unlearning  
**Required verification:** Store inspection and disclosure tests pass

### TLM-036 — Versioned reproducible model experiments

**Dependencies:** TLM-006, TLM-033, TLM-034  
**Implementation:** Pin algorithm, inputs, seeds and backend caveats in replay trace  
**Acceptance criterion:** Comparable runs explain true determinism limits  
**Required verification:** CPU golden runs and GPU tolerance tests pass

### TLM-037 — Honest performance and intermediate-operation microscope

**Dependencies:** TLM-018, TLM-035, TLM-036  
**Implementation:** Instrument real processing steps and distinguish illustrations  
**Acceptance criterion:** No performance metric or internal process is fabricated  
**Required verification:** Trace provenance tests fail on synthetic labels missing disclosures

### TLM-038 — Unseen transfer and overfitting challenge

**Dependencies:** TLM-030, TLM-031, TLM-034  
**Implementation:** Present novel tasks that distinguish rule transfer from rote memory  
**Acceptance criterion:** Learner revises after unexpected generalization failure  
**Required verification:** Transfer and ambiguity fixtures pass

### TLM-039 — Module 3: What Did the Machine Learn?

**Dependencies:** TLM-034, TLM-035, TLM-037, TLM-038  
**Implementation:** Teach parameters, source disposal, reconstructability and generalization  
**Acceptance criterion:** Learner explains retention without absolute guarantees  
**Required verification:** Complete accessible learner-route tests pass

### TLM-040 — ML device limits and browser compatibility

**Dependencies:** TLM-033, TLM-035, TLM-039  
**Implementation:** Bound memory, time, workers and offer honest low-power alternatives  
**Acceptance criterion:** No unlimited compute loop freezes the interface  
**Required verification:** Reference device perf and browser fallback tests pass


## P5 — Music and audio learning

**Gate:** Real original-media audio classification and accessible alternatives

### TLM-041 — Original musical synthesizer and melody editor

**Dependencies:** TLM-007  
**Implementation:** Generate original rhythms, tones and melodies using Web Audio  
**Acceptance criterion:** Default material has documented original-media provenance  
**Required verification:** Offline render and asset-rights checks pass

### TLM-042 — Measured waveform and spectrogram views

**Dependencies:** TLM-041  
**Implementation:** Derive visuals from actual audio samples  
**Acceptance criterion:** Visuals and narration agree with underlying signals  
**Required verification:** Reference signal tests pass

### TLM-043 — Pitch, rhythm and timbre feature extractors

**Dependencies:** TLM-041, TLM-042  
**Implementation:** Compute musical characteristics with explicit algorithm limits  
**Acceptance criterion:** Controlled tones produce expected numerical features  
**Required verification:** Signal boundary and pitch/rhythm fixture tests pass

### TLM-044 — Trainable musical pattern classifier

**Dependencies:** TLM-027, TLM-043  
**Implementation:** Train local classifier on original extracted musical features  
**Acceptance criterion:** Learner can test novel melodies with actual predicted results  
**Required verification:** Holdout musical classifier tests pass

### TLM-045 — Musical characteristics versus copied expression

**Dependencies:** TLM-043, TLM-044  
**Implementation:** Compare generalized patterns, memorization and direct replays  
**Acceptance criterion:** Listeners can distinguish simulated copying from new compositions  
**Required verification:** Originality labeling and audio comparison tests pass

### TLM-046 — Live audio filtering and parallel processing tasks

**Dependencies:** TLM-041, TLM-043  
**Implementation:** Provide bounded live sound filters and truthful real-time processing demonstration  
**Acceptance criterion:** Observed processing corresponds to actual signals and disclosed fallbacks  
**Required verification:** Measured-latency and denied-permission tests pass

### TLM-047 — Complete music-learning lesson

**Dependencies:** TLM-041, TLM-042, TLM-043, TLM-044, TLM-045, TLM-046, TLM-016  
**Implementation:** Publish prediction-and-revision lesson using locally generated music  
**Acceptance criterion:** Learner can infer musical features without access to copyrighted recordings  
**Required verification:** Keyboard, audio and nonaudio E2E paths pass

### TLM-048 — Audio privacy, non-audio equivalents and mobile QA

**Dependencies:** TLM-041, TLM-042, TLM-047  
**Implementation:** Implement user gesture, captions and alternatives when sound unavailable  
**Acceptance criterion:** Experience objectives remain achievable without hearing or microphone  
**Required verification:** Assistive and mobile-muted tests pass


## P6 — U.S. legal evidence and policy engine

**Gate:** Sourced, qualified U.S. law evaluation

### TLM-049 — Dated U.S. statutes and precedent content pack

**Dependencies:** TLM-003  
**Implementation:** Curate relevant federal copyright statutes and judicial holdings with source pointers  
**Acceptance criterion:** Every actual legal claim has authority, limitations and date  
**Required verification:** Citation and quote integrity checks pass

### TLM-050 — Versioned proposed-bill text and draft status

**Dependencies:** TLM-049  
**Implementation:** Load approved bill version, or explicitly label incomplete draft placeholders  
**Acceptance criterion:** A proposed provision never appears as enacted law  
**Required verification:** Missing authoritative full-text guard tests pass

### TLM-051 — Typed legal scenarios and material/access facts

**Dependencies:** TLM-003, TLM-049  
**Implementation:** Model actors, works, access, copying, retention, teaching and outputs  
**Acceptance criterion:** Scenarios cannot conceal missing material facts  
**Required verification:** Schema edge and invalid classification tests pass

### TLM-052 — Bounded source-linked policy rule compiler

**Dependencies:** TLM-050, TLM-051  
**Implementation:** Compile constrained permissions/exceptions without eval or code upload  
**Acceptance criterion:** Unsupported operations and unsourced operative rules fail closed  
**Required verification:** Nested-rule property and hostile input tests pass

### TLM-053 — Current-law qualified evaluation

**Dependencies:** TLM-049, TLM-051, TLM-052  
**Implementation:** Produce source-supported outcomes with unresolved/disputed states  
**Acceptance criterion:** No universal all-training-legal or illegal shortcut appears  
**Required verification:** Legal golden cases and unknown branches pass

### TLM-054 — Same-facts existing-versus-proposed comparison

**Dependencies:** TLM-050, TLM-052, TLM-053  
**Implementation:** Replay identical situations under separately labeled legal frameworks  
**Acceptance criterion:** Changing law does not silently change actors, economics or access  
**Required verification:** Differential fixture tests pass

### TLM-055 — First visitor rule editor

**Dependencies:** TLM-052, TLM-054, TLM-007  
**Implementation:** Allow toggles and controlled scoped terms for hypothetical legislation  
**Acceptance criterion:** User can express alternative rules and see their precise effect  
**Required verification:** Editor serialization and negative tests pass

### TLM-056 — Conflicts, exceptions and legal golden oracles

**Dependencies:** TLM-052, TLM-053, TLM-054, TLM-055  
**Implementation:** Respect nested exceptions, ambiguous rules and competing holdings  
**Acceptance criterion:** Unresolved law stays unresolved unless sourced precedence exists  
**Required verification:** Golden conflict and adversarial cases pass


## P7 — Legal cases, education and creator rights

**Gate:** Non-misleading full legal learning scenarios

### TLM-057 — Acquisition and lawful-access exercise

**Dependencies:** TLM-051, TLM-053, TLM-016  
**Implementation:** Contrast lawful purchase, borrowing, streaming and pirated sources  
**Acceptance criterion:** Acquisition and learning remain independently evaluated  
**Required verification:** Source-provenance negative cases pass

### TLM-058 — Fixation and temporary-copy legal lesson

**Dependencies:** TLM-049, TLM-051, TLM-053  
**Implementation:** Explain §101, Cablevision and MAI without fictitious duration cutoff  
**Acceptance criterion:** No absolute 1.2-second immunity or all-RAM-infringing rule  
**Required verification:** Case-specific duration fixtures pass

### TLM-059 — Nonprofit school, private tutoring and for-profit teaching

**Dependencies:** TLM-049, TLM-051, TLM-053  
**Implementation:** Teach §110(1), fair use, public performance and proposed educational expansion  
**Acceptance criterion:** Profit status does not silently rewrite present §110 law  
**Required verification:** Historical and live instruction scenario fixtures pass

### TLM-060 — Contract, security, privacy and confidentiality caveats

**Dependencies:** TLM-049, TLM-051, TLM-053  
**Implementation:** Model independent limits including §1201, privacy and trade secrets  
**Acceptance criterion:** Computational copyright exceptions do not authorize hacking or interception  
**Required verification:** Cross-regime violation fixtures pass

### TLM-061 — Models, archives, output infringement and memorization

**Dependencies:** TLM-035, TLM-049, TLM-051, TLM-053  
**Implementation:** Compare learned parameters, retrievable expression, permanent archive and output liability  
**Acceptance criterion:** Learning permission is not treated as distribution license  
**Required verification:** Negative output and archive cases pass

### TLM-062 — Eighteen-context adversarial legal case library

**Dependencies:** TLM-055, TLM-056, TLM-057, TLM-058, TLM-059, TLM-060, TLM-061  
**Implementation:** Cover filtering, accessibility, caching, networks, search and other described cases  
**Acceptance criterion:** Each case distinguishes actual permission, fair use, license or uncertainty  
**Required verification:** 18 complete source-linked scenario fixtures pass

### TLM-063 — Legal truth-layer and source inspector

**Dependencies:** TLM-049, TLM-050, TLM-054, TLM-062  
**Implementation:** Separate present statutes, interpretations, hypothetical rules, proposed law and independent rights  
**Acceptance criterion:** Every claim supports inspectable citation or flagged uncertainty  
**Required verification:** Browser citation integrity and assistive tests pass

### TLM-064 — Complete education and acquisition lessons

**Dependencies:** TLM-057, TLM-058, TLM-059, TLM-060, TLM-061, TLM-062, TLM-063, TLM-016  
**Implementation:** Publish Modules 4–5 with valid disagreement and alternative paths  
**Acceptance criterion:** Learner distinguishes learning rights from separate legal limits  
**Required verification:** E2E contradictory and accessible paths pass


## P8 — Economic flows and perspectives

**Gate:** Transparent actor-based economics with no invented facts

### TLM-065 — Stakeholders and authorization/information graphs

**Dependencies:** TLM-051, TLM-063  
**Implementation:** Model creator, publisher, learner, developer, user and regulator roles distinctly  
**Acceptance criterion:** Permission, information and money flows cannot be conflated  
**Required verification:** Graph type and actor consistency tests pass

### TLM-066 — Integer-money transaction model

**Dependencies:** TLM-065  
**Implementation:** Use fixed-point minor units, explicit rounding and balanced events  
**Acceptance criterion:** Every monetary transfer conserves modeled balance  
**Required verification:** Overflow, conservation and rounding tests pass

### TLM-067 — Access/fees/licensing scenarios

**Dependencies:** TLM-065, TLM-066  
**Implementation:** Simulate hypothetical lawful access and alternate license structures  
**Acceptance criterion:** Financial consequences follow only declared inputs  
**Required verification:** Deterministic transaction golden tests pass

### TLM-068 — Creator earnings and potential market substitution

**Dependencies:** TLM-066, TLM-067  
**Implementation:** Explore plausible changes in sales, licensing and expressively substitutive demand  
**Acceptance criterion:** All estimates are visibly conditional, not factual verdicts  
**Required verification:** Sensitivity edge cases and uncertainty checks pass

### TLM-069 — Competition and entry-cost analysis

**Dependencies:** TLM-066, TLM-068  
**Implementation:** Model startup entry costs, scale and various access-price assumptions  
**Acceptance criterion:** Alternative assumptions can reverse outcome honestly  
**Required verification:** Scenario comparison property tests pass

### TLM-070 — Assumption provenance and range propagation

**Dependencies:** TLM-065, TLM-066, TLM-068, TLM-069  
**Implementation:** Store evidence classes, ranges and unsupported assumptions for every economic result  
**Acceptance criterion:** Missing evidence never silently becomes a precise forecast  
**Required verification:** Unknown-propagation and boundary tests pass

### TLM-071 — Switchable creator/teacher/developer viewpoints

**Dependencies:** TLM-065, TLM-068, TLM-070  
**Implementation:** Show different interests without altering the factual core of a scenario  
**Acceptance criterion:** Each viewpoint can challenge premise and produce reasoned opposition  
**Required verification:** Role-switch and bias tests pass

### TLM-072 — Module 6: Creator, Student and Market

**Dependencies:** TLM-067, TLM-068, TLM-069, TLM-070, TLM-071, TLM-016  
**Implementation:** Guide visitor through rights, incentives, money and tradeoffs  
**Acceptance criterion:** Learner revises decisions using explicit economic consequences  
**Required verification:** Accessible E2E multi-perspective cases pass


## P9 — Design your own law and transfer

**Gate:** Functional impartial hypothetical law-making studio

### TLM-073 — Compound visitor policy rules and validation

**Dependencies:** TLM-052, TLM-055, TLM-056  
**Implementation:** Support nested conditions and annotations without arbitrary code  
**Acceptance criterion:** Rule meaning survives export, import and edited cases  
**Required verification:** Compiler and boundary tests pass

### TLM-074 — Accessible rule authoring interface

**Dependencies:** TLM-055, TLM-073  
**Implementation:** Build terms, exclusions, carveouts, previews, undo and keyboard navigation  
**Acceptance criterion:** Visitor can create substantively different legislation  
**Required verification:** Multiple-policy UI golden cases pass

### TLM-075 — Multi-policy same-scenario comparison

**Dependencies:** TLM-054, TLM-073, TLM-074  
**Implementation:** Run present law, proposal and visitor rules on identical facts  
**Acceptance criterion:** Results expose exactly which altered rule changed outcome  
**Required verification:** Deterministic differential runs pass

### TLM-076 — Tradeoff and uncertainty visualizations

**Dependencies:** TLM-070, TLM-075  
**Implementation:** Show rights, burdens, exceptions, indeterminate outcomes and actor impact  
**Acceptance criterion:** No political morality or compliance score is fabricated  
**Required verification:** Assumption and accessible chart tests pass

### TLM-077 — Symmetric adversarial stress-test harness

**Dependencies:** TLM-015, TLM-062, TLM-075  
**Implementation:** Challenge any policy with its concrete flaws and counterexamples  
**Acceptance criterion:** Rules aligned with proposed law receive no easier evaluation  
**Required verification:** Neutrality and corner-case fixtures pass

### TLM-078 — Rule history, alternate forks and portable exports

**Dependencies:** TLM-074, TLM-075, TLM-077  
**Implementation:** Enable revision, comparisons and local export of original user hypotheses  
**Acceptance criterion:** Learner revises without losing older experiment evidence  
**Required verification:** History replay and local-only roundtrip tests pass

### TLM-079 — Module 7: Write the Law

**Dependencies:** TLM-073, TLM-074, TLM-075, TLM-076, TLM-077, TLM-078, TLM-016  
**Implementation:** Create real proposed-law challenge and counterexample-driven revision  
**Acceptance criterion:** Multiple valid dissenting drafts can complete module  
**Required verification:** E2E authoring and disagreement paths pass

### TLM-080 — Module 8: Right to Learn capstone

**Dependencies:** TLM-064, TLM-072, TLM-079, TLM-016  
**Implementation:** Integrate technical, legal and economic evidence in novel transfer exercises  
**Acceptance criterion:** Success requires reasoning, never support for sponsor's policy  
**Required verification:** Transfer-rubric and alternative-view acceptance pass


## P10 — Publishing and optional AI assistance

**Gate:** Immutable curated source releases; no mandatory model calls

### TLM-081 — Private publisher authentication and roles

**Dependencies:** TLM-003  
**Implementation:** Implement independent secure admin auth with MFA for privileged publication  
**Acceptance criterion:** Unauthorized editing, access and publishing fail closed  
**Required verification:** CSRF, role escalation and expiry tests pass

### TLM-082 — Curriculum authoring and preview environment

**Dependencies:** TLM-004, TLM-081  
**Implementation:** Edit question graphs, media, accessibility routes and scenarios before release  
**Acceptance criterion:** Private drafts cannot modify immutable public releases  
**Required verification:** Invalid content and editing integration tests pass

### TLM-083 — Evidence integrity and source review workflow

**Dependencies:** TLM-049, TLM-050, TLM-082  
**Implementation:** Review exact U.S. authorities, quoted spans, holdings and legal-status labels  
**Acceptance criterion:** A changed or missing source invalidates dependent public claims  
**Required verification:** Source-change and tampered citation tests pass

### TLM-084 — Media rights registry and secure import

**Dependencies:** TLM-041, TLM-082  
**Implementation:** Track authorized original audio/video and bounded publisher uploads  
**Acceptance criterion:** Unreviewed assets and malicious formats cannot publish  
**Required verification:** Asset signature and unsafe upload tests pass

### TLM-085 — Immutable content packaging, publication and rollback

**Dependencies:** TLM-082, TLM-083, TLM-084  
**Implementation:** Publish hash-bound release bundles atomically with rollback  
**Acceptance criterion:** In-flight release failure leaves prior valid release available  
**Required verification:** Atomic release and CDN consistency tests pass

### TLM-086 — Optional provider-neutral Socratic AI tutor

**Dependencies:** TLM-013, TLM-083  
**Implementation:** Offer constrained voluntary question help backed by offline deterministic fallback  
**Acceptance criterion:** Core lessons remain functional with provider missing or disabled  
**Required verification:** Outage and no-API complete journey tests pass

### TLM-087 — Evidence-grounded tutor and bias controls

**Dependencies:** TLM-083, TLM-086  
**Implementation:** Validate AI output format, lesson evidence, uncertainty and permitted question roles  
**Acceptance criterion:** Invented citations, legal decisions and political steering are rejected  
**Required verification:** Red-team prompt and contradiction evaluation passes

### TLM-088 — Tutor consent, limits and privacy isolation

**Dependencies:** TLM-006, TLM-086, TLM-087  
**Implementation:** Minimize optional data sharing, rate-limit, timeout and cancel safely  
**Acceptance criterion:** Raw browser media never leaves automatically and provider failure does not block learning  
**Required verification:** Privacy and usage budget enforcement tests pass


## P11 — Full acceptance and public deployment

**Gate:** Independently verified accessible production system

### TLM-089 — Optional local progress, export and deletion

**Dependencies:** TLM-006, TLM-016, TLM-085  
**Implementation:** Support local restore, explicit clear and portable learning journey  
**Acceptance criterion:** No account is required and removed application state is not silently restored  
**Required verification:** Import/export, corruption and deletion tests pass

### TLM-090 — Plain-language and localization-ready text

**Dependencies:** TLM-080, TLM-082  
**Implementation:** Author simpler explanations, translation catalog and original-source distinctions  
**Acceptance criterion:** Translations never silently replace official legal authority  
**Required verification:** Missing-locale and source-equivalence tests pass

### TLM-091 — WCAG 2.2 AA whole-platform accessible parity

**Dependencies:** TLM-024, TLM-032, TLM-040, TLM-048, TLM-064, TLM-072, TLM-080  
**Implementation:** Verify equivalent nonvisual, keyboard, reduced-motion and no-audio routes  
**Acceptance criterion:** All eight concepts reachable through equivalent accessible interactions  
**Required verification:** Automated and manual assistive matrix passes

### TLM-092 — Device performance, fallback and offline operation

**Dependencies:** TLM-040, TLM-048, TLM-085  
**Implementation:** Optimize loading, cancel heavy tasks, route around unsupported GPU/audio  
**Acceptance criterion:** Core experiences work in low-power and optional-service-offline modes  
**Required verification:** Reference browsers and performance budgets pass

### TLM-093 — Threat model, secure publishing and privacy audit

**Dependencies:** TLM-081, TLM-084, TLM-085, TLM-088  
**Implementation:** Harden CSP, upload handling, workers, credentials, auth and media defaults  
**Acceptance criterion:** No unresolved serious release-scope vulnerability remains  
**Required verification:** Automated negative security and privacy evidence passes

### TLM-094 — Independent hosting, deploy and recovery drills

**Dependencies:** TLM-085, TLM-092, TLM-093  
**Implementation:** Provision this project's CDN/static site, optional API, staging and rollback  
**Acceptance criterion:** Staging deploy and restored previous release work without other products  
**Required verification:** Deployment and rollback smoke against actual origin passes

### TLM-095 — Eight-module pedagogy, source and narrative acceptance

**Dependencies:** TLM-024, TLM-032, TLM-039, TLM-047, TLM-064, TLM-072, TLM-079, TLM-080, TLM-083, TLM-091  
**Implementation:** Verify every lesson, source caveat, question route and alternate answer  
**Acceptance criterion:** All 8 modules and every accessible route meet learning objectives  
**Required verification:** Full curriculum acceptance ledger and browser replay pass

### TLM-096 — Live production acceptance and release proof

**Dependencies:** TLM-008, TLM-089, TLM-090, TLM-091, TLM-092, TLM-093, TLM-094, TLM-095  
**Implementation:** Verify production origin, complete lesson journey, security, performance and rollback  
**Acceptance criterion:** No launched claim without live deployment URL and exact release evidence  
**Required verification:** Production acceptance log contains tests, revisions and rollback drill


## Completion and launch contract

Every unit must be accepted or explicitly superseded by a tested replacement with equivalent scope. At least eight learner modules must work end-to-end, including disagreement paths and accessible equivalents; legal authorities and assumptions must be labeled, economic calculations reproducible, user media local by default and network services optional. The project is only called **deployed** after production browser, privacy, performance, accessibility and rollback checks run against the actual independent public release.
