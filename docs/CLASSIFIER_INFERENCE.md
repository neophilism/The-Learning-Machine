# Classifier inference contract

TLM-028 exposes predictions from the real browser-local multiclass softmax model introduced by TLM-027.

- Training consumes only the IDs in the selected training partition.
- Held-out evaluation classifies the split's test IDs and rejects a model trained from a different split.
- A visitor may change the current 16 by 16 drawing and request a new prediction without adding that drawing to training.
- The interface displays every class score, the top-scoring label, and the exact held-out numerator and denominator.
- Scores are relative outputs from learned parameters. They are not calibrated certainty, semantic proof, or evidence of generalization beyond similar examples.
- Drawings, labels, learned weights, and predictions stay in the browser; this path performs no network write.

Unit fixtures verify holdout membership, normalized scores, parameter-derived changes, reproducibility, and mismatched-split rejection. Desktop and mobile browser coverage exercises held-out and fresh-drawing inference plus the zero-write-network boundary.

## Balanced held-out metrics

TLM-029 derives a square confusion matrix from each held-out example's actual and predicted labels. Rows are actual classes and columns are predicted classes. Per-class precision is true positives divided by all examples predicted as that class; recall is true positives divided by all held-out examples whose actual label is that class. The interface always shows the integer counts and both numerators and denominators.

A zero denominator is displayed as not available rather than as an invented zero percent. Unknown class labels, duplicate metric labels and malformed metric inputs fail closed. Unit fixtures cover imbalanced class counts and empty actual/predicted classes; desktop and mobile browser coverage verifies the accessible table and per-class evidence.


## Memorization versus generalization trials

TLM-030 adds a deterministic nearest-example baseline beside the existing learned softmax parameters. The memorizer keeps every selected training drawing and predicts the label of the example with the smallest binary-pixel Hamming distance. Exact-distance ties are visible and resolve by stable example ID so replay is deterministic.

The comparison rejects either method unless its training IDs exactly match the selected split. Both methods then receive the same ordered held-out IDs. Each row exposes the actual label, both predictions, independent success/failure flags, disagreement, nearest distance and tie status. Aggregate counts are derived from those rows.

This trial demonstrates behavior on one small local split. Agreement or success is not proof of generalization, semantic understanding or performance on different drawings. A mislabeled or unusual held-out example can make either method fail. Drawings, stored examples, learned weights and comparison evidence remain browser-local, with no network write.
