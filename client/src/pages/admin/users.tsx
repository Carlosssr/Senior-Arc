import { Layout } from "@/components/layout";
import { useUsers, useUpdateUser } from "@/hooks/use-audit-collective";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Edit } from "lucide-react";

export default function AdminUsers() {
  const { data: users, isLoading } = useUsers();

  if (isLoading) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">User Management</h1>
          <p className="text-muted-foreground">Manage roles, tiers, and user statuses.</p>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell className="capitalize">{user.tier}</TableCell>
                  <TableCell className="capitalize">{user.status}</TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={user} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}

function EditUserDialog({ user }: { user: any }) {
  const { mutate, isPending } = useUpdateUser();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(user.role);
  const [tier, setTier] = useState(user.tier);
  const [status, setStatus] = useState(user.status);

  const handleUpdate = () => {
    mutate({ id: user.id, updates: { role, tier, status } }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tier</Label>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="observer">Observer</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="core">Core</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="probation">Probation</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="removed">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleUpdate} disabled={isPending}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
