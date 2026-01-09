import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { 
  type User, type Audit, type AuditAssignment, type Finding, type FindingReview,
  type VettingApplication, type AuditorProfile, type InsertUser
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// ================= USERS =================

export function useUser() {
  return useQuery({
    queryKey: [api.users.me.path],
    queryFn: async () => {
      const res = await fetch(api.users.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.users.me.responses[200].parse(await res.json());
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return api.users.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: z.infer<typeof api.users.update.input> }) => {
      const url = buildUrl(api.users.update.path, { id });
      const res = await fetch(url, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user");
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
      toast({ title: "User updated", description: "The user has been updated successfully." });
    },
  });
}

// ================= AUDITS =================

export function useAudits() {
  return useQuery({
    queryKey: [api.audits.list.path],
    queryFn: async () => {
      const res = await fetch(api.audits.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audits");
      return api.audits.list.responses[200].parse(await res.json());
    },
  });
}

export function useAudit(id: number) {
  return useQuery({
    queryKey: [api.audits.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.audits.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch audit");
      return api.audits.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.audits.create.input>) => {
      const res = await fetch(api.audits.create.path, {
        method: api.audits.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create audit");
      return api.audits.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.audits.list.path] });
      toast({ title: "Audit created", description: "The new audit has been initialized." });
    },
  });
}

export function useAssignAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ auditId, userId, assignmentType }: { auditId: number; userId: number; assignmentType: "lead" | "reviewer" }) => {
      const url = buildUrl(api.audits.assign.path, { id: auditId });
      const res = await fetch(url, {
        method: api.audits.assign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, assignmentType }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to assign user");
      return api.audits.assign.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.audits.get.path, variables.auditId] });
      toast({ title: "User assigned", description: "The user has been assigned to this audit." });
    },
  });
}

// ================= FINDINGS =================

export function useFindings(auditId: number) {
  return useQuery({
    queryKey: [api.findings.list.path, auditId],
    queryFn: async () => {
      const url = buildUrl(api.findings.list.path, { auditId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch findings");
      return api.findings.list.responses[200].parse(await res.json());
    },
    enabled: !!auditId,
  });
}

export function useFinding(id: number) {
  return useQuery({
    queryKey: [api.findings.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.findings.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch finding");
      return api.findings.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateFinding() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ auditId, data }: { auditId: number; data: z.infer<typeof api.findings.create.input> }) => {
      const url = buildUrl(api.findings.create.path, { auditId });
      const res = await fetch(url, {
        method: api.findings.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create finding");
      return api.findings.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.findings.list.path, variables.auditId] });
      toast({ title: "Finding reported", description: "Your finding has been submitted successfully." });
    },
  });
}

export function useReviewFinding() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ findingId, data }: { findingId: number; data: z.infer<typeof api.findings.review.input> }) => {
      const url = buildUrl(api.findings.review.path, { id: findingId });
      const res = await fetch(url, {
        method: api.findings.review.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to review finding");
      return api.findings.review.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.findings.get.path, variables.findingId] });
      toast({ title: "Review submitted", description: "The finding review has been recorded." });
    },
  });
}

// ================= VETTING =================

export function useVettingApplications() {
  return useQuery({
    queryKey: [api.vetting.list.path],
    queryFn: async () => {
      const res = await fetch(api.vetting.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vetting applications");
      return api.vetting.list.responses[200].parse(await res.json());
    },
  });
}

export function useApplyVetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.vetting.apply.input>) => {
      const res = await fetch(api.vetting.apply.path, {
        method: api.vetting.apply.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit application");
      return api.vetting.apply.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vetting.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      toast({ title: "Application submitted", description: "Your application is now under review." });
    },
  });
}

export function useReviewVetting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof api.vetting.review.input> }) => {
      const url = buildUrl(api.vetting.review.path, { id });
      const res = await fetch(url, {
        method: api.vetting.review.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to review application");
      return api.vetting.review.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.vetting.list.path] });
      toast({ title: "Decision recorded", description: "The vetting application has been processed." });
    },
  });
}

// ================= METRICS =================

export function useMetrics() {
  return useQuery({
    queryKey: [api.metrics.get.path],
    queryFn: async () => {
      const res = await fetch(api.metrics.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return api.metrics.get.responses[200].parse(await res.json());
    },
  });
}
