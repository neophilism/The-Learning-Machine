# Experiment provenance, reproducibility and replay (TLM-006)

`createExperimentRun` validates the experiment definition, normalizes a bounded plain JSON input, and computes an SHA-256 run identity from its id, algorithm version, engine version, seed and canonical input. A run is frozen and append-only. `appendExperimentObservation` uses the observation schema, rejects ungrounded measured labels and cross-run attribution, but it is **not** proof that a source identifier itself is truthful; only an instrumented experiment implementation can provide that assurance. `sealExperimentRun` creates a content digest and terminal result; sealed runs cannot be appended.

A named seeded xorshift32 pseudorandom stream is available for transparent deterministic educational experiments. Statistical validity, CPU/GPU floating-point tolerances and real measurement instrumentation are implementation-level responsibilities of later units. `compareExperimentRuns` compares recorded results under an equivalent declared configuration and explicitly reports noncomparability.

The public application never transmits raw media by default. Inputs are size/depth bounded and reject cyclic, nonfinite, executable, prototype-bearing or otherwise non-JSON values.
