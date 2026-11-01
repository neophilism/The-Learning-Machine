# Legal conflict and precedence oracles

TLM-056 resolves a bounded set of already evaluated current-law rules. It does not invent authority, infer missing facts, rank policy preferences, or replace legal review.

The resolver accepts the immutable TLM-053 evaluation and an explicit precedence oracle. Every precedence decision names one higher rule, one or more lower rules, a rationale, and authority identifiers already cited in the evaluated scenario. Unknown rule identifiers, uncited sources, duplicate identifiers, stray fields, self-precedence, and cyclic precedence fail closed.

Unknown rule applicability always remains unresolved. Without an acyclic sourced path from a non-ambiguous matched rule to every matched rule with a competing effect, the evaluator's original disputed or unresolved result is preserved. A decisive result is returned only when all surviving winner rules have the same effect and collectively dominate every competing matched effect.

Nested exceptions and carveouts are represented as ordinary bounded policy rules whose conditions are compiled by TLM-052. The precedence oracle orders only rules that actually matched the same validated facts. This keeps exceptions, ambiguity, and competing holdings inspectable without adding arbitrary code or a universal legal shortcut.
