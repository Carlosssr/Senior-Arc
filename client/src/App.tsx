import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import AuditsList from "@/pages/audits/list";
import AuditDetail from "@/pages/audits/detail";
import FindingDetail from "@/pages/findings/detail";
import Vetting from "@/pages/vetting";
import AdminUsers from "@/pages/admin/users";
import Metrics from "@/pages/metrics";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType<any>, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  if (adminOnly && user.role !== 'admin') {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/audits">
        <ProtectedRoute component={AuditsList} />
      </Route>
      <Route path="/audits/:id">
        <ProtectedRoute component={AuditDetail} />
      </Route>
      <Route path="/findings/:id">
        <ProtectedRoute component={FindingDetail} />
      </Route>
      <Route path="/vetting">
        <ProtectedRoute component={Vetting} />
      </Route>
      <Route path="/metrics">
        <ProtectedRoute component={Metrics} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/users">
        <ProtectedRoute component={AdminUsers} adminOnly />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
