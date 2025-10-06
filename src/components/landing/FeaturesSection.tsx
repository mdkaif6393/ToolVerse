import { FileText, Users, Brain, Zap, Shield, BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "PDF Tools Suite",
    description: "Merge, split, compress, convert, and protect PDFs with our comprehensive toolkit.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Users,
    title: "Client Management", 
    description: "Organize clients, track communications, and manage project relationships effortlessly.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Brain,
    title: "AI-Powered Tools",
    description: "Generate content, analyze documents, and automate workflows with advanced AI.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Zap,
    title: "Project Automation",
    description: "Streamline your workflow with automated project tracking and status updates.",
    gradient: "from-orange-500 to-red-500"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption and security measures to protect your sensitive data.",
    gradient: "from-indigo-500 to-blue-500"
  },
  {
    icon: BarChart,
    title: "Analytics & Insights", 
    description: "Get detailed reports on performance, revenue, and business growth metrics.",
    gradient: "from-pink-500 to-rose-500"
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="gradient-text block">Scale Your Business</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive suite of tools helps you manage every aspect of your business 
            operations, from client onboarding to project delivery.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover-lift border-0 shadow-elegant">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};