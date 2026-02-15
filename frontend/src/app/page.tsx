'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageCircle, Menu, X, Calendar, Brain, ArrowRight, Check, ChevronRight, User, Quote, Clock, IndianRupee, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FlipWords } from "@/components/ui/flip-words";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/ui/marquee";
import {
  IconCalendar,
  IconChartBar,
  IconBrain,
  IconLanguage,
  IconClock,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const WHATSAPP_URL = "https://wa.me/917208332129?text=Hi%20ClawKaka!";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const flipWords = ["remember", "organize", "track", "simplify"];

  const testimonials = [
    {
      quote: "Clawkaka changed how I manage my daily tasks. No more forgotten meetings or missed deadlines. It's like having a personal assistant that actually understands me.",
      name: "Priya Sharma",
      designation: "Product Manager, Flipkart",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&fit=crop",
    },
    {
      quote: "As a business owner, tracking expenses was always a headache. Clawkaka makes it effortless. Just text the amount and it's done. The monthly reports are incredibly helpful.",
      name: "Rajesh Kumar",
      designation: "Owner, Kumar Electronics",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&fit=crop",
    },
    {
      quote: "I love that it speaks Hindi! My parents can now use it without any tech knowledge. It's truly built for India.",
      name: "Anita Desai",
      designation: "Software Engineer, Google",
      src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&h=400&fit=crop",
    },
  ];

  const featureImages = [
    "https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1521587765099-8835e7201186?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1501139083538-013e3ba0b5a5?w=600&h=400&fit=crop",
  ];

  const features = [
    {
      title: "Smart Reminders",
      description: "Context-aware reminders that understand your schedule and priorities. Never miss what matters.",
      header: <FeatureImage src={featureImages[0]} alt="Calendar and schedule" />,
      icon: <IconCalendar className="h-5 w-5" />,
      accent: "emerald" as const,
    },
    {
      title: "Calorie Tracking",
      description: "Simple food logging with automatic calorie estimation. Set goals and track progress effortlessly.",
      header: <FeatureImage src={featureImages[1]} alt="Healthy food and nutrition" />,
      icon: <IconChartBar className="h-5 w-5" />,
      accent: "violet" as const,
    },
    {
      title: "Expense Management",
      description: "Text amounts, get automatic categorization. Monthly breakdowns and spending insights.",
      header: <FeatureImage src={featureImages[2]} alt="Expense tracking" />,
      icon: <IconChartBar className="h-5 w-5" />,
      accent: "amber" as const,
    },
    {
      title: "Self-Evolving Memory",
      description: "Learns your patterns and adapts over time. The more you use it, the smarter it gets.",
      header: <FeatureImage src={featureImages[3]} alt="AI and memory" />,
      icon: <IconBrain className="h-5 w-5" />,
      accent: "rose" as const,
    },
    {
      title: "Multi-Language Support",
      description: "Speak in English, Hindi, or Hinglish. Adapts to your communication style naturally.",
      header: <FeatureImage src={featureImages[4]} alt="Languages and communication" />,
      icon: <IconLanguage className="h-5 w-5" />,
      accent: "cyan" as const,
    },
    {
      title: "24/7 Availability",
      description: "Always there when you need it. Proactive check-ins and timely nudges throughout your day.",
      header: <FeatureImage src={featureImages[5]} alt="Always available" />,
      icon: <IconClock className="h-5 w-5" />,
      accent: "indigo" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-zinc-900">Clawkaka</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">How it works</a>
              <a href="#testimonials" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Pricing</a>
              <Button className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700" size="default" asChild>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  Try on WhatsApp
                </a>
              </Button>
            </div>
            <button
              className="md:hidden text-zinc-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white">
            <div className="flex flex-col gap-2 px-6 py-4">
              <a href="#features" className="text-sm text-zinc-600 hover:text-zinc-900 py-2">Features</a>
              <a href="#how-it-works" className="text-sm text-zinc-600 hover:text-zinc-900 py-2">How it works</a>
              <a href="#testimonials" className="text-sm text-zinc-600 hover:text-zinc-900 py-2">Testimonials</a>
              <a href="#pricing" className="text-sm text-zinc-600 hover:text-zinc-900 py-2">Pricing</a>
              <Button className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 mt-2" asChild>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  Try on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero – light theme, emerald accent */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-20 bg-gradient-to-b from-white via-emerald-50/30 to-white">
        <BackgroundRippleEffect />
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-8 border-emerald-200 bg-white/80 text-emerald-700 px-4 py-1.5 shadow-sm backdrop-blur-sm">
            <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Made in India, for India 🇮🇳
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl md:text-8xl mb-6">
            <span className="text-zinc-800">Never forget to <FlipWords words={flipWords} className="inline-block text-5xl sm:text-7xl md:text-8xl text-emerald-600" />
            </span>
            <br />
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 sm:text-xl mb-10">
            India&apos;s personal assistant that lives in WhatsApp. It remembers, reminds, and tracks — in English, Hindi, or Hinglish. Accessible to every Indian who can type a message.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button size="lg" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 px-8" asChild>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Message on WhatsApp
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-zinc-200 bg-white/80 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 backdrop-blur-sm"
              asChild
            >
              <a href="#how-it-works">
                See How It Works
              </a>
            </Button>
          </div>
          <p className="text-sm text-zinc-500">
            No app download · No signup · Just WhatsApp · Works on any phone
          </p>
        </div>

        {/* ChatGPT-style conversation – clear left (user) / right (assistant) */}
        <div className="relative z-10 mt-16 w-full max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-xl shadow-zinc-200/50 backdrop-blur-sm">
            <div className="border-b border-zinc-100 px-5 py-3.5 flex items-center gap-2 bg-zinc-50/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-zinc-700">Clawkaka</span>
            </div>
            <div className="min-h-[400px] space-y-1 p-4">
              {[
                { role: "user" as const, text: "Remind me to send the proposal to Mehta by Friday" },
                { role: "assistant" as const, text: "Got it! I'll remind you before Friday to send the proposal to Mehta. I've added it to your tasks." },
                { role: "user" as const, text: "Had 2 rotis, dal, and sabzi for lunch" },
                { role: "assistant" as const, text: "Logged ~450 cal. You have 1,550 cal left for today based on your 2,000 cal goal." },
                { role: "user" as const, text: "Spent 450 at Starbucks" },
                { role: "assistant" as const, text: "Tracked ₹450 under Food & Beverage. Total spending today: ₹450." },
              ].map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-start" : "justify-end"
                  )}
                >
                  {msg.role === "user" ? (
                    <>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3">
                        <p className="text-xs font-medium text-zinc-500 mb-1">You</p>
                        <p className="text-sm text-zinc-700 leading-relaxed">{msg.text}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-emerald-50 border border-emerald-100 px-4 py-3">
                        <p className="text-xs font-medium text-emerald-600 mb-1">Clawkaka</p>
                        <p className="text-sm text-zinc-700 leading-relaxed">{msg.text}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats – icons aligned, light theme, glass-style */}
      <section className="relative border-y border-zinc-200/80 py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-zinc-50 to-violet-50/50" aria-hidden />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {[
              { value: "🇮🇳", label: "Built for Bharat", icon: Smartphone, iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-600" },
              { value: "24/7", label: "Always Available", icon: Clock, iconBg: "bg-violet-100", iconColor: "text-violet-600", valueColor: "text-violet-600" },
              { value: "₹499", label: "Per Month", icon: IndianRupee, iconBg: "bg-amber-100", iconColor: "text-amber-600", valueColor: "text-amber-600" },
              { value: "100%", label: "On WhatsApp", icon: Smartphone, iconBg: "bg-rose-100", iconColor: "text-rose-600", valueColor: "text-rose-600" },
            ].map((stat, i) => (
              <div
                key={i}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-zinc-200/50 hover:border-zinc-200"
              >
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.iconBg, stat.iconColor)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className={cn("text-3xl font-bold tracking-tight md:text-4xl", stat.valueColor)}>{stat.value}</div>
                  <div className="mt-1 text-sm font-medium text-zinc-600">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features – Bento grid with per-card accents */}
      <section id="features" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-white to-zinc-50/50" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_0%,rgba(16,185,129,0.06),transparent_50%)]" aria-hidden />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-emerald-600 mb-4 tracking-wide uppercase">
              Features
            </span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl mb-5">
              One PA, adapts to anyone
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 leading-relaxed">
              Whether you&apos;re a corporate professional in Bangalore or a shop owner in Jaipur, Clawkaka adapts to your life.
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <BentoGrid>
              {features.map((item, i) => (
                <BentoGridItem
                  key={i}
                  title={item.title}
                  description={item.description}
                  header={item.header}
                  icon={item.icon}
                  accent={item.accent}
                  className="overflow-hidden"
                />
              ))}
            </BentoGrid>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-emerald-50/30" aria-hidden />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-emerald-600 mb-4 tracking-wide uppercase">How it works</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl mb-5">
              From message to memory
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 leading-relaxed">
              Three simple steps: capture, remind, and track. Everything happens through natural conversation.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "01", title: "Just tell me anything", desc: "No forms. No buttons. Message like you're talking to a friend. Natural language in English, Hindi, or Hinglish.", icon: MessageCircle, iconBg: "bg-emerald-500", iconColor: "text-white" },
              { step: "02", title: "I remember everything", desc: "Context-aware reminders that adapt to your schedule. Proactive nudges before you forget.", icon: Calendar, iconBg: "bg-cyan-500", iconColor: "text-white" },
              { step: "03", title: "Patterns emerge", desc: "Track calories, expenses, or anything you need. Automatic categorization and weekly summaries.", icon: Brain, iconBg: "bg-violet-500", iconColor: "text-white" },
            ].map((item, i) => (
              <Card key={i} className="border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-zinc-300">
                <CardHeader className="space-y-4">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg", item.iconBg, item.iconColor)}>
                    <item.icon className="h-7 w-7" />
                  </div>
                  <Badge variant="outline" className="w-fit border-zinc-200 bg-zinc-50 text-zinc-600 text-xs">
                    STEP {item.step}
                  </Badge>
                  <CardTitle className="text-xl text-zinc-900">{item.title}</CardTitle>
                  <CardDescription className="text-zinc-600 leading-relaxed">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 via-white to-zinc-50/80" aria-hidden />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-emerald-600 mb-4 tracking-wide uppercase">Use cases</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl mb-5">
              Built for Bharat
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 leading-relaxed">
              From IT professionals in Pune to kirana store owners in Lucknow — Clawkaka works the way India works.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-emerald-200">
              <CardHeader className="space-y-4">
                <Badge className="w-fit bg-emerald-100 text-emerald-800 border-emerald-200">For Professionals</Badge>
                <CardTitle className="text-2xl text-zinc-900">Corporate Worker</CardTitle>
                <CardContent className="px-0 pt-2">
                  <ul className="space-y-3">
                    {["Track work tasks and meeting reminders", "Monitor daily calorie intake and health goals", "Manage personal expenses and subscriptions", "Get weekly summaries and monthly reports"].map((t, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-600">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </CardHeader>
            </Card>
            <Card className="overflow-hidden border border-zinc-200/90 bg-white/90 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-cyan-200">
              <CardHeader className="space-y-4">
                <Badge className="w-fit bg-cyan-100 text-cyan-800 border-cyan-200">For Business</Badge>
                <CardTitle className="text-2xl text-zinc-900">SME Owner</CardTitle>
                <CardContent className="px-0 pt-2">
                  <ul className="space-y-3">
                    {["Track receivables and payables from clients", "Maintain contact ledgers automatically", "Business expense categorization and tracking", "Hindi/Hinglish support for local businesses"].map((t, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-600">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100">
                          <Check className="h-3 w-3 text-cyan-600" />
                        </div>
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-50 via-white to-emerald-50/40" aria-hidden />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-emerald-600 mb-4 tracking-wide uppercase">Testimonials</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl mb-5">
              Loved by thousands
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 leading-relaxed">
              See what our users have to say about their experience with Clawkaka.
            </p>
          </div>
          <Marquee speed={40} pauseOnHover>
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex w-[340px] shrink-0 flex-col rounded-2xl border border-zinc-200/90 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={t.src}
                    alt={t.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-100"
                  />
                  <div>
                    <p className="font-semibold text-zinc-900">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.designation}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed line-clamp-4">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-emerald-50/40" aria-hidden />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-semibold text-emerald-600 mb-4 tracking-wide uppercase">Pricing</span>
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl mb-5">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-zinc-600 leading-relaxed">
              One price. All features. No hidden costs.
            </p>
          </div>
          <div className="mx-auto max-w-md">
            <Card className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-white/95 shadow-xl shadow-emerald-500/10 backdrop-blur-sm">
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-full blur-2xl" aria-hidden />
              <Badge className="absolute right-6 top-6 rounded-full bg-emerald-600 text-white border-0">Best Value</Badge>
              <CardHeader className="pb-4 relative">
                <CardTitle className="text-2xl text-zinc-900">Personal Assistant</CardTitle>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-emerald-600">₹499</span>
                  <span className="text-zinc-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-8 relative">
                {[
                  "Unlimited messages and reminders",
                  "Calorie and expense tracking",
                  "Proactive reminders and nudges",
                  "Weekly and monthly summaries",
                  "Multi-language support",
                  "Web dashboard access",
                  "24/7 availability",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-zinc-700">{f}</span>
                  </div>
                ))}
                <Button size="lg" className="mt-4 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25" asChild>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Start on WhatsApp
                  </a>
                </Button>
                <p className="text-center text-sm text-zinc-500">No app download · No signup · 7-day free trial</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-white to-zinc-50" aria-hidden />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(16,185,129,0.08),transparent)]" aria-hidden />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl md:text-7xl mb-6">
              Ready to never forget again?
            </h2>
            <p className="mx-auto max-w-xl text-lg text-zinc-600 leading-relaxed">
              Join Indians who&apos;ve made Clawkaka their personal assistant. No app download. No signup. Just WhatsApp.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-lg">
                <QRCodeSVG
                  value={WHATSAPP_URL}
                  size={200}
                  level="H"
                  fgColor="#059669"
                  imageSettings={{
                    src: "",
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>
              <p className="text-sm font-medium text-zinc-600">Scan to chat on WhatsApp</p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-6">
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Or tap the button</p>
              <Button size="lg" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 px-10 py-6 text-lg" asChild>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Message on WhatsApp
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <p className="text-sm text-zinc-500 text-center max-w-xs">
                Works in English, Hindi, and Hinglish. Built for every Indian.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 py-14 px-6 bg-gradient-to-b from-zinc-50 to-zinc-100/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:grid-cols-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-zinc-900">Clawkaka</span>
              </div>
              <p className="text-sm text-zinc-600">India&apos;s personal assistant on WhatsApp.</p>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#features" className="hover:text-zinc-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-zinc-900 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500">
            © 2026 Clawkaka. Proudly built in India 🇮🇳
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-zinc-100 to-zinc-50">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center transition-transform duration-500 group-hover/bento:scale-105"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
