# Synthetic Icon Recognizer

TLM-019 implements a bounded local recognizer for the four original geometric icon classes. Each scene symbol is rendered into a 9 by 9 binary pixel sample using a 5 by 5 class template at a position derived from the symbol's scene coordinates. Recognition scans all 25 valid template positions and selects a class only when intersection-over-union reaches the declared threshold.

The target evaluator derives true-positive, false-positive, false-negative and true-negative counts from the actual sample labels, then computes precision and recall from those counts. Golden fixtures place targets and distractors at edges, corners and interior offsets. Blank, malformed, corrupted and out-of-bounds inputs fail closed or produce no class.

This unit detects synthetic icon classes only. It does not mask pixels, present an accuracy lesson, use webcam input or claim general object recognition; those remain TLM-020, TLM-021 and TLM-023.
