import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, text, integer } from "drizzle-orm/pg-core";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: text("username").unique(), // Added
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // App specific fields
  role: text("role").notNull().default("auditor"), // admin, auditor, client
  tier: text("tier").notNull().default("observer"), // observer, contributor, reviewer, lead, core
  status: text("status").notNull().default("applied"), // applied, probation, active, removed
  reputationScore: integer("reputation_score").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
