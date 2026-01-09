import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup (blueprint)
  setupAuth(app);

  // Middleware to check auth
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  // User Routes
  app.get(api.users.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  app.get(api.users.list.path, requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.patch(api.users.update.path, requireAdmin, async (req, res) => {
    // userId is string
    const userId = req.params.id;
    const updates = api.users.update.input.parse(req.body);
    const user = await storage.updateUser(userId, updates);
    res.json(user);
  });

  // Vetting Routes
  app.post(api.vetting.apply.path, requireAuth, async (req, res) => {
    const input = api.vetting.apply.input.parse(req.body);
    const app = await storage.createVettingApplication({
      ...input,
      userId: req.user!.id,
      submittedAt: new Date(),
    });
    res.status(201).json(app);
  });

  app.get(api.vetting.list.path, requireAdmin, async (req, res) => {
    const apps = await storage.getPendingVettingApplications();
    res.json(apps);
  });

  app.post(api.vetting.review.path, requireAdmin, async (req, res) => {
    const appId = Number(req.params.id);
    const input = api.vetting.review.input.parse(req.body);
    
    const app = await storage.updateVettingApplication(appId, {
      ...input,
      reviewerUserId: req.user!.id,
    });

    if (input.decision === 'accepted') {
      await storage.updateUser(app.userId, { status: 'active', tier: 'contributor' });
    } else {
      await storage.updateUser(app.userId, { status: 'removed' });
    }

    res.json(app);
  });

  // Audit Routes
  app.get(api.audits.list.path, requireAuth, async (req, res) => {
    const audits = await storage.getAudits();
    res.json(audits);
  });

  app.post(api.audits.create.path, requireAuth, async (req, res) => {
    if (req.user!.role !== 'admin' && req.user!.role !== 'client') {
      return res.status(403).json({ message: "Only admins and clients can create audits" });
    }
    const input = api.audits.create.input.parse(req.body);
    const audit = await storage.createAudit(input);
    res.status(201).json(audit);
  });

  app.get(api.audits.get.path, requireAuth, async (req, res) => {
    const auditId = Number(req.params.id);
    const audit = await storage.getAudit(auditId);
    if (!audit) return res.status(404).json({ message: "Audit not found" });
    
    const assignments = await storage.getAuditAssignments(auditId);
    res.json({ ...audit, assignments });
  });

  app.post(api.audits.assign.path, requireAdmin, async (req, res) => {
    const auditId = Number(req.params.id);
    const input = api.audits.assign.input.parse(req.body);
    // userId is numeric in input? No, check schema
    // api.audits.assign input userId is number in shared/routes.ts?
    // Let's check shared/routes.ts. It probably said number. We need to fix that too.
    
    const assignment = await storage.createAuditAssignment({
      ...input,
      auditId,
    });
    res.status(201).json(assignment);
  });

  // Finding Routes
  app.get(api.findings.list.path, requireAuth, async (req, res) => {
    const auditId = Number(req.params.auditId);
    const findings = await storage.getFindings(auditId);
    res.json(findings);
  });

  app.post(api.findings.create.path, requireAuth, async (req, res) => {
    const auditId = Number(req.params.auditId);
    const assignment = await storage.getAuditAssignment(auditId, req.user!.id);
    
    if (!assignment && req.user!.role !== 'admin') {
      return res.status(403).json({ message: "Not assigned to this audit" });
    }

    const input = api.findings.create.input.parse(req.body);
    const finding = await storage.createFinding({
      ...input,
      auditId,
      createdByUserId: req.user!.id,
      status: 'draft',
    });
    res.status(201).json(finding);
  });

  app.get(api.findings.get.path, requireAuth, async (req, res) => {
    const findingId = Number(req.params.id);
    const finding = await storage.getFinding(findingId);
    if (!finding) return res.status(404).json({ message: "Finding not found" });
    
    const reviews = await storage.getFindingReviews(findingId);
    res.json({ ...finding, reviews });
  });

  app.post(api.findings.review.path, requireAuth, async (req, res) => {
    if (req.user!.tier === 'observer' || req.user!.tier === 'contributor') {
      return res.status(403).json({ message: "Insufficient tier to review" });
    }

    const findingId = Number(req.params.id);
    const input = api.findings.review.input.parse(req.body);
    const review = await storage.createFindingReview({
      ...input,
      findingId,
      reviewerUserId: req.user!.id,
    });

    const finding = await storage.getFinding(findingId);
    
    if (input.decision === 'approve') {
       await storage.updateFinding(findingId, { status: 'approved' });
       if (finding) {
         await storage.createReputationEvent({
           userId: finding.createdByUserId,
           type: 'finding_accepted',
           points: 5,
           findingId,
           auditId: finding.auditId
         });
       }
       await storage.createReputationEvent({
         userId: req.user!.id,
         type: 'review_completed',
         points: 2,
         findingId,
         auditId: finding?.auditId
       });

    } else if (input.decision === 'reject') {
       await storage.updateFinding(findingId, { status: 'rejected' });
       if (finding) {
         await storage.createReputationEvent({
           userId: finding.createdByUserId,
           type: 'finding_rejected',
           points: -3,
           findingId,
           auditId: finding.auditId
         });
       }
       await storage.createReputationEvent({
         userId: req.user!.id,
         type: 'review_completed',
         points: 2,
         findingId,
         auditId: finding?.auditId
       });

    } else {
       await storage.updateFinding(findingId, { status: 'needs_review' });
    }

    res.status(201).json(review);
  });

  app.get(api.metrics.get.path, requireAuth, async (req, res) => {
    const leaderboard = await storage.getLeaderboard();
    const stats = await storage.getGlobalStats();
    res.json({ leaderboard, stats });
  });

  // Seed Data (if empty)
  const users = await storage.getUsers();
  if (users.length === 0) {
    await seedDatabase();
  }

  return httpServer;
}

async function seedDatabase() {
  console.log("Seeding database...");
  
  // Create Admin
  const admin = await storage.createUser({
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    tier: "core",
    status: "active",
    reputationScore: 100,
    firstName: "Admin",
    lastName: "User"
  });

  // Create Auditors
  const auditor1 = await storage.createUser({
    username: "alice_auditor",
    email: "alice@example.com",
    role: "auditor",
    tier: "reviewer",
    status: "active",
    reputationScore: 50,
    firstName: "Alice",
    lastName: "Auditor"
  });

  const auditor2 = await storage.createUser({
    username: "bob_auditor",
    email: "bob@example.com",
    role: "auditor",
    tier: "contributor",
    status: "active",
    reputationScore: 20,
    firstName: "Bob",
    lastName: "Builder"
  });

  // Create Audit
  const audit = await storage.createAudit({
    title: "DeFi Protocol V1",
    clientName: "DeFi Corp",
    scopeText: "Smart contracts in /contracts",
    status: "in_progress",
    repoUrl: "https://github.com/deficorp/v1",
    chain: "Ethereum"
  });

  // Assignments
  await storage.createAuditAssignment({
    auditId: audit.id,
    userId: auditor1.id,
    assignmentType: "lead"
  });

  // Findings
  await storage.createFinding({
    auditId: audit.id,
    title: "Reentrancy in withdraw function",
    description: "The withdraw function does not follow checks-effects-interactions.",
    severity: "high",
    status: "approved",
    createdByUserId: auditor2.id,
    category: "Security"
  });
  
  console.log("Database seeded!");
}
