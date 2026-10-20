# Synthetic Icon Recognizer

TLM-019 implements a bounded local recognizer for the four original geometric icon classes. Each scene symbol is rendered into a 9 by 9 binary pixel sample using a 5 by 5 class template at a position derived from the symbol's scene coordinates. Recognition scans all 25 valid template positions and selects a class only when intersection-over-union reaches the declared threshold.

TLM-021 makes evaluation inspectable rather than presenting a single accuracy claim. The browser computes true positives, false positives, false negatives and true negatives from the actual sample labels, exposes the precision and recall numerators and denominators, and marks scores within five percentage points of the selected threshold as uncertain. A deterministic one-pixel challenge changes the real binary samples before recognition, so threshold changes produce recalculated misses instead of scripted outcomes.

Precision is not applicable when no sample is predicted as the target; recall is not applicable when no actual target exists. These zero-denominator cases, deliberate false positives, strict-threshold misses and malformed metric inputs have regression coverage.

This unit detects synthetic icon classes only. It does not use webcam input, run work in a Worker or claim general object recognition; those remain TLM-023, TLM-022 and later acceptance work.
