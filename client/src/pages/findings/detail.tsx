import { Layout } from "@/components/layout";
import { useFinding, useReviewFinding, useUser } from "@/hooks/use-audit-collective";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function FindingDetail() {
  const [, params] = useRoute("/findings/:id");
  const id = parseInt(params?.id || "0");
  const { data: finding, isLoading } = useFinding(id);
  const { data: user } = useUser();
  const { mutate: review, isPending } = useReviewFinding();

  const [decision, setDecision] = useState<string>("approve");
  const [notes, setNotes] = useState("");

  if (isLoading || !finding) return <div>Loading...</div>;

  const handleReview = () => {
    review({ findingId: id, data: { decision, notes } });
  };

  const isReviewer = user?.role === 'admin' || user?.role === 'auditor'; // Simplified permission check

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Link href={`/audits/${finding.auditId}`}>
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Audit
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-display">{finding.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Finding #{finding.id}</span>
              <span>•</span>
              <span>Created on {new Date(finding.createdAt!).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge className="text-lg px-4 py-1 capitalize" variant={finding.status === 'approved' ? 'default' : 'outline'}>
            {finding.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{finding.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reproduction Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap font-mono text-sm bg-muted/50 p-4 rounded-lg">
                  {finding.reproSteps || "No reproduction steps provided."}
                </pre>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{finding.impact || "N/A"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{finding.recommendation || "N/A"}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <p className="font-semibold capitalize text-lg flex items-center gap-2">
                    {finding.severity}
                    <span className={`w-3 h-3 rounded-full 
                      ${finding.severity === 'critical' ? 'bg-red-600' : 
                        finding.severity === 'high' ? 'bg-orange-500' : 
                        finding.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`
                    } />
                  </p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{finding.category || "Uncategorized"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Review Section */}
            {isReviewer && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">Review Finding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Decision</Label>
                    <Select value={decision} onValueChange={setDecision}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">Approve</SelectItem>
                        <SelectItem value="reject">Reject</SelectItem>
                        <SelectItem value="request_changes">Request Changes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      placeholder="Reasoning..." 
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleReview} 
                    disabled={isPending}
                  >
                    {isPending ? "Submitting..." : "Submit Review"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review History */}
            {finding.reviews && finding.reviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold">Review History</h3>
                {finding.reviews.map((rev) => (
                  <div key={rev.id} className="text-sm bg-card border border-border p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">{rev.reviewer.username}</span>
                      <Badge variant="outline" className="capitalize text-xs">{rev.decision.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-muted-foreground">{rev.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
