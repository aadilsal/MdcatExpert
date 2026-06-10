"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Compass, ShieldAlert } from "lucide-react";

type PresetName = "diagnosed" | "standard" | "elite";

interface SubjectStats {
  Biology: number;
  Chemistry: number;
  Physics: number;
  English: number;
}

const PRESETS: Record<PresetName, { label: string; stats: SubjectStats; desc: string; colorClass: string; darkColorClass: string; icon: React.ComponentType<{ className?: string }> }> = {
  diagnosed: {
    label: "Initial Diagnosis",
    stats: { Biology: 45, Chemistry: 55, Physics: 30, English: 60 },
    desc: "Uncovered weaknesses in Physics mechanics and Organic Chemistry reactions after the first diagnostic past paper.",
    colorClass: "bg-red-50 text-red-700 border-red-100",
    darkColorClass: "dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    icon: ShieldAlert,
  },
  standard: {
    label: "Standard Prep",
    stats: { Biology: 72, Chemistry: 68, Physics: 60, English: 75 },
    desc: "Steady improvement through standard books. Struggling to break past the average 70% threshold due to repetitive mistakes.",
    colorClass: "bg-amber-50 text-amber-700 border-amber-100",
    darkColorClass: "dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    icon: Compass,
  },
  elite: {
    label: "Elite AI Achieved",
    stats: { Biology: 96, Chemistry: 94, Physics: 92, English: 95 },
    desc: "95%+ accuracy. Weaknesses fully corrected by the AI Mistake Analyzer. Ready for top-tier medical colleges (KEMU/Dow).",
    colorClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
    darkColorClass: "dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    icon: Sparkles,
  },
};

export default function InteractiveRadar() {
  const [activePreset, setActivePreset] = useState<PresetName>("diagnosed");
  const stats = PRESETS[activePreset].stats;

  // SVG dimensions
  const size = 320;
  const center = size / 2;
  const maxRadius = 100; // max score of 100%

  // Calculate coordinates for a subject node
  const getCoordinates = (subject: keyof SubjectStats, percent: number) => {
    const radius = (percent / 100) * maxRadius;
    switch (subject) {
      case "Biology": // Up (90 deg / -pi/2 rad)
        return { x: center, y: center - radius };
      case "Chemistry": // Right (0 deg / 0 rad)
        return { x: center + radius, y: center };
      case "Physics": // Down (270 deg / pi/2 rad)
        return { x: center, y: center + radius };
      case "English": // Left (180 deg / pi rad)
        return { x: center - radius, y: center };
    }
  };

  // Generate SVG path description for the filled polygon
  const getPathDescription = (currentStats: SubjectStats) => {
    const bio = getCoordinates("Biology", currentStats.Biology);
    const chem = getCoordinates("Chemistry", currentStats.Chemistry);
    const phys = getCoordinates("Physics", currentStats.Physics);
    const eng = getCoordinates("English", currentStats.English);
    return `M ${bio.x} ${bio.y} L ${chem.x} ${chem.y} L ${phys.x} ${phys.y} L ${eng.x} ${eng.y} Z`;
  };

  const currentPath = getPathDescription(stats);

  // Background grids (50%, 75%, 100%)
  const gridRadii = [40, 70, 100];

  return (
    <div className="flex flex-col gap-8 bg-white dark:bg-slate-900 rounded-3xl border border-surface-border dark:border-slate-800 shadow-xl p-8 max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center gap-10">
      {/* SVG Chart Container */}
      <div className="w-full lg:w-1/2 flex justify-center relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible select-none">
          {/* Circular Grids */}
          {gridRadii.map((r, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth="1.5"
              strokeDasharray={i === 2 ? "none" : "4 4"}
              className="stroke-slate-100 dark:stroke-slate-800"
            />
          ))}

          {/* Grid Axes */}
          <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} strokeWidth="1.5" className="stroke-slate-100 dark:stroke-slate-800" />
          <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} strokeWidth="1.5" className="stroke-slate-100 dark:stroke-slate-800" />

          {/* Label Guidelines */}
          <text x={center} y={center - maxRadius - 12} textAnchor="middle" className="text-xs font-black fill-gray-900 dark:fill-gray-100 tracking-wider">BIOLOGY</text>
          <text x={center + maxRadius + 14} y={center + 4} textAnchor="start" className="text-xs font-black fill-gray-900 dark:fill-gray-100 tracking-wider">CHEMISTRY</text>
          <text x={center} y={center + maxRadius + 20} textAnchor="middle" className="text-xs font-black fill-gray-900 dark:fill-gray-100 tracking-wider">PHYSICS</text>
          <text x={center - maxRadius - 14} y={center + 4} textAnchor="end" className="text-xs font-black fill-gray-900 dark:fill-gray-100 tracking-wider">ENGLISH</text>

          {/* Value markers on grids */}
          <text x={center + 6} y={center - 100 + 4} className="text-[8px] font-bold fill-gray-300 dark:fill-gray-600">100%</text>
          <text x={center + 6} y={center - 70 + 4} className="text-[8px] font-bold fill-gray-300 dark:fill-gray-600">70%</text>
          <text x={center + 6} y={center - 40 + 4} className="text-[8px] font-bold fill-gray-300 dark:fill-gray-600">40%</text>

          {/* Morphing Area Path */}
          <motion.path
            d={currentPath}
            fill={activePreset === "elite" ? "rgba(16, 185, 129, 0.12)" : activePreset === "standard" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.08)"}
            stroke={activePreset === "elite" ? "#10B981" : activePreset === "standard" ? "#F59E0B" : "#EF4444"}
            strokeWidth="3.5"
            strokeLinejoin="round"
            animate={{ d: currentPath }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
          />

          {/* Interactive dots representing the subject scores */}
          {(Object.keys(stats) as Array<keyof SubjectStats>).map((subj) => {
            const coords = getCoordinates(subj, stats[subj]);
            return (
              <motion.circle
                key={subj}
                cx={coords.x}
                cy={coords.y}
                r="6"
                className="cursor-pointer"
                fill={activePreset === "elite" ? "#10B981" : activePreset === "standard" ? "#F59E0B" : "#EF4444"}
                stroke="#FFF"
                strokeWidth="2.5"
                animate={{ cx: coords.x, cy: coords.y }}
                transition={{ type: "spring", stiffness: 90, damping: 16 }}
                whileHover={{ scale: 1.5 }}
              />
            );
          })}
        </svg>

        {/* Center Badge representing Overall Accuracy */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl px-4 py-2 border border-surface-border dark:border-slate-800 shadow-md text-center">
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Accuracy</p>
          <motion.p
            key={activePreset}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-xl font-black mt-1 ${activePreset === "elite" ? "text-success" : activePreset === "standard" ? "text-warning" : "text-error"}`}
          >
            {Math.round(
              (stats.Biology + stats.Chemistry + stats.Physics + stats.English) / 4
            )}%
          </motion.p>
        </div>
      </div>

      {/* Preset Details */}
      <div className="w-full lg:w-1/2 flex flex-col self-stretch py-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
              Elite AI Weakness Radar
            </h4>
            <p className="text-gray-505 dark:text-gray-400 font-medium text-sm leading-relaxed">
              Most platforms just give you scores. Our Weakness Radar uses RAG and Mistake Analytics to visualize and correct your blindspots.
            </p>
          </div>

          {/* Info card display */}
          <div className={`p-5 rounded-2xl border-2 transition-colors duration-300 min-h-[110px] flex gap-4 ${PRESETS[activePreset].colorClass} ${PRESETS[activePreset].darkColorClass}`}>
            {(() => {
              const IconComp = PRESETS[activePreset].icon;
              return (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-950 border border-inherit flex items-center justify-center shrink-0 shadow-sm">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-black text-sm uppercase tracking-wide">{PRESETS[activePreset].label}</h5>
                    <p className="text-xs opacity-90 leading-relaxed font-medium">{PRESETS[activePreset].desc}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      </div>

      {/* Preset Toggles */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {(Object.keys(PRESETS) as PresetName[]).map((key) => {
          const isActive = activePreset === key;
          let btnStyle = "border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-700";
          if (isActive) {
            btnStyle = key === "elite"
              ? "border-success bg-success/10 dark:bg-success/20 text-success dark:text-emerald-400 font-bold"
              : key === "standard"
              ? "border-warning bg-warning/10 dark:bg-warning/20 text-warning dark:text-amber-400 font-bold"
              : "border-error bg-error/10 dark:bg-error/20 text-error dark:text-red-400 font-bold";
          }
          return (
            <button
              key={key}
              onClick={() => setActivePreset(key)}
              className={`w-full px-3 py-3 sm:px-6 sm:py-3.5 border-2 rounded-full text-[10px] sm:text-sm font-bold uppercase tracking-normal text-center whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${btnStyle}`}
            >
              {key === "elite" ? "Elite AI" : key === "standard" ? "Standard" : "Diagnostic"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
