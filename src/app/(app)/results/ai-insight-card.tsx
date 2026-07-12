"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, BrainCircuit, Lightbulb, Loader2, Target, BookOpen } from "lucide-react";
import { generateAnswerInsight } from "./actions";
import PremiumFeatureModal from "@/components/premium-feature-modal";

interface AIInsight {
    reasoning: string;
    misconception: string;
    recommendation: string;
}

interface AIInsightCardProps {
    answerId: string;
    initialInsight?: AIInsight | null;
    questionText?: string;
    isPremiumUser?: boolean;
}

export default function AIInsightCard({ answerId, initialInsight, questionText, isPremiumUser = true }: AIInsightCardProps) {
    const [insight, setInsight] = useState<AIInsight | null>(initialInsight || null);
    const [loading, setLoading] = useState(isPremiumUser && !initialInsight);
    const [error, setError] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        if (!isPremiumUser) return;
        const fetchInsight = async () => {
            if (insight) return;
            try {
                const data = await generateAnswerInsight(answerId);
                setInsight(data as AIInsight);
            } catch (err) {
                console.error("AI Insight failed:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchInsight();
    }, [answerId, insight, isPremiumUser]);

    if (!isPremiumUser) {
        return (
            <div className="mt-6 relative overflow-hidden rounded-[2rem] border border-amber-200 bg-amber-50/20 p-6 sm:p-8">
                {/* Elite Badge Overlay */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                    <Sparkles className="w-3 h-3 text-slate-950" />
                    Elite AI Insight Locked
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="space-y-2 max-w-lg">
                        <h4 className="text-sm font-black text-amber-800">Learn why you got this question wrong</h4>
                        <p className="text-xs text-amber-700 font-bold leading-relaxed">
                            Upgrade to Elite to unlock the AI Mistake Analyzer. It identifies your exact misconception, explains why you fell for the distractor, and gives you a pro-tip to avoid it next time.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setModalOpen(true);
                        }}
                        className="py-3.5 px-6 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shrink-0"
                    >
                        Analyze Mistake
                    </button>
                </div>
                
                {/* Blurry preview mockup */}
                <div className="mt-6 blur-xs select-none pointer-events-none opacity-20 space-y-4">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-gray-200" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-300 w-24 rounded" />
                            <div className="h-3 bg-gray-200 w-full rounded" />
                        </div>
                    </div>
                </div>

                <PremiumFeatureModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    featureName="AI Mistake Analyzer"
                    outcomeText="Instantly correct the errors dropping your MDCAT score"
                    descriptionText="Our AI analyzes your incorrect answer selection to tell you exactly which misconception you had, why the correct answer is right, and gives you a custom recommendation to master the concept."
                    whyStudentsUseIt="MDCAT toppers use mistake analysis to surgically fix weak concepts before exam day."
                    source="mistake_analyzer_lock"
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="mt-4 p-6 bg-primary-50/50 rounded-2xl border border-primary-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 animate-pulse">Running AI Mistake Analysis...</p>
            </div>
        );
    }

    if (error || !insight) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 relative"
        >
            {/* Elite Badge Overlay */}
            <div className="absolute -top-3 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                <Sparkles className="w-3 h-3 text-primary-400" />
                Elite AI Analysis
            </div>
 
            <div className="bg-linear-to-br from-gray-50 to-white border border-primary-100 rounded-4xl p-6 sm:p-8 shadow-sm">
                <div className="space-y-6">
                    {/* Reasoning Section */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">Reasoning Pattern</h4>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed italic">
                                &ldquo;{insight.reasoning}&rdquo;
                            </p>
                        </div>
                    </div>
 
                    <div className="h-px bg-primary-100/50 ml-14" />
 
                    {/* Misconception Section */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Core Misconception</h4>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                {insight.misconception}
                            </p>
                        </div>
                    </div>
 
                    {/* Recommendation Tooltip-style info */}
                    <div className="bg-primary-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-primary-600/20">
                        <Lightbulb className="w-8 h-8 text-primary-200 shrink-0" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-200">Pro Tip</p>
                            <p className="text-sm font-black italic">{insight.recommendation}</p>
                        </div>
                    </div>
 
                    {questionText && (
                        <Link
                            href={`/copilot/chat/new?mode=explain&q=${encodeURIComponent(`Explain this MDCAT question and why students get it wrong: ${questionText}`)}`}
                            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors"
                        >
                            <BookOpen className="w-4 h-4" />
                            Ask Study Copilot
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
