import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

export const auditorProfiles = pgTable("auditor_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  wallet: text("wallet"),
  proofLinks: jsonb("proof_links").$type<string[]>(),
  skillsTags: jsonb("skills_tags").$type<string[]>(),
  notes: text("notes"),
});

export const vettingApplications = pgTable("vetting_applications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
  links: jsonb("links").$type<string[]>(),
  writeupText: text("writeup_text"),
  score: integer("score"),
  decision: text("decision").default("pending"), // pending, accepted, rejected
  reviewerUserId: varchar("reviewer_user_id").references(() => users.id),
  comments: text("comments"),
});

export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  clientName: text("client_name").notNull(),
  scopeText: text("scope_text").notNull(),
  repoUrl: text("repo_url"),
  chain: text("chain"),
  status: text("status").notNull().default("intake"), // intake, in_progress, review, finalized
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditAssignments = pgTable("audit_assignments", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull().references(() => audits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  assignmentType: text("assignment_type").notNull(), // lead, reviewer
  createdAt: timestamp("created_at").defaultNow(),
});

export const findings = pgTable("findings", {
  id: serial("id").primaryKey(),
  auditId: integer("audit_id").notNull().references(() => audits.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // info, low, medium, high, critical
  category: text("category"),
  reproSteps: text("repro_steps"),
  impact: text("impact"),
  recommendation: text("recommendation"),
  status: text("status").notNull().default("draft"), // draft, needs_review, approved, rejected
  createdByUserId: varchar("created_by_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const findingReviews = pgTable("finding_reviews", {
  id: serial("id").primaryKey(),
  findingId: integer("finding_id").notNull().references(() => findings.id),
  reviewerUserId: varchar("reviewer_user_id").notNull().references(() => users.id),
  decision: text("decision").notNull(), // approve, reject, request_changes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reputationEvents = pgTable("reputation_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // finding_accepted, finding_rejected, review_completed, false_positive_caught, escalation_resolved
  points: integer("points").notNull(),
  auditId: integer("audit_id").references(() => audits.id),
  findingId: integer("finding_id").references(() => findings.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(auditorProfiles, { fields: [users.id], references: [auditorProfiles.userId] }),
  vettingApplication: one(vettingApplications, { fields: [users.id], references: [vettingApplications.userId] }),
  assignments: many(auditAssignments),
  findings: many(findings),
  reputationEvents: many(reputationEvents),
}));

export const auditRelations = relations(audits, ({ many }) => ({
  assignments: many(auditAssignments),
  findings: many(findings),
}));

export const findingRelations = relations(findings, ({ one, many }) => ({
  audit: one(audits, { fields: [findings.auditId], references: [audits.id] }),
  author: one(users, { fields: [findings.createdByUserId], references: [users.id] }),
  reviews: many(findingReviews),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, reputationScore: true });
export const insertAuditorProfileSchema = createInsertSchema(auditorProfiles).omit({ id: true });
export const insertVettingApplicationSchema = createInsertSchema(vettingApplications).omit({ id: true, submittedAt: true, score: true, decision: true, reviewerUserId: true, comments: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true });
export const insertAuditAssignmentSchema = createInsertSchema(auditAssignments).omit({ id: true, createdAt: true });
export const insertFindingSchema = createInsertSchema(findings).omit({ id: true, createdAt: true, status: true, createdByUserId: true });
export const insertFindingReviewSchema = createInsertSchema(findingReviews).omit({ id: true, createdAt: true, reviewerUserId: true });

// Types
// User is already exported from models/auth, but we can re-export or use the one from there
export type AuditorProfile = typeof auditorProfiles.$inferSelect;
export type InsertAuditorProfile = z.infer<typeof insertAuditorProfileSchema>;
export type VettingApplication = typeof vettingApplications.$inferSelect;
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type AuditAssignment = typeof auditAssignments.$inferSelect;
export type Finding = typeof findings.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;
export type FindingReview = typeof findingReviews.$inferSelect;
export type InsertFindingReview = z.infer<typeof insertFindingReviewSchema>;
export type ReputationEvent = typeof reputationEvents.$inferSelect;
