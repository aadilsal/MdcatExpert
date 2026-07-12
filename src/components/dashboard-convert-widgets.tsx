"use client";

import { useState } from "react";
import ScoreImprovementCalculator from "./score-improvement-calculator";
import PremiumFeatureModal from "./premium-feature-modal";

import AdUnit from "./ad-unit";

export default function DashboardConvertWidgets({ isPremiumUser }: { isPremiumUser: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isPremiumUser) return null;

  return (
    <div className="mt-8 space-y-6">
      <ScoreImprovementCalculator onUnlock={() => setModalOpen(true)} />
      
      <AdUnit slot="dashboard-sidebar" />
      
      <PremiumFeatureModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        featureName="Personalized AI Study Roadmap"
        outcomeText="Score 180+ with a step-by-step prep strategy"
        descriptionText="Get a day-by-day customized plan focusing on your weakest chapters, balancing past papers practice, and tracking target progress."
        whyStudentsUseIt="Candidates utilizing a study roadmap score an average of 18.5 points higher than peers studying ad-hoc."
        source="dashboard_calculator"
      />
    </div>
  );
}
