import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight, Lock, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b border-border/40 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl tracking-tight">AuditOS</span>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/api/login">
               <Button variant="ghost">Sign In</Button>
             </Link>
             <Link href="/api/login">
               <Button className="shadow-lg shadow-primary/25">Get Started</Button>
             </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold font-display tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400">
              Decentralized Security <br/> Done Right.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The operating system for the world's best smart contract auditors. Collaborate, review, and earn reputation on-chain.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/api/login">
                <Button size="lg" className="h-12 px-8 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Start Auditing <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-card/30 border-y border-border/50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <Feature 
                icon={Lock} 
                title="Secure Workflow" 
                desc="End-to-end management of findings, from discovery to remediation validation."
              />
              <Feature 
                icon={Users} 
                title="Collective Intelligence" 
                desc="Collaborate with top security researchers in real-time on complex codebases."
              />
              <Feature 
                icon={Zap} 
                title="Reputation System" 
                desc="Earn verifiable reputation points for every valid finding and quality review."
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          © 2024 Audit Collective OS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: any) {
  return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold font-display">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
