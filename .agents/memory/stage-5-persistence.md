---
name: Stage 5 persistence
description: Durable rules for Manufacturing Data Pyramid project/version saves.
---

Stage 5 saves should keep the complete V2 case as one validated immutable JSONB snapshot in a User → Project → Project Version model. Database project version numbers are separate from snapshot schema versions and Zustand storage migration versions.

**Why:** The case already contains stable IDs, canonical grid placement, metadata, loops, and ordered segments; an atomic snapshot preserves exact reopen behavior without reconstructing a historical case from partially normalized rows.

**How to apply:** Validate the snapshot server-side before insertion, append versions rather than updating history, keep local Zustand persistence as the working draft, and avoid putting camera, hover, or other transient presentation state in the core snapshot.