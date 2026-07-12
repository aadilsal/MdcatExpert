"use client";

import { X, Sparkles, Check, Rocket } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";

interface PremiumFeatureModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  outcomeText: string;
  descriptionText: string;
  whyStudentsUseIt: string;
  ctaText?: string;
  source?: string;
}

export default function PremiumFeatureModal({
  open,
  onClose,
  featureName,
  outcomeText,
  descriptionText,
  whyStudentsUseIt,
  ctaText = "Upgrade to Elite Premium",
  source = "modal_popup",
}: PremiumFeatureModalProps) {
  if (!open) return null;

  const handleCtaClick = () => {
    trackEvent(ANALYTICS_EVENTS.PREMIUM_CTA_CLICK, { feature: featureName, source });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 250 }}
          className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl text-white overflow-hidden"
        >
          {/* Top accent light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary-600/35 rounded-full blur-[50px] pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 relative z-10">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Elite Feature Preview</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6 relative z-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic text-white tracking-tight">{featureName}</h2>
              <p className="text-emerald-400 font-bold text-lg leading-snug">{outcomeText}</p>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">What it does</span>
                <p className="text-slate-300 text-sm leading-relaxed mt-1 font-medium">{descriptionText}</p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-4.5 h-4.5 font-bold" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Why MDCAT students rely on it</span>
                  <p className="text-slate-200 text-xs font-bold leading-relaxed mt-0.5">{whyStudentsUseIt}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Link
                href={`/upgrade?reason=${encodeURIComponent(featureName)}`}
                onClick={handleCtaClick}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <Rocket className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                {ctaText}
              </Link>
              <button
                onClick={onClose}
                className="w-full py-4 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest text-center transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
