"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, X } from "lucide-react";
import { api } from "../../convex/_generated/api";

/**
 * Forced first-time feature tour. Mounted once in src/app/(app)/layout.tsx
 * so it survives navigation between /dashboard, /quizzes, /copilot, etc.
 * Step 0 is a modal that pushes the user straight into a first quiz (can't
 * be skipped past without an explicit "Skip tour" opt-out — this implements
 * the growth audit's top recommendation: let a new signup experience the
 * product before any paywall decision). Steps 1+ are a dismissible spotlight
 * over the remaining sidebar nav items, targeted via the `data-tour-id`
 * attributes on studentNav links in layout.tsx.
 */

const SPOTLIGHT_STEPS = [
  {
    tourId: "copilot",
    title: "Study Copilot",
    body: "Chat with your notes and our MDCAT library — every answer comes with a cited source, not a guess.",
  },
  {
    tourId: "flashcards",
    title: "Flashcards",
    body: "Turn anything you got wrong into a spaced-repetition deck automatically.",
  },
  {
    tourId: "analytics",
    title: "Analytics",
    body: "See your weakest chapters at a glance — this is what the AI Weakness Radar uses to target your next quiz.",
  },
] as const;

type Rect = { top: number; left: number; width: number; height: number };

function getTargetRect(tourId: string): Rect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour-id="${tourId}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export default function OnboardingTour({ active }: { active: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);

  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<"welcome" | "spotlight" | "done">("welcome");
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const show = active && !dismissed && phase !== "done";
  const step = SPOTLIGHT_STEPS[stepIndex];

  // Recompute the spotlight's target position whenever the sidebar could
  // have moved (route change, resize) or the step changes.
  useEffect(() => {
    if (phase !== "spotlight" || !step) return;
    const update = () => setRect(getTargetRect(step.tourId));
    update();
    window.addEventListener("resize", update);
    // Sidebar mounts async on first paint — try again shortly after.
    const t = setTimeout(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(t);
    };
  }, [phase, step, pathname]);

  const finish = async () => {
    setPhase("done");
    try {
      await completeOnboarding({});
    } catch {
      // Best-effort — if this fails the tour just won't re-show next load,
      // which is a much smaller problem than blocking the user here.
    }
  };

  const skip = () => {
    setDismissed(true);
    void finish();
  };

  const startFirstQuiz = () => {
    setPhase("spotlight");
    setStepIndex(0);
    router.push("/quizzes");
  };

  const nextSpotlightStep = () => {
    if (stepIndex + 1 < SPOTLIGHT_STEPS.length) {
      setStepIndex((i) => i + 1);
    } else {
      void finish();
    }
  };

  const progressLabel = useMemo(
    () => `${stepIndex + 1} of ${SPOTLIGHT_STEPS.length}`,
    [stepIndex],
  );

  if (!show) return null;

  return (
    <AnimatePresence>
      {phase === "welcome" && (
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface rounded-4xl p-10 max-w-md w-full shadow-2xl border border-surface-border text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
              Welcome to MdcatXpert.
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-8">
              Before anything else, take one real quiz and see the AI Mistake Analyzer explain your
              wrong answers — that&apos;s the whole point of this platform, and it&apos;s free.
            </p>
            <button
              onClick={startFirstQuiz}
              className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 mb-3"
            >
              Start My First Quiz <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={skip}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Skip tour
            </button>
          </motion.div>
        </motion.div>
      )}

      {phase === "spotlight" && step && rect && (
        <motion.div
          key={`spotlight-${step.tourId}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 pointer-events-none"
        >
          {/* Dimmed backdrop with a cut-out around the target nav item */}
          <div
            className="fixed inset-0 bg-black/50 pointer-events-auto"
            style={{
              clipPath: `polygon(0 0, 0 100%, ${rect.left - 8}px 100%, ${rect.left - 8}px ${rect.top - 8}px, ${
                rect.left + rect.width + 8
              }px ${rect.top - 8}px, ${rect.left + rect.width + 8}px ${rect.top + rect.height + 8}px, ${
                rect.left - 8
              }px ${rect.top + rect.height + 8}px, ${rect.left - 8}px 100%, 100% 100%, 100% 0)`,
            }}
            onClick={skip}
          />
          <div
            className="absolute rounded-2xl ring-2 ring-primary-500 pointer-events-none"
            style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
          />
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute pointer-events-auto bg-surface rounded-3xl p-6 shadow-2xl border border-surface-border w-72"
            style={{ top: rect.top, left: Math.min(rect.left + rect.width + 24, window.innerWidth - 300) }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{progressLabel}</span>
              <button onClick={skip} className="text-gray-300 hover:text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100 mb-1.5">{step.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-5">{step.body}</p>
            <button
              onClick={nextSpotlightStep}
              className="w-full py-3 bg-primary-600 text-white font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-primary-500 transition-all flex items-center justify-center gap-2"
            >
              {stepIndex + 1 < SPOTLIGHT_STEPS.length ? "Next" : "Finish"} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
