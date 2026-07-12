"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Compass } from "lucide-react";

interface ScoreImprovementCalculatorProps {
  onUnlock?: () => void;
}

export default function ScoreImprovementCalculator({ onUnlock }: ScoreImprovementCalculatorProps) {
  const [currentScore, setCurrentScore] = useState<number>(145);

  // Compute potential score (assumes students improve about 55% of their remaining gap, capped at 196)
  const remainingGap = 200 - currentScore;
  const improvement = Math.max(5, Math.round(remainingGap * 0.55));
  const potentialScore = Math.min(196, currentScore + improvement);

  // Distribute score increases among MDCAT subjects
  const bioInc = Math.round(improvement * 0.4);
  const chemInc = Math.round(improvement * 0.35);
  const physInc = Math.round(improvement * 0.2);
  const engInc = improvement - (bioInc + chemInc + physInc);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-white/10 p-8 sm:p-10 text-white shadow-2xl">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="relative space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight italic">Score Improvement Calculator</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Estimate your score potential</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-400">Your Current Mock Score:</span>
            <span className="text-4xl font-black italic text-white tracking-tighter">{currentScore}</span>
          </div>
          
          <input
            type="range"
            min="60"
            max="185"
            value={currentScore}
            onChange={(e) => setCurrentScore(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">
            <span>60 (Needs Work)</span>
            <span>140 (Average)</span>
            <span>185 (Excellent)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potential Score</p>
            <p className="text-5xl font-black italic tracking-tighter text-emerald-400">
              {potentialScore} <span className="text-xs font-bold not-italic text-slate-400">/ 200</span>
            </p>
            <p className="text-xs font-bold text-emerald-300/80">Estimated potential score improvement</p>
          </div>

          <div className="flex flex-col justify-center space-y-3 border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Biology Improvement:</span>
              <span className="text-emerald-400 font-extrabold">+{bioInc}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Chemistry Improvement:</span>
              <span className="text-emerald-400 font-extrabold">+{chemInc}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">Physics Improvement:</span>
              <span className="text-emerald-400 font-extrabold">+{physInc}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">English / Logical Reasoning:</span>
              <span className="text-emerald-400 font-extrabold">+{engInc}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onUnlock}
          className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
        >
          <Compass className="w-4 h-4 transition-transform group-hover:rotate-45" />
          Unlock Personalized Roadmap
        </button>
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Premium required to lock in roadmap</p>
      </div>
    </div>
  );
}
