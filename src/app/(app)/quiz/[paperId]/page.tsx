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
    Target,
    Zap,
    Maximize2,
    X,
    LayoutDashboard,
    Bookmark,
    BookmarkCheck,
    Menu,
    Grid3X3,
    ArrowRight,
    Flag,
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
    const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [zenMode, setZenMode] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [timePerQuestion, setTimePerQuestion] = useState<Record<string, number>>({});
    const lastQuestionStartTime = useRef<number>(Date.now());
    const currentIndexRef = useRef(currentIndex);

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

    // Track time spent per question whenever currentIndex changes
    useEffect(() => {
        const now = Date.now();
        const prevIndex = currentIndexRef.current;

        if (questions[prevIndex]) {
            const prevQId = questions[prevIndex].id;
            const spent = Math.floor((now - lastQuestionStartTime.current) / 1000);
            setTimePerQuestion(prev => ({
                ...prev,
                [prevQId]: (prev[prevQId] || 0) + spent
            }));
        }

        lastQuestionStartTime.current = now;
        currentIndexRef.current = currentIndex;
    }, [currentIndex, questions]);

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

    const toggleFlag = (questionId: string) => {
        setFlaggedQuestions(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) next.delete(questionId);
            else next.add(questionId);
            return next;
        });
    };

    const handleSubmit = async () => {
        if (submitting || !paperId) return;

        // Final capture for current question
        const now = Date.now();
        const currentQId = questions[currentIndex].id;
        const finalSpent = Math.floor((now - lastQuestionStartTime.current) / 1000);
        const finalTimes = {
            ...timePerQuestion,
            [currentQId]: (timePerQuestion[currentQId] || 0) + finalSpent
        };

        setSubmitting(true);
        try {
            const { success, attemptId } = await submitQuizAction(
                paperId,
                elapsedSeconds,
                selectedAnswers,
                finalTimes
            );

            if (success) {
                router.push(`/results/${attemptId}`);
            }
        } catch (err: any) {
            console.error("Submit error:", err);
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

    const answeredCount = Object.keys(selectedAnswers).length;
    const currentQuestion = questions[currentIndex];

    return (
        <div className={`relative min-h-screen flex flex-col ${zenMode ? "bg-[#09090b] text-white" : "bg-gray-50/50"} transition-colors duration-500`}>

            {/* Professional EdTech Header */}
            <header className={`sticky top-0 z-40 w-full border-b transition-all duration-500 ${zenMode ? "bg-black/50 backdrop-blur-xl border-white/10" : "bg-white border-gray-100 shadow-sm"
                }`}>
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-2 rounded-lg transition-colors ${zenMode ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-600"}`}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                        <div className="max-w-[120px] sm:max-w-none truncate">
                            <h1 className={`font-black tracking-tight text-[10px] sm:text-sm uppercase truncate ${zenMode ? "text-white" : "text-gray-900"}`}>
                                {paper.title}
                            </h1>
                            <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${zenMode ? "text-white/40" : "text-gray-400"}`}>
                                {answeredCount}/{questions.length} <span className="hidden sm:inline">Progress</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-8">
                        <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all ${zenMode ? "bg-white/5 border border-white/10 text-primary-400" : "bg-primary-50 text-primary-700 font-bold"
                            }`}>
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="font-mono text-xs sm:text-sm tracking-tight">{formatTime(elapsedSeconds)}</span>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2">
                            <button
                                onClick={() => setZenMode(!zenMode)}
                                className={`p-2 rounded-lg transition-all ${zenMode ? "bg-white/10 text-white" : "bg-gray-100 text-gray-400 hover:text-primary-600"}`}
                                title="Toggle Focus Mode"
                            >
                                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button
                                onClick={() => router.push("/papers")}
                                className={`p-2 rounded-lg transition-all ${zenMode ? "bg-red-500/20 text-red-400" : "bg-gray-100 text-gray-400 hover:text-red-600"}`}
                                title="Exit Session"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Slim Progress Bar */}
                <div className="w-full h-1 bg-gray-100 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
                        className="h-full bg-primary-600"
                    />
                </div>
            </header>

            <div className="flex-1 flex max-w-[1600px] mx-auto w-full relative h-full">

                {/* Mobile Palette Overlay/Drawer */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSidebarOpen(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
                            />
                            <motion.aside
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className={`fixed top-0 left-0 h-full w-[280px] sm:w-[320px] z-[60] flex flex-col transition-colors duration-500 lg:hidden ${zenMode ? "bg-[#09090b] text-white" : "bg-white"
                                    }`}
                            >
                                <div className="p-6 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                            <Grid3X3 className="w-4 h-4" />
                                            Question Palette
                                        </h3>
                                        <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                            <X className="w-5 h-5 text-gray-400" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[60vh] pb-6 pr-2">
                                        {questions.map((q, idx) => {
                                            const isAnswered = !!selectedAnswers[q.id];
                                            const isCurrent = idx === currentIndex;
                                            const isFlagged = flaggedQuestions.has(q.id);
                                            return (
                                                <button
                                                    key={q.id}
                                                    onClick={() => {
                                                        setCurrentIndex(idx);
                                                        setSidebarOpen(false);
                                                    }}
                                                    className={`relative w-full aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all border-2 ${isCurrent
                                                        ? "border-primary-600 bg-primary-600 text-white"
                                                        : isFlagged
                                                            ? "border-amber-400 bg-amber-50 text-amber-700"
                                                            : isAnswered
                                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                                : zenMode ? "border-white/10 bg-white/5 text-white/40" : "border-gray-50 bg-gray-50 text-gray-400"
                                                        }`}
                                                >
                                                    {idx + 1}
                                                    {isFlagged && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Palette Legend */}
                                    <div className="mt-auto pt-6 space-y-3 border-t border-gray-100">
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <div className="w-3 h-3 rounded bg-emerald-500" /> Answered
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <div className="w-3 h-3 rounded bg-amber-500" /> Flagged
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            <div className="w-3 h-3 rounded bg-primary-600" /> Active
                                        </div>
                                    </div>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Desktop Question Palette Sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className={`hidden lg:flex flex-col border-r h-[calc(100vh-68px)] sticky top-[68px] overflow-hidden transition-colors duration-500 ${zenMode ? "bg-black/20 border-white/10 text-white" : "bg-white border-gray-100 shadow-[20px_0_30px_-20px_rgba(0,0,0,0.05)]"
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Grid3X3 className="w-4 h-4" />
                                        Question Palette
                                    </h3>
                                    <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-0.5 rounded-md">
                                        {answeredCount}/{questions.length}
                                    </span>
                                </div>

                                <div className="grid grid-cols-5 gap-2">
                                    {questions.map((q, idx) => {
                                        const isAnswered = !!selectedAnswers[q.id];
                                        const isCurrent = idx === currentIndex;
                                        const isFlagged = flaggedQuestions.has(q.id);

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={`relative w-full aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all border-2 ${isCurrent
                                                    ? "border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                                    : isFlagged
                                                        ? "border-amber-400 bg-amber-50 text-amber-700"
                                                        : isAnswered
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                            : zenMode
                                                                ? "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                                                                : "border-gray-50 bg-gray-50 text-gray-400 hover:border-primary-200 hover:text-primary-600"
                                                    }`}
                                            >
                                                {idx + 1}
                                                {isFlagged && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Palette Legend */}
                            <div className="mt-auto p-6 space-y-3 bg-gray-50/50 border-t border-gray-100">
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="w-3 h-3 rounded bg-emerald-500" /> Answered
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="w-3 h-3 rounded bg-amber-500" /> Flagged
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="w-3 h-3 rounded bg-primary-600" /> Active
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 overflow-y-auto w-full">
                    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">

                        {/* Question Card */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`flex-1 flex flex-col transition-all duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden ${zenMode ? "bg-white/5 border border-white/5" : "bg-white border border-gray-100 shadow-xl shadow-gray-200/5 mb-8"
                                    }`}
                            >
                                {/* Card Header */}
                                <div className={`px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b ${zenMode ? "border-white/5" : "bg-gray-50/50 border-gray-100"}`}>
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <span className={`px-2 sm:px-3 py-1 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${currentQuestion.subject === "Biology" ? "bg-emerald-500/10 text-emerald-500" :
                                            currentQuestion.subject === "Chemistry" ? "bg-purple-500/10 text-purple-500" :
                                                currentQuestion.subject === "Physics" ? "bg-blue-500/10 text-blue-500" :
                                                    "bg-amber-500/10 text-amber-500"
                                            }`}>
                                            {currentQuestion.subject}
                                        </span>
                                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] ${zenMode ? "text-white/20" : "text-gray-300"}`}>
                                            Q{currentIndex + 1}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => toggleFlag(currentQuestion.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${flaggedQuestions.has(currentQuestion.id)
                                            ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                                            : zenMode ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                                            }`}
                                    >
                                        <Bookmark className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${flaggedQuestions.has(currentQuestion.id) ? "fill-current" : ""}`} />
                                        <span className="hidden sm:inline">{flaggedQuestions.has(currentQuestion.id) ? "Flagged" : "Flag for Review"}</span>
                                        <span className="sm:hidden">{flaggedQuestions.has(currentQuestion.id) ? "Flagged" : "Flag"}</span>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 sm:p-12 flex-1">
                                    <h2 className={`text-lg sm:text-3xl font-bold leading-tight mb-8 sm:mb-12 tracking-tight ${zenMode ? "text-white" : "text-gray-900"}`}>
                                        {currentQuestion.question_text}
                                    </h2>

                                    {currentQuestion.image_url && (
                                        <div className="mb-8 sm:mb-12 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 bg-black/5 p-4 max-w-2xl mx-auto">
                                            <img src={currentQuestion.image_url} alt="Question Diagram" className="w-full object-contain max-h-[250px] sm:max-h-[400px]" />
                                        </div>
                                    )}

                                    <div className="grid gap-3 sm:gap-4">
                                        {currentQuestion.options.map((option, optIdx) => {
                                            const isSelected = selectedAnswers[currentQuestion.id] === option.id;
                                            const label = String.fromCharCode(65 + optIdx);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => selectOption(currentQuestion.id, option.id)}
                                                    className={`group relative flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 transition-all text-left ${isSelected
                                                        ? "bg-primary-600 border-primary-600 shadow-xl shadow-primary-600/20"
                                                        : zenMode ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-gray-100 hover:bg-gray-50 hover:border-primary-200"
                                                        }`}
                                                >
                                                    <span className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${isSelected ? "bg-white text-primary-600" : "bg-gray-100 text-gray-400 group-hover:text-primary-600"
                                                        }`}>
                                                        {label}
                                                    </span>
                                                    <span className={`flex-1 font-bold text-sm sm:text-lg ${isSelected ? "text-white" : zenMode ? "text-white/70" : "text-gray-700"}`}>
                                                        {option.option_text}
                                                    </span>
                                                    {isSelected && <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Integrated Bottom Action Bar */}
                                <div className={`px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between border-t gap-4 ${zenMode ? "border-white/5" : "bg-gray-50/30 border-gray-100"}`}>
                                    <button
                                        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                                        disabled={currentIndex === 0}
                                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${zenMode ? "hover:bg-white/10 text-white disabled:opacity-20" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-900 disabled:opacity-30 shadow-sm"
                                            }`}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="hidden sm:inline">Previous</span>
                                    </button>

                                    {currentIndex === questions.length - 1 ? (
                                        <button
                                            onClick={() => setShowConfirm(true)}
                                            className="flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-emerald-600 text-white rounded-xl sm:rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all"
                                        >
                                            <span className="hidden sm:inline">Finish & Submit</span>
                                            <span className="sm:hidden">Finish</span>
                                            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                                            className="flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-gray-900 text-white rounded-xl sm:rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all"
                                        >
                                            <span className="hidden sm:inline">Next Question</span>
                                            <span className="sm:hidden">Next</span>
                                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </main>
            </div>

            {/* Submitting Overlay */}
            <AnimatePresence>
                {submitting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center text-white p-6 text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Zap className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter italic">Compiling Results...</h3>
                        <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px]">Applying AI pedagogical analysis</p>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            initial={{ scale: 0.9, y: 100 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 100 }}
                            className="bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 max-w-md w-full shadow-2xl text-gray-900"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-50 text-primary-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <Send className="w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black text-center mb-4 tracking-tighter">Submit Test?</h3>

                            <div className="space-y-3 sm:space-y-4 mb-8">
                                <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400">Answered</span>
                                    <span className="font-black text-emerald-600 italic">{answeredCount} / {questions.length}</span>
                                </div>
                                <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between">
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-500">Flagged</span>
                                    <span className="font-black text-amber-600 italic">{flaggedQuestions.size}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-6 py-4 bg-gray-100 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-200 transition-all"
                                >
                                    Continue
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="px-6 py-4 bg-primary-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary-600/20 hover:bg-primary-700 transition-all"
                                >
                                    Submit Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
