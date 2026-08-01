"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Medal, Star, Flame } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  name: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  isPremium: boolean;
}

export default function LeaderboardWidget() {
  const leaderboard = (useQuery(api.leaderboard.getWeeklyLeaderboard) || []) as LeaderboardEntry[];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 rounded-3xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Weekly Aspirants Arena
        </h3>
        <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
          Top 10 Leaders
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-gray-400 font-bold uppercase">
            No ranked activity yet this week
          </p>
          <p className="text-[11px] text-gray-400 mt-1 normal-case">
            Solve a quiz today to claim the #1 spot.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Podium Highlights */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {leaderboard.slice(0, 3).map((student, idx) => {
              const rankColors = [
                { bg: "from-amber-500/20 to-yellow-500/5 border-amber-500/30", text: "text-amber-600", icon: "🥇" },
                { bg: "from-slate-400/20 to-slate-400/5 border-slate-300/30", text: "text-slate-500", icon: "🥈" },
                { bg: "from-amber-700/20 to-amber-700/5 border-amber-800/30", text: "text-amber-800", icon: "🥉" },
              ][idx];

              return (
                <div
                  key={student.name + idx}
                  className={`bg-linear-to-b ${rankColors.bg} border rounded-2xl p-3 text-center flex flex-col items-center justify-between relative overflow-hidden`}
                >
                  <span className="text-xl mb-1">{rankColors.icon}</span>
                  <p className="text-[10px] font-black text-gray-900 dark:text-white truncate max-w-full flex items-center gap-0.5 justify-center">
                    {student.name.split(" ")[0]} 👑
                  </p>
                  <p className="text-[9px] font-black text-primary-600 mt-1 italic">
                    {student.correctCount} Qs
                  </p>
                </div>
              );
            })}
          </div>

          {/* Ranks 4-10 List */}
          <div className="divide-y divide-gray-100 dark:divide-slate-800/60 max-h-[300px] overflow-y-auto pr-1">
            {leaderboard.slice(3).map((student, idx) => {
              const actualRank = idx + 4;
              return (
                <div
                  key={student.name + actualRank}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-black text-gray-400 text-center">
                      {actualRank}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        {student.name}
                        {student.isPremium && (
                          <span className="text-[8px] font-black uppercase text-amber-500 tracking-wider">
                            Elite
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">
                        Accuracy: {student.accuracy}%
                      </p>
                    </div>
                  </div>

                  <span className="font-black text-gray-700 dark:text-slate-300">
                    {student.correctCount} Solved
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
