# Local musical pattern classifier

TLM-044 adds a deterministic multiclass softmax learner for small, original melodies. `trainMusicalPatternClassifier` accepts explicit, disjoint training and holdout IDs. Every class must occur in both sets, and evaluation refuses a model whose recorded training IDs do not match the supplied split.

The eight bounded inputs are mean detected pitch, detected pitch range, mean detected interval, ascending and repeated interval ratios, authored mean note length, authored tempo, and waveform-derived spectral centroid. Pitch and spectral values come from the locally synthesized PCM analysis in `features.mjs`; timing fields are explicitly score-derived. The model does not claim genre, authorship, musical quality, or performance outside the supplied examples.

`classifyMusicalPattern` extracts the same features from a new melody and computes probabilities from learned numerical parameters. It never stores raw audio, sends media over a network, or substitutes a scripted label. Melodies must contain at least two notes, resolve every bounded pitch frame, and fit the existing 12-second local analysis window.

`evaluateMusicalHoldout` reports predictions only for IDs excluded from training. Tests cover two independently authored rising/falling families, novel melodies, exact held-out IDs, split leakage, missing held-out classes, model/split mismatch, and bounded-window failure.
