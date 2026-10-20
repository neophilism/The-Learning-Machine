# Pixel Operation Trace

TLM-018 rasterizes the validated TLM-017 scene into a real 24 by 16 RGBA frame and executes bounded operations over every pixel. `grayscale` applies integer-rounded relative luminance, `invert` replaces each visible channel with `255 - channel`, and `threshold` converts luminance below 128 to black and all other pixels to white. Alpha stays opaque.

Every step records the operation, changed grid-pixel count and FNV-1a digests of the exact input and output channel arrays. The browser paints the final array directly with `putImageData`; its visible trace comes from the same pure implementation tested against reference frames. These operations do not recognize symbols, estimate accuracy or mask targets. Recognition and masking remain TLM-019 and TLM-020.
