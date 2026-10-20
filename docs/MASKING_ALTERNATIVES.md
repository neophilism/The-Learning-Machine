# Masking Alternatives

TLM-020 renders three distinct browser-local pixel outputs. Manual mode masks one explicitly selected grid cell. Blanket mode masks every occupied scene pixel by inspecting channel values and performs zero recognition runs. Selective mode renders each synthetic icon sample, invokes the TLM-019 recognizer and masks only predictions matching the selected target.

The result records the exact masked-pixel count and recognition-run count so the interface cannot imply that blanket masking requires object recognition. Confusion metrics, worker execution and webcam input remain TLM-021 through TLM-023.
