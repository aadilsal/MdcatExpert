"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Loader2,
    Send,
    BookOpen,
    Target,
    Zap,
    Maximize2,
    X,
    LayoutDashboard,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitQuizAction } from "../actions";

interface Option {
    id: string;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    id: string;
    question_text: string;
    subject: string;
    image_url: string | null;
    options: Option[];
}

interface Paper {
    id: string;
    title: string;
    year: number;
    total_questions: number;
}

export default function QuizPage({
    params,
}: {
    params: Promise<{ paperId: string }>;
}) {
    const router = useRouter();
    const [paperId, setPaperId] = useState<string | null>(null);
    const [paper, setPaper] = useState<Paper | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [zenMode, setZenMode] = useState(false);

    // Resolve params
    useEffect(() => {
        params.then((p) => setPaperId(p.paperId));
    }, [params]);

    // Fetch paper and questions
    useEffect(() => {
        if (!paperId) return;
        const fetchData = async () => {
            const supabase = createClient();

            const { data: paperData } = await supabase
                .from("papers")
                .select("*")
                .eq("id", paperId)
                .single();

            const { data: questionsData } = await supabase
                .from("questions")
                .select("*, options(*)")
                .eq("paper_id", paperId)
                .order("created_at", { ascending: true });

            if (paperData) setPaper(paperData);
            if (questionsData) {
                setQuestions(questionsData);
                // Preload images if any
                questionsData.forEach(q => {
                    if (q.image_url) {
                        const img = new Image();
                        img.src = q.image_url;
                    }
                });
            }
            setLoading(false);
        };
        fetchData();
    }, [paperId]);

    // Timer
    useEffect(() => {
        if (loading) return;
        const interval = setInterval(() => {
            setElapsedSeconds((s) => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [loading]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const selectOption = useCallback(
        (questionId: string, optionId: string) => {
            setSelectedAnswers((prev) => ({
                ...prev,
                [questionId]: optionId,
            }));
        },
        []
    );

    const answeredCount = Object.keys(selectedAnswers).length;
    const currentQuestion = questions[currentIndex];

    const handleSubmit = async () => {
        if (submitting || !paperId) return;
        setSubmitting(true);
        try {
            const { success, attemptId } = await submitQuizAction(paperId, elapsedSeconds, selectedAnswers);

            if (success) {
                router.push(`/results/${attemptId}`);
            }
        } catch (err: any) {
            console.error("Submit error:", err);
            // In a real app, use a toast here
        } finally {
            setSubmitting(false);
            setShowConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full"
                />
                <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Constructing Question Set...</p>
            </div>
        );
    }

    if (!paper || questions.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl">
                    <AlertCircle className="w-16 h-16 text-primary-200 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Paper Empty or Missing</h2>
                    <p className="text-gray-500 mb-8 font-medium">This paper doesn&apos;t seem to have any questions currently.</p>
                    <button
                        onClick={() => router.push("/papers")}
                        className="px-8 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 active:scale-95"
                    >
                        Return to Archives
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative min-h-screen ${zenMode ? "bg-[#09090b] text-white" : "bg-[#FDFDFF]"} transition-colors duration-500`}>

            {/* Top Navigation Pill (Floating in Zen Mode, Static otherwise) */}
            <motion.div
                layout
                className={`flex items-center justify-between p-4 sm:p-6 mb-8 transition-all duration-500 ${zenMode
                        ? "fixed top-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl"
                        : "bg-white border border-gray-100 rounded-[2rem] shadow-sm"
                    }`}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${zenMode ? "bg-white/10 text-primary-400" : "bg-primary-50 text-primary-600"}`}>
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className={`font-black tracking-tight text-sm sm:text-base ${zenMode ? "text-white" : "text-gray-900"}`}>
                            {paper.title}
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i < (answeredCount / questions.length) * 4 ? "bg-primary-500" : "bg-gray-200 opacity-20"}`} />
                                ))}
                            </div>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${zenMode ? "text-white/40" : "text-gray-400"}`}>
                                {answeredCount}/{questions.length} Progress
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${zenMode
                            ? "bg-white/5 border-white/10 text-primary-400"
                            : "bg-gray-50 border-gray-100 text-gray-900 shadow-inner"
                        }`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-black text-sm tracking-tighter">
                            {formatTime(elapsedSeconds)}
                        </span>
                    </div>

                    <button
                        onClick={() => setZenMode(!zenMode)}
                        className={`p-2.5 rounded-xl transition-all ${zenMode ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-50 text-gray-400 hover:bg-white hover:text-primary-600 shadow-sm"}`}
                    >
                        {zenMode ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                </div>
            </motion.div>

            {/* Main Quiz Area */}
            <div className={`max-w-4xl mx-auto pb-32 transition-all duration-500 ${zenMode ? "pt-32" : ""}`}>

                {/* Large Question Progression Visual */}
                {!zenMode && (
                    <div className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-4 scrollbar-none px-1">
                        {questions.map((q, idx) => {
                            const isAnswered = !!selectedAnswers[q.id];
                            const isCurrent = idx === currentIndex;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`relative min-w-[10px] h-1.5 rounded-full transition-all duration-300 ${isCurrent
                                            ? "w-12 bg-primary-600"
                                            : isAnswered
                                                ? "w-4 bg-emerald-400 opacity-60"
                                                : "w-2 bg-gray-200"
                                        }`}
                                />
                            );
                        })}
                    </div>
                )}

                {/* Submitting Overlay */}
                <AnimatePresence>
                    {submitting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center text-white"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-24 h-24 bg-primary-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary-600/40"
                            >
                                <Zap className="w-12 h-12 text-white" />
                            </motion.div>
                            <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">Calculating Results...</h3>
                            <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Analyzing subject performance</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Question Section */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`overflow-hidden transition-all duration-500 rounded-[2.5rem] ${zenMode
                                ? "bg-white/5 border border-white/5"
                                : "bg-white border border-gray-100 shadow-xl shadow-gray-200/20"
                            }`}
                    >
                        {/* Question Header */}
                        <div className={`px-8 py-6 flex items-center justify-between border-b ${zenMode ? "bg-white/5 border-white/5" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className="flex items-center gap-4">
                                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black ${zenMode ? "bg-white/10 text-white" : "bg-gray-900 text-white"}`}>
                                    {currentIndex + 1}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${zenMode ? "text-white/40" : "text-gray-400"}`}>
                                    Chapter Archive
                                </span>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${currentQuestion.subject === "Biology" ? "bg-emerald-500/10 text-emerald-500" :
                                    currentQuestion.subject === "Chemistry" ? "bg-purple-500/10 text-purple-500" :
                                        currentQuestion.subject === "Physics" ? "bg-blue-500/10 text-blue-500" :
                                            "bg-amber-500/10 text-amber-500"
                                }`}>
                                {currentQuestion.subject}
                            </span>
                        </div>

                        {/* Question Body */}
                        <div className="p-8 sm:p-12">
                            <h3 className={`text-xl sm:text-3xl font-bold leading-tight mb-10 ${zenMode ? "text-white" : "text-gray-900"}`}>
                                {currentQuestion.question_text}
                            </h3>

                            {currentQuestion.image_url && (
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="mb-10 rounded-3xl overflow-hidden border border-gray-100/10 bg-black/5 p-4"
                                >
                                    <img
                                        src={currentQuestion.image_url}
                                        alt="Question visualization"
                                        className="w-full max-h-96 object-contain"
                                    />
                                </motion.div>
                            )}

                            {/* Options Grid */}
                            <div className="grid gap-4">
                                {currentQuestion.options.map((option, optIdx) => {
                                    const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                                    const label = String.fromCharCode(65 + optIdx);
                                    return (
                                        <motion.button
                                            key={option.id}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => selectOption(currentQuestion.id, option.id)}
                                            className={`group w-full flex items-center gap-6 px-6 py-5 rounded-3xl border-2 text-left transition-all duration-300 ${isSelected
                                                    ? "bg-primary-600 border-primary-600 shadow-xl shadow-primary-600/20"
                                                    : zenMode
                                                        ? "bg-white/5 border-white/5 hover:bg-white/10"
                                                        : "bg-gray-50/50 border-gray-50 hover:bg-white hover:border-primary-100"
                                                }`}
                                        >
                                            <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black transition-all ${isSelected
                                                    ? "bg-white text-primary-600"
                                                    : zenMode
                                                        ? "bg-white/10 text-white/60 group-hover:bg-white/20 group-hover:text-white"
                                                        : "bg-white text-gray-400 group-hover:text-primary-600 shadow-sm"
                                                }`}>
                                                {label}
                                            </span>
                                            <span className={`flex-1 font-bold text-lg ${isSelected ? "text-white" : zenMode ? "text-white/70" : "text-gray-700"
                                                }`}>
                                                {option.option_text}
                                            </span>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                    className="w-6 h-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center"
                                                >
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Floating Control Center */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl px-6 py-4 rounded-[2.5rem] flex items-center justify-between shadow-2xl transition-all duration-500 ${zenMode
                    ? "bg-white/10 backdrop-blur-2xl border border-white/10"
                    : "bg-black backdrop-blur-xl border border-gray-800"
                }`}>
                <button
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="p-3 text-white/50 hover:text-white disabled:opacity-20 hover:bg-white/10 rounded-2xl transition-all"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-center">
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Position</span>
                        <span className="text-white font-black text-sm italic">{currentIndex + 1} / {questions.length}</span>
                    </div>

                    <div className="h-8 w-px bg-white/10" />

                    <AnimatePresence mode="wait">
                        {currentIndex === questions.length - 1 ? (
                            <motion.button
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                onClick={() => setShowConfirm(true)}
                                className="px-8 py-3 bg-primary-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95"
                            >
                                Submit Prep
                            </motion.button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest hidden sm:block">Swipe</span>
                                <button
                                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                                    className="p-4 bg-primary-600 text-white rounded-[1.5rem] shadow-xl shadow-primary-600/20 active:scale-90 transition-all hover:bg-primary-500"
                                >
                                    <ChevronRight className="w-8 h-8 font-black" />
                                </button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => router.push("/papers")}
                    className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
                >
                    <LayoutDashboard className="w-6 h-6" />
                </button>
            </div>

            {/* Premium Confirm Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl"
                        >
                            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Send className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 text-center mb-4 tracking-tighter">Complete Session?</h3>
                            <div className="bg-gray-50 rounded-3xl p-6 space-y-3 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">Attempt Density</span>
                                    <span className="font-black text-gray-900 italic">{Math.round((answeredCount / questions.length) * 100)}%</span>
                                </div>
                                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-600 rounded-full"
                                        style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-6 py-4 bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    Review
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-4 bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all"
                                >
                                    Finish Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
