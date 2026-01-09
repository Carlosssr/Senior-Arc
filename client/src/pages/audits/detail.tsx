import { Layout } from "@/components/layout";
import { useAudit, useFindings, useCreateFinding, useUsers, useAssignAudit, useUser } from "@/hooks/use-audit-collective";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Plus, Users as UsersIcon, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFindingSchema } from "@shared/schema";
import { z } from "zod";

export default function AuditDetail() {
  const [, params] = useRoute("/audits/:id");
  const id = parseInt(params?.id || "0");
  const { data: audit, isLoading } = useAudit(id);
  const { data: findings } = useFindings(id);
  const { data: user } = useUser();
  const [findingOpen, setFindingOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading || !audit) return <div>Loading...</div>;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/audits" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                  ← Back to Audits
                </Link>
              </div>
              <h1 className="text-4xl font-bold font-display">{audit.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <span className="font-semibold text-foreground">{audit.clientName}</span>
                <span>•</span>
                <span>{audit.chain || 'N/A'}</span>
                {audit.repoUrl && (
                  <a href={audit.repoUrl} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-primary">
                    Repo <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {user?.role === 'admin' && (
                <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <UsersIcon className="w-4 h-4" /> Assign Users
                    </Button>
                  </DialogTrigger>
                  <AssignUserDialog auditId={id} onClose={() => setAssignOpen(false)} />
                </Dialog>
              )}
              <Dialog open={findingOpen} onOpenChange={setFindingOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-lg shadow-primary/25">
                    <Plus className="w-4 h-4" /> Report Finding
                  </Button>
                </DialogTrigger>
                <CreateFindingDialog auditId={id} onClose={() => setFindingOpen(false)} />
              </Dialog>
            </div>
          </div>

          {/* Scope Card */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Scope</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="font-mono text-sm whitespace-pre-wrap text-muted-foreground">
                {audit.scopeText}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="findings" className="w-full">
          <TabsList className="bg-muted/50 border border-border">
            <TabsTrigger value="findings">Findings ({findings?.length || 0})</TabsTrigger>
            <TabsTrigger value="team">Team ({audit.assignments?.length || 0})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="findings" className="mt-6">
            <div className="grid gap-4">
              {findings?.map((finding) => (
                <Link key={finding.id} href={`/findings/${finding.id}`}>
                  <div className="group flex items-center justify-between bg-card border border-border p-4 rounded-xl hover:border-primary/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${finding.severity === 'high' ? 'border-red-500/50 text-red-500 bg-red-500/10' : ''}
                          ${finding.severity === 'medium' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' : ''}
                          ${finding.severity === 'low' ? 'border-blue-500/50 text-blue-500 bg-blue-500/10' : ''}
                        `}
                      >
                        {finding.severity}
                      </Badge>
                      <div>
                        <h4 className="font-bold group-hover:text-primary transition-colors">{finding.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          Reported by {finding.author?.username} • {new Date(finding.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Badge variant="secondary">{finding.status.replace('_', ' ')}</Badge>
                       <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
              {(!findings || findings.length === 0) && (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  No findings reported yet.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audit.assignments?.map((assign) => (
                <div key={assign.id} className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {assign.user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{assign.user.username}</p>
                    <p className="text-xs text-muted-foreground capitalize">{assign.assignmentType}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function CreateFindingDialog({ auditId, onClose }: { auditId: number; onClose: () => void }) {
  const { mutate, isPending } = useCreateFinding();
  const form = useForm<z.infer<typeof insertFindingSchema>>({
    resolver: zodResolver(insertFindingSchema),
    defaultValues: { severity: "medium", category: "logic" }
  });

  const onSubmit = (data: z.infer<typeof insertFindingSchema>) => {
    mutate({ auditId, data }, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  };

  return (
    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Report New Finding</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...form.register("title")} placeholder="e.g. Reentrancy in deposit function" />
          {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select onValueChange={(val) => form.setValue("severity", val)} defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
             <Input id="category" {...form.register("category")} placeholder="e.g. Logic, Access Control" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...form.register("description")} className="h-24" placeholder="Detailed description..." />
          {form.formState.errors.description && <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reproSteps">Reproduction Steps</Label>
          <Textarea id="reproSteps" {...form.register("reproSteps")} className="h-24 font-mono text-sm" placeholder="1. Call function A..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="impact">Impact</Label>
          <Textarea id="impact" {...form.register("impact")} className="h-16" placeholder="Funds can be drained..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendation">Recommendation</Label>
          <Textarea id="recommendation" {...form.register("recommendation")} className="h-16" placeholder="Add reentrancy guard..." />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit Finding"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function AssignUserDialog({ auditId, onClose }: { auditId: number; onClose: () => void }) {
  const { data: users } = useUsers();
  const { mutate, isPending } = useAssignAudit();
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [role, setRole] = useState<"lead" | "reviewer">("reviewer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    mutate({ auditId, userId: parseInt(selectedUser), assignmentType: role }, {
      onSuccess: onClose
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Assign Team Member</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>User</Label>
          <Select onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users?.map(u => (
                <SelectItem key={u.id} value={u.id.toString()}>
                  {u.username} ({u.tier})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(val: any) => setRole(val)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Lead Auditor</SelectItem>
              <SelectItem value="reviewer">Reviewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending || !selectedUser}>Assign</Button>
        </div>
      </form>
    </DialogContent>
  );
}
