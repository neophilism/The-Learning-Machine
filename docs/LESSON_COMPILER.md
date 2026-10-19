# Content compiler contract (TLM-004)

Authored learning modules use `@learning-machine/contracts` v1 and compile into immutable tagged graph releases. Compiling checks every edge target, unique node identifiers, start-stage semantics, terminal nodes, reachable content, graph paths to at least one completion (no trapped cycles), duplicate edges, declared concept coverage and a required textual/keyboard-accessible alternative for experiment stages. Cycles with exits are allowed to support repeat experiments.

The compiler produces stable SHA-256 content digests independent of JSON object property order. It does not execute authored JavaScript, accept runtime code, evaluate learner guesses or declare legal outcomes. Runtime execution and enhanced Socratic transitions belong to TLM-005 and subsequent units.

Run `pnpm content:check` for checked-in lesson packs and `pnpm check` for all standard validation. Published lesson releases in later units must pin the source content digest and the runtime compiler version.
