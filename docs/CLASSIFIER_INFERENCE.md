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
