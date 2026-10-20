# Classifier inference contract

TLM-028 exposes predictions from the real browser-local multiclass softmax model introduced by TLM-027.

- Training consumes only the IDs in the selected training partition.
- Held-out evaluation classifies the split's test IDs and rejects a model trained from a different split.
- A visitor may change the current 16 by 16 drawing and request a new prediction without adding that drawing to training.
- The interface displays every class score, the top-scoring label, and the exact held-out numerator and denominator.
- Scores are relative outputs from learned parameters. They are not calibrated certainty, semantic proof, or evidence of generalization beyond similar examples.
- Drawings, labels, learned weights, and predictions stay in the browser; this path performs no network write.

Unit fixtures verify holdout membership, normalized scores, parameter-derived changes, reproducibility, and mismatched-split rejection. Desktop and mobile browser coverage exercises held-out and fresh-drawing inference plus the zero-write-network boundary.
