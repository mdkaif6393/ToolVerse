import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Creative Director",
    company: "Design Studio Pro",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    content: "This platform revolutionized how we manage client projects. The PDF tools alone saved us 10+ hours per week.",
    rating: 5
  },
  {
    name: "Michael Chen", 
    role: "Founder",
    company: "TechFlow Agency",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "The AI tools are incredible. We can generate proposals, analyze documents, and automate so much of our workflow.",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Project Manager", 
    company: "Digital Innovations",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "Client management has never been easier. Everything is organized, professional, and our clients love the experience.",
    rating: 5
  },
  {
    name: "David Thompson",
    role: "Freelance Consultant",
    company: "Independent",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content: "As a solo consultant, this platform gives me the power of an entire agency. The lifetime deal was a no-brainer.",
    rating: 5
  },
  {
    name: "Lisa Park",
    role: "Operations Director",
    company: "Growth Partners",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    content: "The analytics and reporting features help us make data-driven decisions. ROI tracking has never been clearer.",
    rating: 5
  },
  {
    name: "James Wilson",
    role: "CEO",
    company: "Startup Hub",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", 
    content: "We scaled from 5 to 50 clients using this platform. The automation features are game-changing.",
    rating: 5
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Loved by
            <span className="gradient-text block">10,000+ Users</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of agencies, freelancers, and businesses who have transformed 
            their operations with our platform.
          </p>
        </div>
        
        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-lift shadow-elegant border-0">
              <CardContent className="p-8">
                {/* Rating stars */}
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star key={starIndex} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                
                {/* Testimonial content */}
                <p className="text-muted-foreground leading-relaxed mb-6">
                  "{testimonial.content}"
                </p>
                
                {/* Author info */}
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to join our community of successful users?
          </p>
          <Button size="lg" className="gradient-primary text-white shadow-primary hover-glow">
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
};