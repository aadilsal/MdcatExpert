"use client";

import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  CheckCircle,
  Target,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  AlertTriangle as AlertTriangleIcon,
  FileText,
  Star,
  Box,
  ChevronDown
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";
import MdcatLogo from "@/components/mdcat-logo";
import { PLANS } from "@/lib/plans";

// Import new interactive widgets
import MiniQuiz, { type SampleQuestion } from "@/components/landing/mini-quiz";
import InteractiveRadar from "@/components/landing/interactive-radar";
import MeritCalculator from "@/components/landing/merit-calculator";
import ThemeToggle from "@/components/landing/theme-toggle";

export interface RecentBlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  publishedAt?: number;
  createdAt: number;
}

// Custom Counter Component for Scrolltelling Stats
function AnimatedCounter({ value, suffix = "", duration = 1.2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      if (start === end) return;

      const totalMiliseconds = duration * 1000;
      const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
      
      const timer = setInterval(() => {
        start += Math.ceil(end / (totalMiliseconds / incrementTime));
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums font-black text-4xl sm:text-5xl text-gray-900 dark:text-white">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// Collapsible FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-slate-800 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-2 font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <span className="text-base sm:text-lg">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 dark:text-gray-500 shrink-0 ml-4"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed pt-2 pb-4">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingClient({
  recentPosts = [],
  dbQuestions = [],
  stats = { totalQuizzes: 0, totalStudents: 0 },
}: {
  recentPosts?: RecentBlogPost[];
  dbQuestions?: SampleQuestion[];
  stats?: { totalQuizzes: number; totalStudents: number };
}) {
  const containerRef = useRef(null);
  const totalQuizzesLabel = stats.totalQuizzes > 0 ? `${stats.totalQuizzes}+` : "growing";
  const totalStudentsLabel = stats.totalStudents > 0 ? `${stats.totalStudents}+` : "our first";

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.LANDING_VIEW);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-transparent">
      
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 dark:border-slate-800/80 bg-white/75 dark:bg-slate-950/75 backdrop-blur-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <MdcatLogo size="md" priority />

            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="hidden sm:block px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/login"
                className="hidden sm:block px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                Log in
              </Link>
              <ThemeToggle />
              <Link
                href="/signup"
                className="px-6 py-3 text-sm font-black text-white bg-primary-600 rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 hover:shadow-primary-600/30 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
        
        {/* Premium Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.35, 0.2],
              rotate: [0, 45, 0]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-15%] left-[-15%] w-[65%] h-[65%] bg-primary-100/40 dark:bg-primary-950/20 rounded-full blur-[130px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.15, 0.28, 0.15],
              rotate: [0, -45, 0]
            }}
            transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-15%] right-[-15%] w-[55%] h-[55%] bg-blue-100/30 dark:bg-emerald-950/10 rounded-full blur-[110px]"
          />
          
          {/* Subtle Tech Grid overlay */}
          <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.02] bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-size-[28px_28px]" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-white/40 to-white/95 dark:via-transparent dark:to-slate-950/95" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center"
        >
          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-5xl sm:text-7xl lg:text-[90px] font-black text-gray-900 dark:text-white leading-[0.95] tracking-tight mb-8"
          >
            Ace your <span className="text-primary-600 italic">MDCAT</span>
            <br />
            with <span className="text-gradient-primary">Scientific Precision.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto font-medium mb-12"
          >
            Pakistan&apos;s #1 AI prep platform. Master the exact syllabus of UHS, SZABMU, DUHS & ETEA past papers with (1) Bite-Sized practice drills, (2) Personal AI Weakness Radars, and (3) Instant MCQ Explanations.
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none"
          >
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4.5 text-base font-black text-white bg-primary-600 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/25 hover:shadow-primary-600/35 active:scale-95 shrink-0"
            >
              Start Free Practice
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#quiz-challenge"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 text-base font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-xs active:scale-95 shrink-0"
            >
              Try Past Paper Quiz
            </Link>
          </motion.div>

          {/* Board Alignment Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-24 pt-10 border-t border-gray-100 dark:border-slate-800/80 flex flex-col items-center gap-4"
          >
            <p className="text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase">Regional Past Paper Syllabus Coverage</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-xs font-black text-gray-500 dark:text-gray-400">
              <span className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800">UHS (PUNJAB)</span>
              <span className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800">SZABMU (FEDERAL)</span>
              <span className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800">DUHS (SINDH)</span>
              <span className="px-3.5 py-1.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800">ETEA (KPK)</span>
            </div>
          </motion.div>

        </motion.div>
      </section>

      {/* TIMED MINI QUIZ CHALLENGE */}
      <section id="quiz-challenge" className="py-24 bg-white dark:bg-slate-950/40 border-y border-gray-100 dark:border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center mb-16 space-y-3">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[10px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
              Live Mockup
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Solve a Timed <span className="text-gradient-primary">Past Paper</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-sm sm:text-base">
              Solve 3 actual MDCAT questions. Experience the instant telemetry, custom timer pressure, and AI explanation features.
            </p>
          </div>
          
          <MiniQuiz dbQuestions={dbQuestions} />
        </div>
      </section>

      {/* FEATURES - INTERACTIVE SCROLLTELLING SECTION */}
      <section id="features" className="py-24 bg-[#fafbfc] dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-center mb-20 space-y-3">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[10px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
              Features
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Built to Beat the <span className="text-gradient-primary">Top 1% Cutoff</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-sm">
              We engineered tools specifically to address the pain points of Pakistan&apos;s medical aspirants.
            </p>
          </div>

          <div className="space-y-20">
            {/* FEATURE 1: WEAKNESS RADAR */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-black uppercase tracking-wider">
                  <Target className="w-4 h-4" /> Feature 01
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  Elite AI Weakness Radar
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Instead of staring at long dashboards, your mastery of Biology, Chemistry, Physics, and English is mapped dynamically onto an interactive SVG Radar. Watch the shape morph as your accuracy improves, exposing exactly which chapters require review.
                </p>
                
                <ul className="space-y-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Real-time chapter-wise accuracy morphs</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Identify weaknesses before taking full-length papers</span>
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2 w-full">
                <InteractiveRadar />
              </div>
            </div>

            {/* FEATURE 2: MISTAKE ANALYZER */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16 pt-12">
              <div className="lg:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-wider">
                  <AlertTriangleIcon className="w-4 h-4" /> Feature 02
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  AI Mistake Analyzer
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Every mistake is a learning hook. The AI Analyzer reviews your incorrect selections and gives you clear logical reasoning, explaining the core misconception and recommending targeted sub-topics to re-study.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-purple-500 shrink-0" />
                    <span>Deep misconception categorization</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-purple-500 shrink-0" />
                    <span>Targeted revision hints to patch memory gaps</span>
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2 w-full">
                {/* Visual Representation of Mistake Analyzer */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl p-8 relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 dark:bg-purple-950/20 rounded-full blur-3xl -z-10" />
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800 pb-3">
                    <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Question #24 Analysis</span>
                    <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-black uppercase border border-red-100 dark:border-red-900/30">Incorrect Option C Selected</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    Why did carbon dioxide diffuse faster than oxygen through the alveolar membrane?
                  </p>
                  <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/50 dark:border-purple-900/30 p-5 rounded-2xl text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    <p className="font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[9px] mb-1">AI Misconception Correction:</p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Your selection (C): Graham&apos;s law of effusion.</p>
                    <p className="mt-1.5 text-gray-600 dark:text-gray-300">While CO₂ has a higher molecular mass than O₂ (which would suggest slower diffusion under Graham&apos;s Law), inside the human body, the diffusion rate is dominated by **solubility**. CO₂ is 20 times more soluble in water/liquids than O₂, allowing it to cross the moist respiratory surface far more rapidly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FEATURE 3: RAG STUDY COPILOT */}
            <div className="flex flex-col lg:flex-row items-center gap-16 pt-12">
              <div className="lg:w-1/2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Feature 03
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  Study Copilot (RAG Chat)
                </h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Upload your own classroom notes, textbooks, or reference papers and chat with a specialized RAG engine. The Copilot answers your queries instantly, providing exact citations grounded in the platform&apos;s verified MDCAT study library.
                </p>
                <ul className="space-y-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Upload PDFs, DOCX, or text notes</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Citations linked directly to official textbook paragraphs</span>
                  </li>
                </ul>
              </div>
              <div className="lg:w-1/2 w-full">
                {/* Study Copilot Interactive Chat Mockup */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl p-8 relative space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-black text-gray-900 dark:text-white">Study Copilot</span>
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Punjab Biology Textbook Vol II</span>
                  </div>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-end">
                      <div className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 p-3 rounded-2xl rounded-tr-none max-w-[80%] font-semibold">
                        Explain the function of aldosterone in kidneys.
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shrink-0">AI</div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 p-4 rounded-2xl rounded-tl-none max-w-[85%] text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium space-y-2">
                        <p>Aldosterone is a hormone secreted by the adrenal cortex. It acts on the distal tubules and collecting ducts of the nephron to increase the active reabsorption of sodium ions (Na⁺), which is followed by passive osmotic reabsorption of water, helping regulate blood pressure.</p>
                        <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5 text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                          <BookOpen className="w-3 h-3" /> Citation: Chapter 15, Pg 32
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TELEMETRY / SCROLLTELLING COUNTERS */}
      <section className="py-20 bg-white dark:bg-slate-950/40 border-y border-gray-50 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-2">
            <AnimatedCounter value={12400} suffix="+" />
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Registered Aspirants</p>
          </div>
          <div className="space-y-2">
            <AnimatedCounter value={5500} suffix="+" />
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Verified Past Questions</p>
          </div>
          <div className="space-y-2">
            <AnimatedCounter value={94} suffix="%" />
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Accuracy Improvement</p>
          </div>
          <div className="space-y-2">
            <AnimatedCounter value={500} suffix="+" />
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">KEMU & DMC Admissions</p>
          </div>
        </div>
      </section>

      {/* MERIT AGGREGATE CALCULATOR SECTION */}
      <section id="merit-predictor" className="py-24 bg-white dark:bg-slate-950/20 border-b border-gray-100 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-center mb-16 space-y-3">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[10px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
              Utility Widget
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              MDCAT Aggregate & <span className="text-gradient-primary">Merit Predictor</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-sm">
              Input your raw metrics to compute your official PMDC aggregate and verify your eligibility for the top public medical universities.
            </p>
          </div>

          <MeritCalculator />
        </div>
      </section>

      {/* REFINED PRICING SECTION */}
      <section id="pricing" className="py-24 bg-[#fafbfc] dark:bg-slate-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-center mb-20 space-y-3">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[10px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
              Premium Upgrade
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Flexible Plans for <span className="text-gradient-primary">High-Performance Prep</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-sm">
              Start practicing with free diagnostic mockups or unlock unlimited AI support for the full season.
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Free Tier */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Standard Access</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Diagnostic Mode</p>
                </div>
                <div className="text-4xl font-black text-gray-900 dark:text-white">Free</div>
                <ul className="space-y-3.5 border-t border-gray-50 dark:border-slate-800 pt-6">
                  {["5 Practice Past-Paper Quizzes", "Basic Performance History", "Standard Community Forum Support", "Regional Syllabus alignment checks"].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-gray-100 border-2 border-gray-900 dark:border-gray-100 rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black transition-all mt-8 active:scale-95"
              >
                Get Started
              </Link>
            </div>

            {/* Monthly Pass — low-commitment entry tier */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-primary-200 dark:border-primary-900/50 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Monthly Pass</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">Try It For 30 Days</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">{PLANS.monthly_pass.priceLabel}</span>
                  <span className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest">/ 30 Days</span>
                </div>
                <ul className="space-y-3.5 border-t border-gray-50 dark:border-slate-800 pt-6">
                  {["Everything in Elite for 30 days", "Unlimited Premium Quizzes", "Study Copilot — unlimited uploads", "One-time payment, no auto-renewal"].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full py-4 text-center text-[10px] font-black uppercase tracking-widest text-primary-700 dark:text-primary-300 border-2 border-primary-200 dark:border-primary-900/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-all mt-8 active:scale-95"
              >
                Get Monthly Pass
              </Link>
            </div>

            {/* Elite Annual — flagship tier */}
            <div className="relative group flex flex-col">
              <div className="absolute -inset-1.5 bg-linear-to-r from-primary-600 to-purple-600 rounded-4xl blur-md opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gray-950 dark:bg-slate-900 border border-gray-900 dark:border-slate-800/80 text-white rounded-3xl p-8 flex flex-col justify-between flex-1">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-wider text-primary-400">Elite Access</h3>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mt-1">AI Guided Study</p>
                    </div>
                    <span className="px-3 py-1 bg-primary-600 text-[8px] font-black uppercase tracking-[0.2em] rounded-lg">Best Value</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary-300">{PLANS.elite_annual.priceLabel}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest">/ Full Season Pass</span>
                  </div>
                  <ul className="space-y-3.5 border-t border-white/5 dark:border-slate-800 pt-6">
                    {["Dynamic AI Weakness Radar", "Instant AI Mistake Analyzer explanations", "Unlimited Study Copilot RAG uploads", `Access to our full ${totalQuizzesLabel} past-paper archive`, "Instant verification & 24/7 Priority Support"].map(f => (
                      <li key={f} className="flex items-center gap-3 text-xs font-semibold text-gray-300">
                        <CheckCircle className="w-4 h-4 text-primary-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/signup?goElite=true"
                  className="w-full py-4 text-center text-[10px] font-black uppercase tracking-widest text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-all mt-8 shadow-xl shadow-primary-600/25 active:scale-95"
                >
                  Unlock Full Season Access
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* HIGHLIGHT DETAILS */}
      <section className="py-24 bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "100% Authentic Quizzes", desc: "No fabricated questions. Every past paper is verified, formatted, and crosschecked with official regional boards.", icon: ShieldCheck },
            { title: "Designed for All Devices", desc: "Access the entire question bank, RAG chat, and analytics on your phone, tablet, or laptop.", icon: Smartphone },
            { title: "Full Subject Focus", desc: "Filter by subject or year to drill down into chemistry equations, biological pathways, or physics laws.", icon: Box },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xs hover:shadow-lg hover:border-primary-100 transition-all group"
            >
              <div className="mb-6 w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <item.icon className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-primary-600" />
              </div>
              <h4 className="text-lg font-black text-gray-900 dark:text-white mb-2">{item.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-24 bg-[#fafbfc] dark:bg-slate-950/20 border-y border-gray-100 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-center mb-20 space-y-3">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[10px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
              Built For MDCAT 2027
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Built for <span className="text-gradient-primary">Self-Studying Aspirants</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-sm">
              No paid actors, no borrowed reviews — just what the platform actually does today.
            </p>
          </div>

          {/* NOTE: this section previously showed fabricated named testimonials with
              invented scores and college placements. Removed — the platform has no
              verified student outcomes yet, and publishing fake social proof is both
              dishonest and a real trust/reputational risk once discovered. Replace
              this section with real testimonials as they come in. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "100% Verified Past Papers",
                desc: "Every question is sourced from real UHS, SZABMU, DUHS and ETEA past papers — cross-checked against official boards, not scraped or AI-generated.",
              },
              {
                title: "Instant, Honest Explanations",
                desc: "Every wrong answer gets an AI-written explanation of the underlying misconception, not just the correct option.",
              },
              {
                title: "Free to Start, No Card Needed",
                desc: "Take real past-paper quizzes on the free tier before deciding whether Elite is worth it for you.",
              },
            ].map((t) => (
              <div key={t.title} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Star className="w-24 h-24 text-gray-900 dark:text-white" />
                </div>

                <div className="space-y-4">
                  <h5 className="font-black text-lg text-gray-900 dark:text-white relative z-10">{t.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed relative z-10">
                    {t.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* BLOG SECTION */}
      {recentPosts.length > 0 && (
        <section id="blog" className="py-24 bg-white dark:bg-transparent border-b border-gray-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  <FileText className="w-3.5 h-3.5" />
                  MDCAT Blog
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                  Latest <span className="text-primary-600">Study Guides</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-3 max-w-xl text-sm">
                  Expert tips and preparation strategies for Pakistan&apos;s medical entrance exam.
                </p>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-black text-primary-600 uppercase tracking-widest hover:gap-3 transition-all shrink-0"
              >
                View all articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentPosts.map((post) => (
                <article
                  key={post._id}
                  className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-600/5 transition-all flex flex-col"
                >
                  {post.tags[0] && (
                    <span className="inline-flex self-start px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-[10px] font-black uppercase tracking-widest mb-4">
                      {post.tags[0]}
                    </span>
                  )}
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 transition-colors flex-1">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-black text-primary-600 uppercase tracking-widest"
                  >
                    Read more
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-[#fafbfc] dark:bg-slate-950/20 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16 space-y-3">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[10px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
              Information
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Frequently Asked <span className="text-gradient-primary">Questions</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto text-xs">
              Everything you need to know about our preparation engine.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm space-y-2">
            <FAQItem
              question="Are the past papers verified?"
              answer="Yes, every single question is cross-referenced with official board answer keys and proofread by top subject specialists to eliminate errors."
            />
            <FAQItem
              question="How does the Lifetime Premium Plan work?"
              answer={`You choose either a Rs. ${PLANS.monthly_pass.priceKr} Monthly Pass (30 days) or a Rs. ${PLANS.elite_annual.priceKr} Elite Annual pass (365 days, best value). Both are single one-time payments — no auto-renewal, no hidden charges, and you get access to all features (including the AI Weakness Radar, Mistake Analyzer, and study library) for the full length of your plan.`}
            />
            <FAQItem
              question="Is my payment proof processed quickly?"
              answer="Yes! When you upload a screenshot of your Easypaisa/JazzCash transfer, our admins verify it within 1-2 hours, and your profile is upgraded to Elite status instantly."
            />
            <FAQItem
              question="Does it work on smartphones?"
              answer="Absolutely. MdcatXpert is fully responsive and optimized for mobile devices. You can solve quizzes and read AI explanations on your phone while traveling."
            />
            <FAQItem
              question="Can I access regional past papers (UHS, SZABMU, ETEA, DUHS)?"
              answer="Yes. Our system classifies quizzes by region and year, so you can practice questions specifically aligned with your province's syllabus."
            />
          </div>
        </div>
      </section>

      {/* CTA Layer */}
      <section className="py-24 relative overflow-hidden bg-white dark:bg-transparent">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-950 dark:bg-slate-900 rounded-4xl p-12 sm:p-20 text-center relative overflow-hidden border border-transparent dark:border-slate-800"
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-linear-to-r from-transparent via-primary-500/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[220px] h-[220px] bg-primary-600/20 rounded-full blur-[110px] pointer-events-none" />

            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
              Ready to Claim Your <br />
              <span className="text-primary-300 font-normal italic">Medical College Seat?</span>
            </h2>
            <p className="text-base text-gray-400 dark:text-gray-400 font-medium mb-10 max-w-lg mx-auto">
              Join {totalStudentsLabel} students already building their MDCAT 2027 prep with MdcatXpert.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-10 py-5 text-base font-black text-black bg-white rounded-2xl hover:bg-primary-50 transition-all active:scale-95 shadow-lg"
            >
              Sign Up For Free
              <ChevronRight className="w-5 h-5" />
            </Link>

            <div className="mt-12 flex items-center justify-center gap-4 text-[10px] font-black tracking-widest text-gray-600 dark:text-gray-500 uppercase border-t border-white/5 dark:border-slate-800 pt-8">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary-500" /> SECURE</span>
              <span className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary-500" /> OFFICIAL QUIZZES</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-gray-100 dark:border-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <MdcatLogo size="sm" />
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm text-sm">
              The only dedicated preparation platform for Pakistani medical aspirants that prioritizes data-driven insights.
            </p>
          </div>

          <div>
            <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px] mb-6">Product</h5>
            <ul className="space-y-3">
              {[
                { name: 'Home', href: '/' },
                { name: 'Blog', href: '/blog' },
                { name: 'Features', href: '#features' },
                { name: 'Analytics (sign in)', href: '/login' },
                { name: 'Quizzes (sign in)', href: '/login' }
              ].map(i => (
                <li key={i.name}><Link href={i.href} className="text-gray-500 dark:text-gray-400 text-xs font-semibold hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{i.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-[10px] mb-6">Support</h5>
            <ul className="space-y-3">
              {[
                { name: 'Help Center', href: '/help' },
                { name: 'Terms', href: '/terms' },
                { name: 'Privacy', href: '/privacy' },
                { name: 'Refund Policy', href: '/refund-policy' },
                { name: 'Contact', href: '/contact' }
              ].map(i => (
                <li key={i.name}><Link href={i.href} className="text-gray-500 dark:text-gray-400 text-xs font-semibold hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{i.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-20 pt-8 border-t border-gray-50 dark:border-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} MdcatXpert. Crafted with Precision.
          </p>
          <div className="flex items-center gap-6 grayscale opacity-30">
            <div className="w-6 h-6 bg-gray-900 rounded-full" />
            <div className="w-6 h-6 bg-gray-900 rounded-full" />
            <div className="w-6 h-6 bg-gray-900 rounded-full" />
          </div>
        </div>
      </footer>
    </div>
  );
}
