"use client";

export interface StreakInfo {
    streak: number;
    lastActiveDate: string | null;
}

const STREAK_KEY = "mdcat_user_streak_data";

export function getStreak(): StreakInfo {
    if (typeof window === "undefined") {
        return { streak: 0, lastActiveDate: null };
    }
    const data = localStorage.getItem(STREAK_KEY);
    if (!data) return { streak: 0, lastActiveDate: null };
    try {
        return JSON.parse(data);
    } catch {
        return { streak: 0, lastActiveDate: null };
    }
}

export function updateStreak(): StreakInfo {
    if (typeof window === "undefined") {
        return { streak: 0, lastActiveDate: null };
    }

    const todayStr = new Date().toDateString();
    const current = getStreak();

    if (current.lastActiveDate === todayStr) {
        // Already active today, streak remains unchanged
        return current;
    }

    let nextStreak = current.streak;

    if (current.lastActiveDate) {
        const lastActive = new Date(current.lastActiveDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            // Consecutive day, increment streak!
            nextStreak += 1;
        } else if (diffDays > 1) {
            // Streak broken, reset to 1
            nextStreak = 1;
        }
    } else {
        // First active day, set to 1
        nextStreak = 1;
    }

    const updated: StreakInfo = {
        streak: nextStreak,
        lastActiveDate: todayStr,
    };

    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
}
