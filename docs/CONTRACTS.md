# Contracts — version 1.0.0

The contract package exports dependency-free runtime validators from `@learning-machine/contracts` and TypeScript declarations as an independent package. The companion `contracts.schema.json` uses JSON Schema 2020-12 for interoperability; runtime validation enforces core shapes and additional integrity requirements. JSON Schema's `format` is annotation unless a consuming validator explicitly enables format assertions.

### Domain boundaries

- Learning module nodes contain an authored stage, a prompt and explicit outgoing edges. Structural and reachability compilation belongs to TLM-004.
- An observation must label itself measured, computed, simulated or unknown; a measured record also needs a source identifier.
- Legal scenarios and rules distinguish enacted/current, proposed, hypothetical and learner-authored content. A legal scenario is fixed to a dated U.S.-federal evaluation and carries typed actors, works, access, copying, retention, teaching and outputs. Every nullable or `unknown` material fact must have an exact `declaredUnknowns` path; hidden omissions, dangling actor/work references and contradictory states fail closed. Source IDs alone do not certify a legal claim.
- Experiments state capabilities and time budgets, but they are not treated as executed solely because the definition exists.
- Published release digests are 64 lowercase hexadecimal characters and do not in themselves prove that a source has been authenticated.

All values are validated at entry and cloned/frozen before other packages see them. No user-defined JavaScript, unbounded object graphs, or executable rule strings are accepted. This package imports no UI or external application services.
