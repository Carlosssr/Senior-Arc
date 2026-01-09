import { Layout } from "@/components/layout";
import { useAudits, useCreateAudit } from "@/hooks/use-audit-collective";
import { useUser } from "@/hooks/use-audit-collective";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAuditSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, ArrowRight, ExternalLink } from "lucide-react";

export default function AuditsList() {
  const { data: user } = useUser();
  const { data: audits, isLoading } = useAudits();
  const [open, setOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display">Audits</h1>
            <p className="text-muted-foreground">Manage and participate in security reviews.</p>
          </div>
          {user?.role === 'admin' && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4" /> Create Audit
                </Button>
              </DialogTrigger>
              <CreateAuditDialog onClose={() => setOpen(false)} />
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4">Loading...</div>
        ) : (
          <div className="grid gap-4">
            {audits?.map((audit) => (
              <div
                key={audit.id}
                className="group relative bg-card border border-border rounded-xl p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold">{audit.title}</h3>
                      <Badge variant={audit.status === 'in_progress' ? 'default' : 'secondary'}>
                        {audit.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{audit.clientName}</span>
                      <span>•</span>
                      <span className="font-mono">{audit.chain || 'N/A'}</span>
                      {audit.repoUrl && (
                        <a href={audit.repoUrl} target="_blank" rel="noopener" className="flex items-center gap-1 hover:text-primary">
                          Repo <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl">
                      {audit.scopeText}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <Link href={`/audits/${audit.id}`}>
                      <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function CreateAuditDialog({ onClose }: { onClose: () => void }) {
  const { mutate, isPending } = useCreateAudit();
  const form = useForm<z.infer<typeof insertAuditSchema>>({
    resolver: zodResolver(insertAuditSchema),
  });

  const onSubmit = (data: z.infer<typeof insertAuditSchema>) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
        onClose();
      },
    });
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create New Audit</DialogTitle>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...form.register("title")} placeholder="e.g. Protocol v2" />
            {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name</Label>
            <Input id="clientName" {...form.register("clientName")} placeholder="e.g. DeFi Corp" />
            {form.formState.errors.clientName && <p className="text-xs text-destructive">{form.formState.errors.clientName.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
            <Label htmlFor="repoUrl">Repo URL</Label>
            <Input id="repoUrl" {...form.register("repoUrl")} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chain">Chain</Label>
            <Input id="chain" {...form.register("chain")} placeholder="e.g. Ethereum" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scopeText">Scope</Label>
          <Textarea 
            id="scopeText" 
            {...form.register("scopeText")} 
            placeholder="Describe the audit scope..." 
            className="h-32 font-mono text-sm"
          />
          {form.formState.errors.scopeText && <p className="text-xs text-destructive">{form.formState.errors.scopeText.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Audit"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
