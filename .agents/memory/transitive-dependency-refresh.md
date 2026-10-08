---
name: Transitive dependency refresh
description: pnpm update depth behavior when remediating locked transitive vulnerabilities.
---

Use a numeric depth (for example, `--depth 100`) when updating transitive dependencies, and confirm the resulting versions with a fresh dependency audit.

**Why:** With this workspace's pnpm toolchain, `--depth Infinity` finished successfully but retained several vulnerable transitive versions. A numeric depth refreshed them within their existing compatible ranges.

**How to apply:** During dependency remediation, inspect the resolved lockfile rather than treating a successful update command as proof that every requested package was upgraded. Preserve the release-age safeguard.
