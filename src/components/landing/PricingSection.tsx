import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Check, Zap, Crown } from "lucide-react";

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    yearlyPrice: "$290",
    description: "Perfect for freelancers and small teams",
    icon: Zap,
    features: [
      "Up to 5 clients",
      "50 PDF operations/month", 
      "Basic AI tools",
      "5GB storage",
      "Email support",
      "Basic templates"
    ],
    popular: false,
    cta: "Start Free Trial"
  },
  {
    name: "Professional", 
    price: "$79",
    period: "/month",
    yearlyPrice: "$790",
    description: "Ideal for growing agencies and businesses",
    icon: Crown,
    features: [
      "Up to 50 clients",
      "Unlimited PDF operations",
      "Advanced AI tools", 
      "100GB storage",
      "Priority support",
      "Custom templates",
      "Team collaboration",
      "Advanced analytics"
    ],
    popular: true,
    cta: "Start Free Trial"
  },
  {
    name: "Lifetime",
    price: "$999",
    period: "one-time",
    yearlyPrice: null,
    description: "Pay once, use forever - best value",
    icon: Crown,
    features: [
      "Unlimited clients",
      "Unlimited PDF operations",
      "All AI tools included",
      "1TB storage",
      "24/7 premium support", 
      "White-label solution",
      "API access",
      "Custom integrations",
      "Lifetime updates"
    ],
    popular: false,
    cta: "Get Lifetime Access"
  }
];

export const PricingSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent
            <span className="gradient-text block">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business needs. All plans include our core features 
            with no hidden fees.
          </p>
          
          {/* Billing toggle */}
          <div className="inline-flex items-center bg-muted rounded-lg p-1">
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              Monthly
            </button>
            <button className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground">
              Yearly (Save 20%)
            </button>
          </div>
        </div>
        
        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative hover-lift ${
                plan.popular 
                  ? 'border-primary shadow-primary scale-105' 
                  : 'border-border shadow-elegant'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${
                  plan.popular ? 'from-primary to-accent' : 'from-muted to-muted-foreground/20'
                } flex items-center justify-center mb-4`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
                
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  {plan.yearlyPrice && (
                    <p className="text-sm text-muted-foreground mt-2">
                      or {plan.yearlyPrice}/year
                    </p>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'gradient-primary text-white shadow-primary' 
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};