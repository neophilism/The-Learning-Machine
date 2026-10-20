# Vision Worker Runtime

TLM-022 moves the TLM-018 pixel pipeline and TLM-021 synthetic-icon evaluation off the browser main thread. Each request receives a monotonically increasing identifier and a maximum 750 ms wall-clock budget. Starting a newer request, resetting the pixel pipeline or unmounting the experience terminates the prior Worker. A response can update the interface only when its identifier still belongs to the active request.

The Worker imports the same bounded, deterministic pixel and recognition functions used by Node fixtures. It returns computed RGBA frames, trace digests and confusion reports; the presentation layer does not invent replacement results. Worker exceptions are reduced to a bounded public error, while timeouts terminate the worker and fail closed.

Controller tests exercise supersession, reset races, late stale replies, timeout termination, malformed budgets and worker failures. Browser coverage drives rapid threshold changes and a run-reset sequence against the actual bundled Worker. This runtime does not request webcam access, upload frames, provide parallel unbounded execution or prove performance on every device. Gesture-gated local webcam capture remains TLM-023.
