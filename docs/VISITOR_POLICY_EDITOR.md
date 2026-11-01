# First visitor policy editor

TLM-055 introduces one bounded, browser-local hypothetical rule. It does not publish current law, proposed-bill text, or legal advice.

The editor controls one effect and exactly six factual terms: access method, lawful access, intermediate copying, retention duration, teaching, and output distribution. It compiles those terms through the existing policy-rule compiler, labels the source as `visitor-authored-hypothesis`, and exports canonical JSON. Import accepts only this first-editor shape; extra fields, arbitrary conditions, alternate frameworks, unknown source labels, and out-of-range values fail closed.

The preview holds a labeled fact snapshot constant and reports every term's expected value, actual value, and match status. The selected effect becomes the outcome only when all terms match. A mismatch or unknown material fact stays unresolved. The editor therefore demonstrates a rule-driven difference without silently changing facts or presenting the visitor's choice as legal authority.

The page stores no rule remotely. Its JSON remains in the page unless the visitor deliberately saves it outside the application. Later compound-rule, exception, conflict, and multi-policy work remains in TLM-073 through TLM-078.

