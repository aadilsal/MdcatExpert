"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, HelpCircle, Clock, Award, AlertCircle } from "lucide-react";
import Link from "next/link";

export interface SampleQuestion {
  _id?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  subject: string;
  explanation: string;
}

const FALLBACK_QUESTIONS: SampleQuestion[] = [
  {
    questionText: "Which cellular organelle is responsible for the synthesis of lipids and detoxification of drugs?",
    optionA: "Rough Endoplasmic Reticulum",
    optionB: "Smooth Endoplasmic Reticulum",
    optionC: "Golgi Apparatus",
    optionD: "Lysosome",
    correctOption: "B",
    subject: "Biology",
    explanation: "The Smooth Endoplasmic Reticulum (SER) is primarily responsible for lipid synthesis (steroids, phospholipids) and detoxification of metabolic waste and drugs. Rough Endoplasmic Reticulum (RER) is coated in ribosomes and synthesizes proteins.",
  },
  {
    questionText: "What is the hybridization state of carbon atoms in a benzene ring?",
    optionA: "sp3",
    optionB: "sp2",
    optionC: "sp",
    optionD: "dsp2",
    correctOption: "B",
    subject: "Chemistry",
    explanation: "Each carbon atom in benzene is bonded to three other atoms (two carbons and one hydrogen) via sigma bonds. This planar arrangement utilizes sp2 hybrid orbitals, leaving one unhybridized p-orbital per carbon to form the delocalized pi system.",
  },
  {
    questionText: "If the velocity of a moving object is doubled, by what factor does its kinetic energy increase?",
    optionA: "2",
    optionB: "4",
    optionC: "8",
    optionD: "Remaining same",
    correctOption: "B",
    subject: "Physics",
    explanation: "Kinetic Energy is calculated as KE = ½mv². Since kinetic energy is proportional to the square of velocity (v²), doubling the velocity increases the kinetic energy by a factor of 2² = 4.",
  },
];

export default function MiniQuiz({ dbQuestions = [] }: { dbQuestions?: SampleQuestion[] }) {
  // Merge and pad with fallbacks if DB returns less than 3
  const questionsList = [...dbQuestions];
  while (questionsList.length < 3) {
    const nextFallback = FALLBACK_QUESTIONS[questionsList.length];
    if (nextFallback) {
      questionsList.push(nextFallback);
    } else {
      break;
    }
  }

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | "timeout" | null>(null);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<"intro" | "playing" | "results">("intro");
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  const currentQuestion = questionsList[currentIdx] || FALLBACK_QUESTIONS[0];

  const handleSelectAnswer = useCallback((option: "A" | "B" | "C" | "D" | "timeout") => {
    if (selectedOption !== null) return; // already answered
    setSelectedOption(option);
    setTimerActive(false);
    if (option === currentQuestion.correctOption) {
      setScore((prev) => prev + 1);
    }
  }, [selectedOption, currentQuestion.correctOption]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0 && selectedOption === null) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && selectedOption === null) {
      // Auto-fail this question on timeout
      setTimeout(() => {
        handleSelectAnswer("timeout");
      }, 0);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, timerActive, selectedOption, handleSelectAnswer]);

  const startQuiz = () => {
    setQuizState("playing");
    setCurrentIdx(0);
    setScore(0);
    setSelectedOption(null);
    setTimeLeft(30);
    setTimerActive(true);
  };

  const handleNext = () => {
    if (currentIdx < 2) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setTimeLeft(30);
      setTimerActive(true);
    } else {
      setQuizState("results");
    }
  };

  const getOptionStatus = (option: "A" | "B" | "C" | "D") => {
    if (selectedOption === null) return "idle";
    if (option === currentQuestion.correctOption) return "correct";
    if (option === selectedOption) return "wrong";
    return "muted";
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-surface-border dark:border-slate-800 shadow-xl overflow-hidden min-h-[440px] flex flex-col justify-between p-8 relative">
      {/* Background Subtle Highlights */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 dark:bg-primary-950/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 dark:bg-slate-950/10 rounded-full blur-3xl -z-10" />

      <AnimatePresence mode="wait">
        {quizState === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center text-center justify-center py-8 flex-1"
          >
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-primary-100/30">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
              Test Your Speed & Accuracy
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mb-8 leading-relaxed text-sm">
              Try a mini 3-question challenge sourced directly from actual MDCAT past papers. See immediate explanations and test-taking telemetry.
            </p>
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-3 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-600/25 dark:shadow-primary-600/10 active:scale-95 text-sm uppercase tracking-wider cursor-pointer"
            >
              Start Challenge
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-400 font-bold tracking-tight mt-4 uppercase">
              No sign-up required • 30s limit per question
            </p>
          </motion.div>
        )}

        {quizState === "playing" && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col flex-1"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-surface-border dark:border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-primary-100/20">
                  {currentQuestion.subject}
                </span>
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                  Question {currentIdx + 1} of 3
                </span>
              </div>
              
              {/* Timed display */}
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-lg border border-surface-border dark:border-slate-800">
                <Clock className={`w-4 h-4 ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-400"}`} />
                <span className={`text-xs font-black tracking-tight ${timeLeft <= 10 ? "text-red-500 font-extrabold" : "text-gray-700 dark:text-gray-300"}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Question body */}
            <div className="flex-1 space-y-6">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                {currentQuestion.questionText}
              </h4>

              {/* Options */}
              <div className="grid grid-cols-1 gap-3">
                {(["A", "B", "C", "D"] as const).map((opt) => {
                  const status = getOptionStatus(opt);
                  const optText = currentQuestion[`option${opt}` as keyof SampleQuestion] as string;
                  
                  let optStyle = "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-700";
                  if (status === "correct") {
                    optStyle = "border-success bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold shadow-xs";
                  } else if (status === "wrong") {
                    optStyle = "border-error bg-red-50/50 dark:bg-red-950/20 text-red-800 dark:text-red-400 font-bold shadow-xs";
                  } else if (status === "muted") {
                    optStyle = "border-surface-border dark:border-slate-900/60 bg-gray-50/40 dark:bg-slate-900/40 text-gray-400 dark:text-gray-600 opacity-60";
                  }

                  return (
                    <button
                      key={opt}
                      disabled={selectedOption !== null}
                      onClick={() => handleSelectAnswer(opt)}
                      className={`w-full flex items-start gap-4 p-4 border-2 rounded-2xl text-left transition-all duration-200 ${optStyle} ${selectedOption === null ? "hover:scale-[1.01] active:scale-95 cursor-pointer" : "cursor-default"}`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${status === "correct" ? "bg-success text-white" : status === "wrong" ? "bg-error text-white" : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"}`}>
                        {opt}
                      </span>
                      <span className="text-sm font-medium leading-relaxed">{optText}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time's up indicator */}
              {selectedOption === null && timeLeft === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-medium border border-amber-200/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Time is up! Select an option to see the correct answer.
                </div>
              )}

              {/* Explanatory notes */}
              <AnimatePresence>
                {selectedOption !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-gray-50 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl mt-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      {selectedOption === currentQuestion.correctOption ? (
                        <span className="flex items-center gap-1 text-xs font-black uppercase text-success">
                          <CheckCircle2 className="w-4 h-4" /> Correct Answer
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-black uppercase text-error">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-300 leading-relaxed font-medium">
                      {currentQuestion.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom transition button */}
            {selectedOption !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex justify-end"
              >
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-gray-800 dark:hover:bg-white transition-all active:scale-95 cursor-pointer"
                >
                  {currentIdx < 2 ? "Next Question" : "See Results"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {quizState === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center text-center justify-center py-6 flex-1"
          >
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce border border-amber-200/10">
              <Award className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
              Challenge Completed!
            </h3>
            <p className="text-gray-400 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mb-6">
              Final Score: {score} / 3
            </p>

            {/* Micro AI feedback breakdown */}
            <div className="w-full bg-linear-to-br from-primary-50/50 dark:from-primary-950/10 to-blue-50/20 dark:to-slate-950/10 border border-primary-100/40 dark:border-primary-900/20 p-6 rounded-2xl text-left space-y-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-600 dark:bg-primary-500 animate-ping" />
                <span className="text-xs font-black uppercase text-primary-700 dark:text-primary-300 tracking-wider">
                  Simulated AI weakness Report
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-gray-500 dark:text-gray-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Accuracy: {Math.round((score / 3) * 100)}% • Average pace: 12.4s per question.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-500 font-bold">•</span>
                  <span>Strength: Organelle functions and organic structures are solid.</span>
                </li>
                <li className="flex items-start gap-2 text-amber-800 dark:text-amber-400 font-semibold bg-amber-50/50 dark:bg-amber-950/10 p-2 rounded-lg border border-amber-100/30 dark:border-amber-900/20">
                  <span className="text-amber-500 font-bold">⚠️</span>
                  <span>Weakness Detected: Kinetic Energy derivation. Practicing 15 additional questions on Physics Work/Energy can yield +6% test accuracy.</span>
                </li>
              </ul>
            </div>

            <Link
              href={`/signup?score=${score}&source=mini_quiz`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-primary-600/30 dark:shadow-primary-600/10 active:scale-95 text-sm uppercase tracking-wider"
            >
              Claim Your Free Full Report
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <button
              onClick={startQuiz}
              className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
