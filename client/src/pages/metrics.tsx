import { Layout } from "@/components/layout";
import { useMetrics } from "@/hooks/use-audit-collective";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Trophy, Medal, Award } from "lucide-react";

export default function Metrics() {
  const { data: metrics, isLoading } = useMetrics();

  if (isLoading || !metrics) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Leaderboard & Metrics</h1>
          <p className="text-muted-foreground">Top auditors by reputation score.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Reputation Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.leaderboard.slice(0, 10)}>
                    <XAxis dataKey="username" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                    />
                    <Bar dataKey="reputationScore" radius={[4, 4, 0, 0]}>
                      {metrics.leaderboard.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Findings</span>
                <span className="font-bold text-xl">{metrics.stats.totalFindings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Accepted</span>
                <span className="font-bold text-xl text-green-500">{metrics.stats.acceptedFindings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rejected</span>
                <span className="font-bold text-xl text-red-500">{metrics.stats.rejectedFindings}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Top Contributors</h2>
          <div className="grid gap-4 md:grid-cols-3">
             {metrics.leaderboard.slice(0, 3).map((user, i) => (
               <div key={user.id} className="relative bg-card border border-border p-6 rounded-xl flex items-center gap-4">
                 <div className="absolute -top-3 -right-3">
                   {i === 0 && <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-lg" />}
                   {i === 1 && <Medal className="w-8 h-8 text-gray-300 drop-shadow-lg" />}
                   {i === 2 && <Award className="w-8 h-8 text-orange-400 drop-shadow-lg" />}
                 </div>
                 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                   {user.username.slice(0, 2).toUpperCase()}
                 </div>
                 <div>
                   <h3 className="font-bold text-lg">{user.username}</h3>
                   <p className="text-primary font-mono font-bold">{user.reputationScore} PTS</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
