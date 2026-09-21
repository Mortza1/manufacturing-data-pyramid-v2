import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "v2_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    displayNameUnique: uniqueIndex("v2_users_display_name_unique").on(table.displayName),
  }),
);

export const projectsTable = pgTable(
  "v2_projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerUserId: uuid("owner_user_id").notNull().references(() => usersTable.id),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerNameUnique: uniqueIndex("v2_projects_owner_name_unique").on(table.ownerUserId, table.name),
    ownerUpdatedIndex: index("v2_projects_owner_updated_idx").on(table.ownerUserId, table.updatedAt),
  }),
);

export const projectVersionsTable = pgTable(
  "v2_project_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull().references(() => projectsTable.id),
    versionNumber: integer("version_number").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    snapshotSchemaVersion: integer("snapshot_schema_version").notNull().default(1),
    versionNote: text("version_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    creatorUserId: uuid("creator_user_id").notNull().references(() => usersTable.id),
  },
  (table) => ({
    projectVersionUnique: uniqueIndex("v2_project_versions_project_version_unique").on(table.projectId, table.versionNumber),
    projectCreatedIndex: index("v2_project_versions_project_created_idx").on(table.projectId, table.createdAt),
  }),
);

export type V2User = typeof usersTable.$inferSelect;
export type V2Project = typeof projectsTable.$inferSelect;
export type V2ProjectVersion = typeof projectVersionsTable.$inferSelect;