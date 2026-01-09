import { db } from "./db";
import { 
  users, auditorProfiles, vettingApplications, audits, auditAssignments, findings, findingReviews, reputationEvents,
  type User, type InsertUser, type AuditorProfile, type InsertAuditorProfile,
  type VettingApplication, type Audit, type InsertAudit, type AuditAssignment, 
  type Finding, type InsertFinding, type FindingReview, type InsertFindingReview, type ReputationEvent
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Profiles
  createAuditorProfile(profile: InsertAuditorProfile): Promise<AuditorProfile>;
  getAuditorProfile(userId: string): Promise<AuditorProfile | undefined>;

  // Vetting
  createVettingApplication(app: any): Promise<VettingApplication>; // Type 'any' used to bypass strict insert check for now
  getPendingVettingApplications(): Promise<(VettingApplication & { user: User })[]>;
  getVettingApplication(id: number): Promise<VettingApplication | undefined>;
  updateVettingApplication(id: number, updates: Partial<VettingApplication>): Promise<VettingApplication>;

  // Audits
  getAudits(): Promise<Audit[]>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAudit(id: number): Promise<Audit | undefined>;
  
  // Assignments
  createAuditAssignment(assignment: any): Promise<AuditAssignment>;
  getAuditAssignments(auditId: number): Promise<(AuditAssignment & { user: User })[]>;
  getAuditAssignment(auditId: number, userId: string): Promise<AuditAssignment | undefined>;

  // Findings
  getFindings(auditId: number): Promise<(Finding & { author: User })[]>;
  createFinding(finding: any): Promise<Finding>;
  getFinding(id: number): Promise<Finding | undefined>;
  updateFinding(id: number, updates: Partial<Finding>): Promise<Finding>;

  // Reviews
  createFindingReview(review: InsertFindingReview): Promise<FindingReview>;
  getFindingReviews(findingId: number): Promise<(FindingReview & { reviewer: User })[]>;

  // Reputation
  createReputationEvent(event: any): Promise<ReputationEvent>;
  getReputationEvents(userId: string): Promise<ReputationEvent[]>;
  getLeaderboard(): Promise<User[]>;
  getGlobalStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async createAuditorProfile(profile: InsertAuditorProfile): Promise<AuditorProfile> {
    const [newProfile] = await db.insert(auditorProfiles).values(profile).returning();
    return newProfile;
  }

  async getAuditorProfile(userId: string): Promise<AuditorProfile | undefined> {
    const [profile] = await db.select().from(auditorProfiles).where(eq(auditorProfiles.userId, userId));
    return profile;
  }

  async createVettingApplication(app: any): Promise<VettingApplication> {
    const [application] = await db.insert(vettingApplications).values(app).returning();
    return application;
  }

  async getPendingVettingApplications(): Promise<(VettingApplication & { user: User })[]> {
    const results = await db.select().from(vettingApplications)
      .innerJoin(users, eq(vettingApplications.userId, users.id))
      .where(eq(vettingApplications.decision, 'pending'));
    
    return results.map(r => ({ ...r.vetting_applications, user: r.users }));
  }

  async getVettingApplication(id: number): Promise<VettingApplication | undefined> {
    const [app] = await db.select().from(vettingApplications).where(eq(vettingApplications.id, id));
    return app;
  }

  async updateVettingApplication(id: number, updates: Partial<VettingApplication>): Promise<VettingApplication> {
    const [app] = await db.update(vettingApplications).set(updates).where(eq(vettingApplications.id, id)).returning();
    return app;
  }

  async getAudits(): Promise<Audit[]> {
    return await db.select().from(audits).orderBy(desc(audits.createdAt));
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [newAudit] = await db.insert(audits).values(audit).returning();
    return newAudit;
  }

  async getAudit(id: number): Promise<Audit | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    return audit;
  }

  async createAuditAssignment(assignment: any): Promise<AuditAssignment> {
    const [newAssignment] = await db.insert(auditAssignments).values(assignment).returning();
    return newAssignment;
  }

  async getAuditAssignments(auditId: number): Promise<(AuditAssignment & { user: User })[]> {
    const results = await db.select().from(auditAssignments)
      .innerJoin(users, eq(auditAssignments.userId, users.id))
      .where(eq(auditAssignments.auditId, auditId));
    
    return results.map(r => ({ ...r.audit_assignments, user: r.users }));
  }

  async getAuditAssignment(auditId: number, userId: string): Promise<AuditAssignment | undefined> {
    const [assignment] = await db.select().from(auditAssignments)
      .where(and(eq(auditAssignments.auditId, auditId), eq(auditAssignments.userId, userId)));
    return assignment;
  }

  async getFindings(auditId: number): Promise<(Finding & { author: User })[]> {
    const results = await db.select().from(findings)
      .innerJoin(users, eq(findings.createdByUserId, users.id))
      .where(eq(findings.auditId, auditId))
      .orderBy(desc(findings.createdAt));
      
    return results.map(r => ({ ...r.findings, author: r.users }));
  }

  async createFinding(finding: any): Promise<Finding> {
    const [newFinding] = await db.insert(findings).values(finding).returning();
    return newFinding;
  }

  async getFinding(id: number): Promise<Finding | undefined> {
    const [finding] = await db.select().from(findings).where(eq(findings.id, id));
    return finding;
  }

  async updateFinding(id: number, updates: Partial<Finding>): Promise<Finding> {
    const [finding] = await db.update(findings).set(updates).where(eq(findings.id, id)).returning();
    return finding;
  }

  async createFindingReview(review: InsertFindingReview): Promise<FindingReview> {
    const [newReview] = await db.insert(findingReviews).values(review).returning();
    return newReview;
  }

  async getFindingReviews(findingId: number): Promise<(FindingReview & { reviewer: User })[]> {
    const results = await db.select().from(findingReviews)
      .innerJoin(users, eq(findingReviews.reviewerUserId, users.id))
      .where(eq(findingReviews.findingId, findingId))
      .orderBy(desc(findingReviews.createdAt));
      
    return results.map(r => ({ ...r.finding_reviews, reviewer: r.users }));
  }

  async createReputationEvent(event: any): Promise<ReputationEvent> {
    const [newEvent] = await db.insert(reputationEvents).values(event).returning();
    
    // Update user reputation score
    const user = await this.getUser(event.userId);
    if (user) {
      await this.updateUser(user.id, { reputationScore: (user.reputationScore || 0) + event.points });
    }
    
    return newEvent;
  }

  async getReputationEvents(userId: string): Promise<ReputationEvent[]> {
    return await db.select().from(reputationEvents).where(eq(reputationEvents.userId, userId));
  }

  async getLeaderboard(): Promise<User[]> {
    return await db.select().from(users)
      .where(eq(users.role, 'auditor'))
      .orderBy(desc(users.reputationScore))
      .limit(20);
  }

  async getGlobalStats(): Promise<any> {
    const totalFindings = await db.select({ count: sql<number>`count(*)` }).from(findings);
    const acceptedFindings = await db.select({ count: sql<number>`count(*)` }).from(findings).where(eq(findings.status, 'approved'));
    const rejectedFindings = await db.select({ count: sql<number>`count(*)` }).from(findings).where(eq(findings.status, 'rejected'));

    return {
      totalFindings: Number(totalFindings[0]?.count || 0),
      acceptedFindings: Number(acceptedFindings[0]?.count || 0),
      rejectedFindings: Number(rejectedFindings[0]?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
