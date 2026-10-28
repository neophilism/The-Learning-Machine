# Bounded Policy Rule Compiler

TLM-052 compiles declarative, source-linked policy rules into a deeply frozen data tree. It does not execute uploaded code, decide a legal outcome, certify an authority, or infer missing scenario facts.

Each operative rule requires one or more identifiers from an explicit caller-supplied source registry. Conditions may use only the documented TLM-051 fact paths and the `all`, `any`, `not`, `eq`, `neq`, `in`, and `exists` operators. Unknown operators, facts, effects, source IDs, fields, prototypes, executable values, duplicates, non-finite numbers, and values outside the corresponding TLM-051 fact domain fail closed.

The compiler limits a rule set to 100 rules, 16 sources per rule, six condition levels, 256 condition nodes per rule, 16 members per group, and 32 scalar values per `in` comparison. It preserves authored condition order, sorts source identifiers for stable evidence, and freezes the complete result.

This is a structural compiler boundary only. TLM-053 supplies qualified current-law evaluation, TLM-054 compares frameworks on the same facts, and TLM-055 later supplies controlled visitor authoring.
