"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, RefreshCw, Check, ArrowRight, HelpCircle } from "lucide-react";

interface Flashcard {
  id: string;
  subject: "Biology" | "Chemistry" | "Physics";
  question: string;
  answer: string;
}

const DEFAULT_CARDS: Flashcard[] = [
  {
    id: "bio_1",
    subject: "Biology",
    question: "What is the primary function of lysosomes?",
    answer: "Intracellular digestion and autolysis (self-destruction of damaged cells) via hydrolytic enzymes.",
  },
  {
    id: "bio_2",
    subject: "Biology",
    question: "What structural polymer makes up the bacterial cell wall?",
    answer: "Peptidoglycan (murein), composed of glycan chains cross-linked by short peptides.",
  },
  {
    id: "chem_1",
    subject: "Chemistry",
    question: "What is the hybridization state of Carbon in Benzene?",
    answer: "sp2 hybridization. Each carbon forms three sigma bonds in a planar hexagon, with one unhybridized p-orbital contributing to the delocalized pi electron cloud.",
  },
  {
    id: "chem_2",
    subject: "Chemistry",
    question: "Which organic functional group is identified by the Tollen's test?",
    answer: "Aldehydes. They reduce silver ammonia complex to form a metallic silver mirror on the tube surface.",
  },
  {
    id: "phys_1",
    subject: "Physics",
    question: "What is Coulomb's Law formula for electrostatic force?",
    answer: "F = k * (q1 * q2) / r^2, where k is Coulomb's constant (8.99 x 10^9 N·m²/C²).",
  },
  {
    id: "phys_2",
    subject: "Physics",
    question: "Explain the Heisenberg Uncertainty Principle formula.",
    answer: "Δx * Δp ≥ h / 4π. It states that the position and momentum of a subatomic particle cannot be measured simultaneously with absolute precision.",
  },
];

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>(DEFAULT_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [leitnerBoxes, setLeitnerBoxes] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load box states from localStorage
    const saved = localStorage.getItem("mdcat_leitner_boxes");
    if (saved) {
      try {
        setLeitnerBoxes(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading flashcard state", e);
      }
    }
  }, []);

  const currentCard = cards[currentIndex];

  const handleLeitnerFeedback = (cardId: string, gotIt: boolean) => {
    const currentBox = leitnerBoxes[cardId] || 1;
    let nextBox = currentBox;

    if (gotIt) {
      // Advance to next box (max Box 3)
      nextBox = Math.min(3, currentBox + 1);
    } else {
      // Reset back to Box 1 for review
      nextBox = 1;
    }

    const updatedBoxes = {
      ...leitnerBoxes,
      [cardId]: nextBox,
    };

    setLeitnerBoxes(updatedBoxes);
    localStorage.setItem("mdcat_leitner_boxes", JSON.stringify(updatedBoxes));

    // Reset card flip and move to next card
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  if (!currentCard) return null;

  const currentCardBox = leitnerBoxes[currentCard.id] || 1;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/30 rounded-full text-[9px] font-black text-primary-700 dark:text-primary-300 uppercase tracking-widest">
          Active Recall Mode
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          High-Yield <span className="text-gradient-primary">Spaced Cards</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
          Leitner Spaced Repetition System Active
        </p>
      </div>

      {/* Leitner Box Status Indicator */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[1, 2, 3].map((boxNum) => {
          const count = cards.filter((c) => (leitnerBoxes[c.id] || 1) === boxNum).length;
          return (
            <div
              key={boxNum}
              className={`p-3 rounded-2xl border ${
                boxNum === 1
                  ? "bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400"
                  : boxNum === 2
                  ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
                  : "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              }`}
            >
              <h4 className="text-[10px] font-black uppercase tracking-wider">Box {boxNum}</h4>
              <p className="text-sm font-black">{count} Card{count !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>

      {/* Active Card Deck Container */}
      <div className="flex justify-center py-6">
        <div className="relative w-full max-w-lg aspect-[4/3] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          
          {/* Card Flips */}
          <motion.div
            className="w-full h-full relative"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front Side */}
            <div
              className="absolute inset-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                  currentCard.subject === "Biology" ? "bg-emerald-500/10 text-emerald-500" :
                  currentCard.subject === "Chemistry" ? "bg-purple-500/10 text-purple-500" :
                  "bg-blue-500/10 text-blue-500"
                }`}>
                  {currentCard.subject}
                </span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">
                  Box {currentCardBox}
                </span>
              </div>

              <div className="text-center py-6">
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                  {currentCard.question}
                </p>
              </div>

              <p className="text-center text-[9px] font-black text-gray-300 dark:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                Tap card to flip and reveal answer
              </p>
            </div>

            {/* Back Side */}
            <div
              className="absolute inset-0 bg-gray-900 dark:bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-between text-white"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/80">
                  Explanation
                </span>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-wider">
                  Box {currentCardBox}
                </span>
              </div>

              <div className="text-center py-6">
                <p className="text-base sm:text-lg font-medium text-gray-100 leading-relaxed">
                  {currentCard.answer}
                </p>
              </div>

              <p className="text-center text-[9px] font-black text-white/30 uppercase tracking-widest">
                Tap card to view question again
              </p>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Spaced Recall Controls */}
      <AnimatePresence mode="wait">
        {isFlipped && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="flex items-center justify-center gap-4"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLeitnerFeedback(currentCard.id, false);
              }}
              className="px-6 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Review Again
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLeitnerFeedback(currentCard.id, true);
              }}
              className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-600/25"
            >
              <Check className="w-4 h-4" />
              Got It!
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav Helper */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-100 dark:border-slate-800">
        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
          Card {currentIndex + 1} of {cards.length}
        </span>
        <button
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex((prev) => (prev + 1) % cards.length);
          }}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700"
        >
          Skip Card
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
