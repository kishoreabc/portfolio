"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactSchema, ContactFormData } from "@/lib/validations";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteConfig } from "@prisma/client";

interface ContactProps {
  config: SiteConfig | null;
}

export function Contact({ config }: ContactProps) {
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to send message");
      }

      setSentSuccess(true);
      toast.success("Thanks for reaching out! Your message has been sent successfully.");
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section-padding bg-card/20 relative border-t border-border/40 overflow-hidden">
      <div className="container-portfolio space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-mono">
            Get In Touch
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Let&apos;s <span className="text-gradient">Connect</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            Open to AI/ML & Generative AI opportunities, collaborations, and discussions.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 max-w-5xl mx-auto items-start">
          {/* Info Card */}
          <div className="lg:col-span-5 space-y-6 scroll-reveal" data-delay="1">
            <Card className="card-glow-border border-border/70 bg-card/90 p-6 space-y-6 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <h3 className="font-bold text-lg text-foreground">Contact Information</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Feel free to send a message regarding AI/ML engineer roles, project collaborations, or technical questions.
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <a href={`mailto:${config?.contactEmail ?? "Kishorehp134@gmail.com"}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {config?.contactEmail ?? "Kishorehp134@gmail.com"}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Location</p>
                    <p className="text-muted-foreground">{config?.location ?? "Salem, Tamil Nadu, India"}</p>
                  </div>
                </div>
              </div>

        
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7 scroll-reveal" data-delay="2">
            <Card className="card-glow-border border-border/70 bg-card/90 p-6 sm:p-8 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              {sentSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold">Message Sent Successfully!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Thanks for reaching out! Your message has been sent to Kishore R. You will receive a response shortly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full mt-4 cursor-pointer"
                    onClick={() => setSentSuccess(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Honeypot field (hidden from real users) */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    {...register("website")}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Your Name *</label>
                      <Input {...register("name")} placeholder="Jane Doe" />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold">Your Email *</label>
                      <Input type="email" {...register("email")} placeholder="jane@example.com" />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Subject *</label>
                    <Input {...register("subject")} placeholder="AI Engineering Opportunity / Project Discussion" />
                    {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">Message *</label>
                    <Textarea
                      {...register("message")}
                      rows={5}
                      placeholder="Write your message here..."
                    />
                    {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full rounded-full btn-shimmer hover:scale-[1.01] transition-transform cursor-pointer" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
