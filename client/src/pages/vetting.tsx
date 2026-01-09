import { Layout } from "@/components/layout";
import { useVettingApplications, useApplyVetting, useReviewVetting, useUser } from "@/hooks/use-audit-collective";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Check, X } from "lucide-react";

export default function Vetting() {
  const { data: user } = useUser();
  const { data: applications } = useVettingApplications();

  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display">Vetting & Applications</h1>
            <p className="text-muted-foreground">Apply to join the collective or review pending applications.</p>
          </div>
        </div>

        <Tabs defaultValue={isAdmin ? "reviews" : "apply"}>
          <TabsList className="mb-4">
            <TabsTrigger value="apply">Apply</TabsTrigger>
            {isAdmin && <TabsTrigger value="reviews">Reviews ({applications?.filter(a => a.decision === 'pending').length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="apply">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Auditor Application</CardTitle>
                  <CardDescription>
                    Submit proof of past work to upgrade your tier from Observer to Contributor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.status === 'applied' ? (
                     <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 rounded-lg">
                       You have already submitted an application. It is currently pending review.
                     </div>
                  ) : (
                    <ApplyForm />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="reviews">
              <div className="space-y-4">
                {applications?.map((app) => (
                  <Card key={app.id} className="bg-card">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{app.user.username}</CardTitle>
                        <CardDescription>Applied on {new Date(app.submittedAt!).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant={app.decision === 'pending' ? 'secondary' : app.decision === 'accepted' ? 'default' : 'destructive'}>
                        {app.decision}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label className="text-muted-foreground text-xs uppercase tracking-wide">Writeup</Label>
                          <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">{app.writeupText}</p>
                        </div>
                        {app.links && app.links.length > 0 && (
                          <div>
                            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Links</Label>
                            <ul className="list-disc list-inside mt-1 text-sm text-primary">
                              {app.links.map((link, i) => (
                                <li key={i}><a href={link} target="_blank" rel="noopener">{link}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {app.decision === 'pending' && (
                           <div className="flex items-center gap-2 pt-4">
                             <ReviewDialog applicationId={app.id} />
                           </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}

function ApplyForm() {
  const { mutate, isPending } = useApplyVetting();
  const form = useForm({
    defaultValues: {
      writeupText: "",
      links: "" // string to split
    }
  });

  const onSubmit = (data: any) => {
    mutate({
      writeupText: data.writeupText,
      links: data.links.split(',').map((l: string) => l.trim()).filter(Boolean)
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Why should you join?</Label>
        <Textarea 
          {...form.register("writeupText")} 
          placeholder="Tell us about your experience..." 
          className="h-32"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Proof Links (comma separated)</Label>
        <Input 
          {...form.register("links")} 
          placeholder="https://github.com/..., https://reports.com/..." 
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Application"}
      </Button>
    </form>
  );
}

function ReviewDialog({ applicationId }: { applicationId: number }) {
  const { mutate, isPending } = useReviewVetting();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [score, setScore] = useState("50");

  const handleReview = (decision: 'accepted' | 'rejected') => {
    mutate({ 
      id: applicationId, 
      data: { decision, score: parseInt(score), comments } 
    }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Review Application</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Application</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
             <Label>Score (0-100)</Label>
             <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
          </div>
          <div className="space-y-2">
             <Label>Comments</Label>
             <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Feedback for the applicant..." />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="destructive" onClick={() => handleReview('rejected')} disabled={isPending}>
              <X className="w-4 h-4 mr-2" /> Reject
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleReview('accepted')} disabled={isPending}>
              <Check className="w-4 h-4 mr-2" /> Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
