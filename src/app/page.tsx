"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Clock,
  Target,
  Zap,
  TrendingUp,
  GraduationCap,
  Star,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useRef } from "react";

export default function HomePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-white">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                Mdcat<span className="text-primary-600">Xpert</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8" />

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:block px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
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
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Premium Background Elements */}
        <div className="absolute inset-0 z-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: [0, 90, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary-100/40 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, -60, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/30 rounded-full blur-[100px]"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/50 backdrop-blur-md border border-primary-100 text-primary-700 text-xs font-black uppercase tracking-widest mb-10 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-primary-500" />
            The Ultimate Preparation Tool
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl sm:text-7xl lg:text-[100px] font-black text-gray-900 leading-[0.9] tracking-tighter mb-8"
          >
            Ace your <span className="text-primary-600 italic">MDCAT</span>
            <br />
            with <motion.span
              animate={{ color: ["#1d4ed8", "#3b82f6", "#1d4ed8"] }}
              transition={{ duration: 4, repeat: Infinity }}
            >Precision.</motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl text-gray-500 leading-relaxed max-w-3xl mx-auto font-medium mb-12"
          >
            Don&apos;t just practice. Master the pattern. Real past papers,
            smart subject-wise analytics, and the edge you need for Pakistan&apos;s toughest medical entrance exam.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              href="/signup"
              className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-black text-white bg-primary-600 rounded-[2rem] hover:bg-primary-700 transition-all shadow-2xl shadow-primary-600/30 active:scale-95"
            >
              Start For Free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Trust Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-24 pt-12 border-t border-gray-100/50 flex flex-wrap items-center justify-center gap-8 sm:gap-16 grayscale opacity-50"
          >
            {[
              { label: "BIOLOGY", icon: GraduationCap },
              { label: "CHEMISTRY", icon: Target },
              { label: "PHYSICS", icon: Zap },
              { label: "ENGLISH", icon: BarChart3 },
            ].map((i) => (
              <div key={i.label} className="flex items-center gap-2 text-sm font-black tracking-widest text-gray-900">
                <i.icon className="w-5 h-5" />
                {i.label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features - Scrolltelling Section */}
      <section id="features" className="relative py-32 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/2 space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-[0.2em]">
                Elite Performance
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight">
                Built for the <br />
                <span className="text-primary-600">Top 1%.</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-xl">
                We didn&apos;t just build another quiz app. We built a data engine that predicts your MDCAT performance by analyzing your past attempts and subject mastery.
              </p>

              <ul className="space-y-6">
                {[
                  { title: "Smarter Analytics", desc: "No more guessing. See your accuracy by subject instantly.", icon: BarChart3 },
                  { title: "Paper Archives", desc: "Access verified papers from the last 10 years.", icon: ShieldCheck },
                  { title: "Exam Simulator", desc: "Real-time clock tracking your pressure performance.", icon: Clock },
                ].map((item) => (
                  <motion.li
                    key={item.title}
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-4 group cursor-default"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:text-primary-600 transition-colors">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="lg:w-1/2 relative"
            >
              {/* Fake Dashboard Preview UI */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl" />
                    <div className="space-y-1">
                      <div className="w-24 h-3 bg-gray-100 rounded-full" />
                      <div className="w-16 h-2 bg-gray-50 rounded-full" />
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-primary-50 rounded-lg animate-pulse" />
                </div>

                <div className="space-y-6">
                  {[85, 42, 91].map((p, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-black text-gray-600 uppercase">
                        <span>Subject {idx + 1}</span>
                        <span>{p}%</span>
                      </div>
                      <div className="h-3 bg-gray-50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-primary-600 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4">
                  <div className="h-24 bg-gray-50 rounded-3xl" />
                  <div className="h-24 bg-primary-600 rounded-3xl flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Overlays */}
                <div className="absolute inset-0 bg-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>

              {/* Floating Element */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 hidden sm:block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">+12%</p>
                    <p className="text-xs text-gray-400 font-bold tracking-tight">Weekly Score Jump</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Grid Highlights */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Authentic Papers", desc: "No fake questions. Only real MDCAT materials.", icon: ShieldCheck, color: "blue" },
              { title: "All Devices", desc: "Practice on your phone while commuting.", icon: Smartphone, color: "emerald" },
              { title: "Subject Focus", desc: "Drill down into Biology, Physics or Chemistry.", icon: Box, color: "purple" },
              { title: "Free Always", desc: "Premium features without the premium price.", icon: Star, color: "amber" },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all group"
              >
                <div className="mb-6 w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Layer */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-black rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden"
          >
            {/* Dark Mode Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none" />

            <h2 className="text-4xl sm:text-6xl font-black text-white mb-8 tracking-tighter">
              Ready to claim your <br />
              <span className="text-primary-400 font-normal italic">Medical Seat?</span>
            </h2>
            <p className="text-lg text-gray-400 font-medium mb-12 max-w-xl mx-auto">
              Join thousands of students who are already using MdcatXpert to gain a competitive edge.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-4 px-12 py-6 text-xl font-black text-black bg-white rounded-[2rem] hover:bg-primary-50 transition-all active:scale-95"
            >
              Sign Up For Free
              <ChevronRight className="w-6 h-6" />
            </Link>

            <div className="mt-12 flex items-center justify-center gap-4 text-xs font-black tracking-widest text-gray-600 uppercase">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary-500" /> SECURE</span>
              <span className="w-1 h-1 bg-gray-800 rounded-full" />
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary-500" /> FREE</span>
              <span className="w-1 h-1 bg-gray-800 rounded-full" />
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary-500" /> OFFICIAL PAPERS</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 uppercase">MdcatXpert</span>
            </Link>
            <p className="text-gray-500 font-medium max-w-sm">
              The only dedicated preparation platform for Pakistani medical aspirants that prioritizes data-driven insights.
            </p>
          </div>

          <div>
            <h5 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-6">Product</h5>
            <ul className="space-y-4">
              {[
                { name: 'Home', href: '/' },
                { name: 'Features', href: '#features' }, // Features are on this page
                { name: 'Analytics', href: '/login' }, // Gated: ask to login first
                { name: 'Papers', href: '/login' }     // Gated: ask to login first
              ].map(i => (
                <li key={i.name}><Link href={i.href} className="text-gray-500 text-sm font-semibold hover:text-primary-600 transition-colors">{i.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-6">Support</h5>
            <ul className="space-y-4">
              {[
                { name: 'Help Center', href: '/help' },
                { name: 'Terms', href: '/terms' },
                { name: 'Privacy', href: '/privacy' },
                { name: 'Contact', href: '/contact' }
              ].map(i => (
                <li key={i.name}><Link href={i.href} className="text-gray-500 text-sm font-semibold hover:text-primary-600 transition-colors">{i.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-20 pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
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

// Missing Lucide Icon: Box
const Box = ({ className }: { className: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
