import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "What types of PDF operations are supported?",
    answer: "Our platform supports all major PDF operations including merge, split, compress, convert (to/from Word, Excel, PowerPoint), password protection, digital signatures, OCR text extraction, and much more. We process over 50 different file formats."
  },
  {
    question: "Is there a limit on file sizes or processing?", 
    answer: "Free accounts have a 10MB file size limit and 20 operations per month. Paid plans have much higher limits (up to 500MB per file) and unlimited operations. Enterprise customers can process even larger files with custom solutions."
  },
  {
    question: "How does the AI functionality work?",
    answer: "Our AI tools include document analysis, content generation, smart categorization, automated data extraction, and intelligent workflow suggestions. The AI learns from your usage patterns to provide increasingly personalized recommendations."
  },
  {
    question: "Can I integrate with other business tools?",
    answer: "Yes! We offer integrations with popular tools like Slack, Zapier, Google Workspace, Microsoft Office, Dropbox, and many CRM systems. Our API allows custom integrations for enterprise customers."
  },
  {
    question: "What about data security and privacy?",
    answer: "Security is our top priority. We use bank-grade AES-256 encryption, SOC 2 compliance, GDPR compliance, and all data is processed on secure servers. Files are automatically deleted after processing unless you choose to store them."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can upgrade, downgrade, or cancel anytime during or after the trial period."
  },
  {
    question: "How does billing work for teams?",
    answer: "Team billing is per-seat with volume discounts available. You can add or remove team members anytime, and billing is prorated. We also offer annual discounts and custom enterprise pricing for larger organizations."
  },
  {
    question: "What kind of support do you provide?",
    answer: "We provide email support for all users, priority chat support for paid plans, and dedicated account management for enterprise customers. Our comprehensive documentation and video tutorials help you get started quickly."
  }
];

export const FAQSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked
            <span className="gradient-text block">Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about our platform. Can't find the answer you're looking for? 
            Our support team is here to help.
          </p>
        </div>
        
        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg px-6 shadow-elegant"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        {/* Contact CTA */}
        <div className="text-center mt-16 p-8 rounded-2xl gradient-card border">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">
            Our team is here to help you get the most out of our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline">Contact Support</Button>
            <Button className="gradient-primary text-white">Schedule a Demo</Button>
          </div>
        </div>
      </div>
    </section>
  );
};