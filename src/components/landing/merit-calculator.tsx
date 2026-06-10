"use client";

import { useState } from "react";
import { Calculator, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface College {
  name: string;
  shortName: string;
  city: string;
  cutoff: number;
}

const COLLEGES: College[] = [
  { name: "King Edward Medical University", shortName: "KEMU", city: "Lahore", cutoff: 93.55 },
  { name: "Allama Iqbal Medical College", shortName: "AIMC", city: "Lahore", cutoff: 92.65 },
  { name: "Dow Medical College (DUHS)", shortName: "DMC", city: "Karachi", cutoff: 91.85 },
  { name: "Nishtar Medical College", shortName: "NMC", city: "Multan", cutoff: 91.40 },
  { name: "Khyber Medical College", shortName: "KMC", city: "Peshawar", cutoff: 90.80 },
  { name: "Rawalpindi Medical University", shortName: "RMU", city: "Rawalpindi", cutoff: 91.15 },
];

export default function MeritCalculator() {
  const [matric, setMatric] = useState<number>(1020);
  const [fsc, setFsc] = useState<number>(1010);
  const [mdcat, setMdcat] = useState<number>(175);

  const matricTotal = 1100;
  const fscTotal = 1100;
  const mdcatTotal = 200;

  // Calculate percentages
  const matricPct = (matric / matricTotal) * 100;
  const fscPct = (fsc / fscTotal) * 100;
  const mdcatPct = (mdcat / mdcatTotal) * 100;

  // PMDC weightage: 10% Matric, 40% FSc, 50% MDCAT
  const aggregate = (matricPct * 0.1) + (fscPct * 0.4) + (mdcatPct * 0.5);

  // Find college status
  const getStatus = (cutoff: number) => {
    const diff = aggregate - cutoff;
    if (diff >= 0) return { label: "Safe Merit", color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30", icon: CheckCircle2 };
    if (diff >= -1.5) return { label: "Borderline", color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30", icon: AlertTriangle };
    return { label: "Target High", color: "bg-gray-50 dark:bg-slate-950/40 text-gray-500 dark:text-gray-400 border-surface-border dark:border-slate-800", icon: HelpCircle };
  };

  // Find MDCAT score needed for KEMU based on current Matric/FSc
  const getRequiredMDCATForKEMU = () => {
    const targetKEMU = 93.55;
    const currentAcademic = (matricPct * 0.1) + (fscPct * 0.4);
    const neededMDCATPct = (targetKEMU - currentAcademic) / 0.5;
    const neededMDCATScore = Math.ceil((neededMDCATPct / 100) * 200);
    return Math.min(Math.max(neededMDCATScore, 0), 200);
  };

  const requiredMDCAT = getRequiredMDCATForKEMU();

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-surface-border dark:border-slate-800 shadow-xl overflow-hidden p-8 flex flex-col md:flex-row gap-10">
      
      {/* Interactive Controls */}
      <div className="w-full md:w-1/2 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 dark:bg-primary-950/40 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-100/20 shadow-inner shrink-0">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Aggregate Calculator</h4>
            <p className="text-gray-400 dark:text-gray-500 font-bold text-[9px] uppercase tracking-widest mt-0.5">PMDC Official Weightage Formula</p>
          </div>
        </div>

        {/* Matric Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <span>Matric Marks (10%)</span>
            <span className="text-primary-600 dark:text-primary-400">{matric} / {matricTotal} ({Math.round(matricPct)}%)</span>
          </div>
          <input
            type="range"
            min="700"
            max={matricTotal}
            value={matric}
            onChange={(e) => setMatric(Number(e.target.value))}
            className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-primary-400"
          />
        </div>

        {/* FSc Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <span>FSc Marks (40%)</span>
            <span className="text-primary-600 dark:text-primary-400">{fsc} / {fscTotal} ({Math.round(fscPct)}%)</span>
          </div>
          <input
            type="range"
            min="650"
            max={fscTotal}
            value={fsc}
            onChange={(e) => setFsc(Number(e.target.value))}
            className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-primary-400"
          />
        </div>

        {/* MDCAT Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            <span>Estimated MDCAT (50%)</span>
            <span className="text-primary-600 dark:text-primary-400">{mdcat} / {mdcatTotal} ({Math.round(mdcatPct)}%)</span>
          </div>
          <input
            type="range"
            min="100"
            max={mdcatTotal}
            value={mdcat}
            onChange={(e) => setMdcat(Number(e.target.value))}
            className="w-full h-2 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-600 dark:accent-primary-400"
          />
        </div>

        {/* Result Callout */}
        <div className="bg-gray-50 dark:bg-slate-950/40 border border-surface-border dark:border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest">Your Aggregate</span>
            <span className="text-3xl font-black text-primary-600 dark:text-primary-400">{aggregate.toFixed(4)}%</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            With your current Matric and FSc credentials, you need an MDCAT score of <span className="font-bold text-gray-900 dark:text-white">{requiredMDCAT} / 200</span> to qualify for KEMU (Lahore).
          </p>
        </div>
      </div>

      {/* College Matcher */}
      <div className="w-full md:w-1/2 flex flex-col justify-between self-stretch">
        <div className="space-y-4">
          <h5 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Admission Probabilities</h5>
          
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {COLLEGES.map((c) => {
              const status = getStatus(c.cutoff);
              const Icon = status.icon;
              return (
                <div key={c.shortName} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-surface-border dark:border-slate-800 rounded-xl hover:border-gray-200 dark:hover:border-slate-700 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-none flex items-center gap-1.5">
                      {c.shortName}
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-tight">({c.city})</span>
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1 leading-none">Last year merit: {c.cutoff.toFixed(2)}%</p>
                  </div>
                  
                  <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0 ${status.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion CTA */}
        <div className="mt-6">
          <Link
            href={`/signup?aggregate=${aggregate.toFixed(2)}&source=merit_calc`}
            className="w-full inline-flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-600/20 text-xs uppercase tracking-widest active:scale-95"
          >
            Create Free Onboarding Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}
