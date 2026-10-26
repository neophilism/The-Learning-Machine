# Teach a Machine lesson contract

TLM-032 assembles the existing browser-local classification primitives into one auditable lesson route at `/shapes`.

## Learning sequence

1. The visitor creates labeled 16 by 16 binary drawings and states a testable expectation.
2. A seeded stratified split reserves example IDs that the learner cannot train on.
3. The real multinomial logistic classifier trains locally and reports its numerical training history.
4. Held-out inference, a nearest-example comparison, and optional declared perturbations expose successes, failures, disagreements, and label integrity.
5. The visitor records an evidence-based revision. Recording a revision invalidates the split and model, requiring a fresh split and retraining rather than rewriting a prior result.
6. The retrained model evaluates a current drawing that is not automatically added to the training set, providing a bounded transfer attempt.

## Boundaries

All drawings, free text, model parameters, and lesson state stay in the page session. The route makes no network write, accuracy guarantee, calibrated-confidence claim, or claim of generalization beyond the selected examples. Resetting or leaving the page discards the lesson state.

## Verification

`tests/browser/teach-machine.spec.mjs` completes the sequence with named controls and regions, verifies every progress step, and rejects browser POST requests. Existing classifier, holdout, memorization, perturbation, keyboard, desktop, and mobile coverage remains authoritative for the underlying primitives.
