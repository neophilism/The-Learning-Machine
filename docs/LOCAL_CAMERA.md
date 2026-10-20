# Local Camera Privacy Boundary

TLM-023 adds an optional browser-local camera input to the vision laboratory. The page does not request permission during load or hydration. `getUserMedia` is called only by the visitor's **Start local camera** button, with video enabled and audio disabled.

The returned stream is attached only to the page's local video element. **Capture one local frame** copies one frame into a local canvas and calculates a non-cryptographic display digest in memory. There is no upload, recording, persistence, analytics or remote inference path. Stopping, revocation, supersession and component unmount stop all media tracks and detach the preview.

Permission denial, missing devices, invalid streams and revoked tracks fail closed with bounded public status messages. The synthetic-scene controls remain the accessible no-camera alternative. Unit tests cover gesture isolation, denied permission, invalid streams, track cleanup and revocation; browser tests cover denial, revocation, local capture and zero network requests after camera activation.
