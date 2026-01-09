import { Layout } from "@/components/layout";
import { useUser, useAudits } from "@/hooks/use-audit-collective";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Shield, Target, Trophy, Activity, Plus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useUser();
  const { data: audits, isLoading: auditsLoading } = useAudits();

  if (userLoading || auditsLoading) return <DashboardSkeleton />;

  const activeAudits = audits?.filter(a => a.status === 'in_progress').length || 0;
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">
              Welcome back, {user?.username}
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening in the collective today.
            </p>
          </div>
          {user?.role === 'admin' && (
             <Link href="/audits">
               <Button className="gap-2 shadow-lg shadow-primary/25">
                 <Plus className="w-4 h-4" /> New Audit
               </Button>
             </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Reputation Score" 
            value={user?.reputationScore || 0} 
            icon={Trophy} 
            color="text-yellow-500"
            bg="bg-yellow-500/10"
          />
          <StatCard 
            title="Active Audits" 
            value={activeAudits} 
            icon={Activity} 
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <StatCard 
            title="Role" 
            value={user?.role} 
            icon={Shield} 
            color="text-purple-500"
            bg="bg-purple-500/10"
            capitalize
          />
          <StatCard 
            title="Tier" 
            value={user?.tier} 
            icon={Target} 
            color="text-green-500"
            bg="bg-green-500/10"
            capitalize
          />
        </div>

        {/* Recent Activity / Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold font-display">Active Audits</h2>
            <div className="grid gap-4">
              {audits?.slice(0, 3).map((audit, i) => (
                <motion.div 
                  key={audit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/audits/${audit.id}`}>
                    <div className="group bg-card border border-border hover:border-primary/50 transition-all duration-200 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:shadow-primary/5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{audit.title}</h3>
                          <p className="text-sm text-muted-foreground">{audit.clientName}</p>
                        </div>
                        <Badge variant={audit.status === 'in_progress' ? 'default' : 'secondary'}>
                          {audit.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
                        <span>{audit.chain || 'Multichain'}</span>
                        <span>•</span>
                        <span>{new Date(audit.createdAt!).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              {(!audits || audits.length === 0) && (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  No active audits found.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions / Sidebar */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-display">Quick Actions</h2>
            <div className="space-y-3">
              <ActionCard 
                title="Submit Vetting" 
                desc="Apply for a higher tier"
                href="/vetting"
                disabled={user?.status !== 'applied'}
              />
              <ActionCard 
                title="Browse Leaderboard" 
                desc="See top auditors"
                href="/metrics"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, capitalize }: any) {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
        <div className={`text-2xl font-bold font-display ${capitalize ? 'capitalize' : ''}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({ title, desc, href, disabled }: any) {
  if (disabled) return null;
  return (
    <Link href={href}>
      <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/5 transition-colors cursor-pointer group">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <Layout>
      <div className="space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </Layout>
  );
}
