---
name: Stage 4 loop model
description: Durable decision for Manufacturing Data Pyramid Stage 4 relationship modeling and migration.
---

Stage 4 relationships are modeled as first-class loops with stable loop metadata; directional connections are ordered segments that reference a loop.

**Why:** The user-facing workflow is continuous loop construction, selection, visibility, and ordered-path review. Keeping a loop name and colour on each segment makes those behaviors fragile and risks losing existing relationships during refactors.

**How to apply:** Preserve segment IDs and endpoint IDs when changing the model. Migrate legacy grouped connections by normalized loop name, assign deterministic segment order, and keep visibility filters presentation-only.