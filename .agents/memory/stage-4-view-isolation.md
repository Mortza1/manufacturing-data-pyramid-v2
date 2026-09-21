---
name: Stage 4 view isolation
description: Durable separation between 2D presentation state, 3D filtering, and persisted walkthrough case data.
---

2D loop selection is a presentation concern and must remain separate from the 3D All Loops / Show Only This Loop state. The Walkthrough panel collapse state is also ephemeral presentation state and should not be persisted as case data.

**Why:** Stage 4 supports two different visualisations of the same ordered loop model; changing one view should not surprise users by changing the other, and responsive panel presentation should adapt to the current session rather than travel with the case.

**How to apply:** Keep 2D selection in its own store field, avoid changing the 3D selected loop when selecting 2D connections, and omit panel collapse state from persistence and restart data.

For 3D Connections, loop selection should only emphasise a loop; explicit isolation controls connection and data visibility. Pyramid sector surfaces remain present with one shared Surface Opacity value, and route connections use a dense continuous Light → Dark gradient without arrowheads.

**Why:** The pyramid is structural context, while loop isolation is a data/connection filter; conflating the two makes the 3D view misleading.

**How to apply:** Keep sector rendering independent of `showOnlyLoopId` in Stage 4, and sample curved routes densely enough that geometry and colour interpolation read as one continuous path.