# TLM-053: Qualified Current-Law Evaluation

`evaluateCurrentLaw` combines a validated TLM-051 U.S.-federal current scenario, a TLM-052 current-law rule set, and the dated TLM-049 authority catalog. It returns a deeply frozen trace; it does not provide legal advice or infer a rule not present in the curated input.

## Outcome contract

- A rule is `matched`, `not-matched`, or `unknown` under three-valued evaluation.
- Null and declared-unknown material facts never satisfy an operative comparison. Mixed copyright statuses across works are unresolved because the bounded rule language has no work selector.
- A sole supported effect can produce `permit`, `restrict`, or `conditional`. A matched `unresolved` rule remains unresolved.
- Conflicting applicable effects produce `disputed`; no match or any material unknown produces `unresolved`.
- Each rule trace includes exact citations, HTTPS source links, issue dates, and scope limitations.
- Authorities issued after the scenario date cannot decide it. A scenario after the catalog baseline remains unresolved until the source pack is refreshed.

## Boundary

Only `status: current`, `jurisdiction: US-federal` scenarios and `framework: current-law` rules are accepted. Scenario and rule source IDs must exist in the supplied catalog, and every rule source must be declared by the scenario. The evaluator never treats all computational learning as categorically lawful or unlawful, never upgrades district authority into a universal rule, and never silently applies proposed or hypothetical law.
