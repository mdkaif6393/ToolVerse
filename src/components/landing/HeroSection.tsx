import { Button } from "@/components/ui/button";
import { ArrowRight, Play, FileText, Brain, Users } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background dark:bg-black">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/10 dark:from-black dark:via-primary/20 dark:to-accent/20" />
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
            <span className="text-sm font-semibold text-primary">
              Trusted by 10,000+ Professionals
            </span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight animate-slide-up">
            <span className="text-foreground">Transform Your</span>
            <br />
            <span className="gradient-text">Business Operations</span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl mb-12 text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in">
            The complete platform for agencies, freelancers, and small businesses. 
            Manage projects, clients, invoices, and leverage powerful PDF & AI tools in one unified workspace.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-scale-in">
            <Button size="lg" className="gradient-primary text-white shadow-primary hover-glow px-8 py-4">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 px-8 py-4">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-card/50 border hover-lift dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 dark:shadow-glow">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">PDF Tools</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Merge, split, compress & convert</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-card/50 border hover-lift dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4 dark:shadow-glow">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">AI Assistant</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Smart automation & insights</p>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-card/50 border hover-lift dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 dark:shadow-glow">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2 dark:text-white">Client Hub</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300">Manage projects & invoices</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};