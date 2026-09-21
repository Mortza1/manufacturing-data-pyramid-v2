import { Router, type IRouter } from "express";
import {
  and,
  desc,
  eq,
} from "drizzle-orm";
import {
  CreateV2ProjectBody,
  CreateV2ProjectVersionBody,
  CreateV2UserBody,
} from "@workspace/api-zod";
import {
  db,
  projectVersionsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected persistence error";
}

function validateSnapshot(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object") return "A project snapshot is required.";
  const candidate = snapshot as {
    format?: unknown;
    schemaVersion?: unknown;
    case?: {
      levels?: Array<{ id: string }>;
      sectors?: Array<{ id: string }>;
      grid?: { width: number; height: number };
      overlays?: {
        data?: Array<{ id: string; level_id: string; sector_id: string; grid_x: number; grid_y: number }>;
        models?: Array<{ id: string; level_id: string; sector_id: string; grid_x: number; grid_y: number }>;
        agents?: Array<{ id: string; level_id: string; sector_id: string; grid_x: number; grid_y: number }>;
        decisions?: Array<{ id: string; level_id: string; sector_id: string; grid_x: number; grid_y: number }>;
        loops?: Array<{ id: string }>;
        connectivity?: Array<{ loop_id: string; sequence: number; source_object_id: string; target_object_id: string }>;
      };
    };
  };
  if (candidate.format !== "manufacturing-data-pyramid-v2" || candidate.schemaVersion !== 1) {
    return "Unsupported snapshot format or schema version.";
  }
  const projectCase = candidate.case;
  if (!projectCase?.grid || !projectCase.overlays) return "Snapshot is missing its case or overlays.";
  const levelIds = new Set((projectCase.levels || []).map((level) => level.id));
  const sectorIds = new Set((projectCase.sectors || []).map((sector) => sector.id));
  const objectIds = new Set<string>();
  const allObjects = [
    ...(projectCase.overlays.data || []),
    ...(projectCase.overlays.models || []),
    ...(projectCase.overlays.agents || []),
    ...(projectCase.overlays.decisions || []),
  ];
  for (const object of allObjects) {
    if (objectIds.has(object.id)) return `Duplicate object ID: ${object.id}`;
    objectIds.add(object.id);
    if (!levelIds.has(object.level_id) || !sectorIds.has(object.sector_id)) {
      return `Object ${object.id} references a missing level or sector.`;
    }
    if (
      object.grid_x < 0 ||
      object.grid_y < 0 ||
      object.grid_x >= projectCase.grid.width ||
      object.grid_y >= projectCase.grid.height
    ) {
      return `Object ${object.id} is outside the canonical grid.`;
    }
  }
  const loopIds = new Set((projectCase.overlays.loops || []).map((loop) => loop.id));
  const segmentIds = new Set<string>();
  for (const segment of projectCase.overlays.connectivity || []) {
    if (segmentIds.has(segment.sequence + ":" + segment.loop_id)) {
      return `Duplicate segment sequence in loop ${segment.loop_id}.`;
    }
    segmentIds.add(segment.sequence + ":" + segment.loop_id);
    if (!loopIds.has(segment.loop_id)) return `Segment references a missing loop: ${segment.loop_id}`;
    if (!objectIds.has(segment.source_object_id) || !objectIds.has(segment.target_object_id)) {
      return `Segment references a missing source or target object.`;
    }
  }
  return null;
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  return user;
}

function serializeProject(project: typeof projectsTable.$inferSelect) {
  return project;
}

function serializeVersion(version: typeof projectVersionsTable.$inferSelect) {
  return version;
}

router.get("/users", async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.displayName);
    res.json({ users: users.map(serializeUser) });
  } catch (error) {
    res.status(500).json({ error: errorMessage(error) });
  }
});

router.post("/users", async (req, res) => {
  const parsed = CreateV2UserBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.displayName.trim()) {
    res.status(400).json({ error: "A non-empty display name is required." });
    return;
  }
  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.displayName, parsed.data.displayName.trim()))
      .limit(1);
    if (existing[0]) {
      res.json(serializeUser(existing[0]));
      return;
    }
    const [user] = await db
      .insert(usersTable)
      .values({ displayName: parsed.data.displayName.trim() })
      .returning();
    res.status(201).json(serializeUser(user));
  } catch (error) {
    res.status(500).json({ error: errorMessage(error) });
  }
});

router.post("/projects", async (req, res) => {
  const parsed = CreateV2ProjectBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.projectName.trim() || (!parsed.data.ownerUserId && !parsed.data.userName?.trim())) {
    res.status(400).json({ error: "Project identity and a complete snapshot are required." });
    return;
  }
  const snapshotError = validateSnapshot(parsed.data.snapshot);
  if (snapshotError) {
    res.status(400).json({ error: snapshotError });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      let user = parsed.data.ownerUserId
        ? (await tx.select().from(usersTable).where(eq(usersTable.id, parsed.data.ownerUserId)).limit(1))[0]
        : undefined;
      if (!user && parsed.data.ownerUserId) {
        throw new Error("Selected user was not found.");
      }
      if (!user) {
        const displayName = parsed.data.userName?.trim();
        if (!displayName) throw new Error("A user name is required.");
        user = (await tx.select().from(usersTable).where(eq(usersTable.displayName, displayName)).limit(1))[0];
        if (!user) {
          user = (await tx.insert(usersTable).values({ displayName }).returning())[0];
        }
      }
      const projectName = parsed.data.projectName.trim();
      const existingProject = await tx
        .select()
        .from(projectsTable)
        .where(and(eq(projectsTable.ownerUserId, user.id), eq(projectsTable.name, projectName)))
        .limit(1);
      if (existingProject[0]) {
        throw new Error("A project with this name already exists for this user.");
      }
      const [project] = await tx
        .insert(projectsTable)
        .values({
          ownerUserId: user.id,
          name: projectName,
          description: parsed.data.description?.trim() || "",
        })
        .returning();
      const [version] = await tx
        .insert(projectVersionsTable)
        .values({
          projectId: project.id,
          versionNumber: 1,
          snapshot: parsed.data.snapshot,
          snapshotSchemaVersion: parsed.data.snapshot.schemaVersion,
          versionNote: parsed.data.versionNote?.trim() || "",
          creatorUserId: user.id,
        })
        .returning();
      const [updatedProject] = await tx
        .update(projectsTable)
        .set({ currentVersionId: version.id, updatedAt: new Date() })
        .where(eq(projectsTable.id, project.id))
        .returning();
      return { project: updatedProject, version };
    });
    res.status(201).json({
      project: serializeProject(result.project),
      version: serializeVersion(result.version),
    });
  } catch (error) {
    const message = errorMessage(error);
    res.status(message.includes("already exists") ? 409 : 400).json({ error: message });
  }
});

router.post("/projects/:projectId/versions", async (req, res) => {
  const parsed = CreateV2ProjectVersionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A creator and complete snapshot are required." });
    return;
  }
  const snapshotError = validateSnapshot(parsed.data.snapshot);
  if (snapshotError) {
    res.status(400).json({ error: snapshotError });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const project = (await tx
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.id, req.params.projectId))
        .limit(1))[0];
      if (!project) throw new Error("Project not found.");
      const creator = (await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, parsed.data.creatorUserId))
        .limit(1))[0];
      if (!creator) throw new Error("Creator user was not found.");
      const latest = await tx
        .select()
        .from(projectVersionsTable)
        .where(eq(projectVersionsTable.projectId, project.id))
        .orderBy(desc(projectVersionsTable.versionNumber))
        .limit(1);
      const [version] = await tx
        .insert(projectVersionsTable)
        .values({
          projectId: project.id,
          versionNumber: (latest[0]?.versionNumber || 0) + 1,
          snapshot: parsed.data.snapshot,
          snapshotSchemaVersion: parsed.data.snapshot.schemaVersion,
          versionNote: parsed.data.versionNote?.trim() || "",
          creatorUserId: creator.id,
        })
        .returning();
      const [updatedProject] = await tx
        .update(projectsTable)
        .set({ currentVersionId: version.id, updatedAt: new Date() })
        .where(eq(projectsTable.id, project.id))
        .returning();
      return { project: updatedProject, version };
    });
    res.status(201).json({
      project: serializeProject(result.project),
      version: serializeVersion(result.version),
    });
  } catch (error) {
    const message = errorMessage(error);
    res.status(message === "Project not found." || message === "Creator user was not found." ? 404 : 400).json({ error: message });
  }
});

router.get("/projects/:projectId/versions/:versionId", async (req, res) => {
  try {
    const version = (await db
      .select()
      .from(projectVersionsTable)
      .where(and(
        eq(projectVersionsTable.projectId, req.params.projectId),
        eq(projectVersionsTable.id, req.params.versionId),
      ))
      .limit(1))[0];
    if (!version) {
      res.status(404).json({ error: "Project version not found." });
      return;
    }
    const project = (await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, version.projectId))
      .limit(1))[0];
    if (!project) {
      res.status(404).json({ error: "Project not found." });
      return;
    }
    res.json({
      project: serializeProject(project),
      version: serializeVersion(version),
    });
  } catch (error) {
    res.status(500).json({ error: errorMessage(error) });
  }
});

export default router;