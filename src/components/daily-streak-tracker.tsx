"use client";

import { useEffect, useState } from "react";
import { getStreak, updateStreak, type StreakInfo } from "@/lib/streak-helper";
import { Zap, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function DailyStreakTracker() {
    const [streakInfo, setStreakInfo] = useState<StreakInfo>({ streak: 0, lastActiveDate: null });

    useEffect(() => {
        // Increment/update streak on page load
        const updated = updateStreak();
        setStreakInfo(updated);
    }, []);

    if (streakInfo.streak === 0) return null;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-between gap-4"
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Zap className="w-6 h-6 animate-pulse fill-current" />
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    />
                </div>
                <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        {streakInfo.streak} Day Streak!
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                        Keep practicing daily to boost your score!
                    </p>
                </div>
            </div>

            <div className="text-right">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2 py-1 rounded-lg">
                    Active Prep
                </span>
            </div>
        </motion.div>
    );
}
