# Synthetic Vision Scene Contract

TLM-017 introduces deterministic, browser-local scene inputs. A scene contains at most 12 original geometric primitives on a 24 by 16 integer grid. Its seed, ordered shape kind, color and coordinate tuple are the canonical snapshot; there are no logos, uploaded images or third-party assets.

The Canvas and SVG views are two renderings of the same immutable scene. The SVG carries a full `title` and `desc`, and the visible ordered description identifies every primitive's color, shape, column and row. Keyboard users can add the same primitives through native controls. These views are inputs only: TLM-017 does not claim pixel transformation, automated recognition, masking or measured accuracy. Those behaviors belong to TLM-018 onward.
