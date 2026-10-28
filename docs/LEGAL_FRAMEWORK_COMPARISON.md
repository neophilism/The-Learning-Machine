# Same-facts legal framework comparison

TLM-054 compares current United States law and a separately labeled proposed bill against one validated `LegalScenario`. The API accepts one scenario, stores one immutable fact snapshot in its result, and changes only the rule framework. Actors, works, access, copying, retention, teaching, outputs, and declared unknowns therefore cannot diverge between sides. Economic assumptions are not part of this legal scenario and cannot be injected through the comparison API.

Current-law evaluation retains TLM-053's dated, source-linked qualifications. Proposed rules must use the `proposed-law` framework and cite exact provision IDs from a TLM-050 record that passes the approved-proposal boundary. The proposal is always labeled as not enacted law.

The repository currently carries an incomplete draft placeholder with no authoritative full text or provisions. In that state the comparison returns `unresolved` with `authoritative-proposal-unavailable`, exposes no operative proposal rules, and rejects any supplied proposed rule set. Test-only approved proposal fixtures exercise differential outcomes without publishing fictional text as repository content.

The output reports an outcome difference only when the two bounded rule frameworks produce different outcomes. Unknown material facts stay unknown on both sides, and unsupported frameworks or source IDs fail closed.
