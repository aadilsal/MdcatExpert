"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, Lightbulb, Loader2, Target, AlertCircle } from "lucide-react";
import { generateAnswerInsight } from "./actions";

interface AIInsight {
    reasoning: string;
    misconception: string;
    recommendation: string;
}

interface AIInsightCardProps {
    answerId: string;
    initialInsight?: AIInsight | null;
}

export default function AIInsightCard({ answerId, initialInsight }: AIInsightCardProps) {
    const [insight, setInsight] = useState<AIInsight | null>(initialInsight || null);
    const [loading, setLoading] = useState(!initialInsight);
    const [error, setError] = useState(false);

    useEffect(() => {
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
    }, [answerId, insight]);

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

            <div className="bg-gradient-to-br from-gray-50 to-white border border-primary-100 rounded-[2rem] p-6 sm:p-8 shadow-sm">
                <div className="space-y-6">
                    {/* Reasoning Section */}
                    <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                            <BrainCircuit className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">Reasoning Pattern</h4>
                            <p className="text-sm font-bold text-gray-800 leading-relaxed italic">
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
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">
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
                </div>
            </div>
        </motion.div>
    );
}
