# Socratic runtime (TLM-005)

The runtime executes compiled module edges deterministically and does not ask a model to hallucinate available paths. Each learner action updates a frozen session snapshot. Sessions are tied to the compiled release digest, and a mismatched release fails closed. Replays require the identical compiled module and the original bounded action list.

- `ANSWER`: free-form reasoning at any authored stage; no political agreement grading.
- `NEXT`: chooses a unique authorized `always` branch, or an explicit allowed target.
- `CHOOSE`: chooses an explicitly authored `alternative` branch.
- `RETRY`: traverses an explicit retry edge, including intentional experiment loops.
- `OBSERVE`: records validated measured/computed/simulated observations only at experiment/observation stages; a measured value needs a source reference.
- `BACK`/`RESET`/`SKIP`: learner-directed navigation, with no implied fabricated observation.
- `REQUEST_EXPLANATION`: provides the authored on-request branch, or a reflection-stage fallback where authored.

A `correct`-gated branch is **not** authorized from a visitor's self-declared success. Grounded experimental verification is added in a later unit. The engine never creates the results of experiments or changes the governing legal facts. The UI uses this runtime after subsequent integration work.

## Authored counterexamples (TLM-015)

Challenge nodes may provide a bounded, validated set of concrete counterexamples. The deterministic selector matches only declared technical trigger terms in the learner's latest hypothesis and otherwise uses a neutral authored fallback. It returns the challenged hypothesis ID, matched terms, source and a competing technical approach. Political support or opposition is never a trigger, score or completion condition, so opposing positions receive the same fallback scrutiny when they make the same technical assumptions. Counterexamples remain authored content tied to the compiled release digest; the runtime does not invent facts or silently grade agreement.
