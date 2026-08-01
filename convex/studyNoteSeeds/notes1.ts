export type StudyNoteSeed = {
  title: string;
  subject: "Biology" | "Chemistry" | "Physics" | "English" | "General";
  chapter?: string;
  rawText: string;
};

/**
 * Original chapter-summary notes for the Study Copilot's RAG search — not
 * transcribed from any textbook, written fresh for high-yield MDCAT topics.
 * Inserted as unpublished platform studySources (sourceKind "ai_summary")
 * via seedStudyNotes.ts so an admin can review before publishing.
 */
export const STUDY_NOTES_SEED: StudyNoteSeed[] = [
  {
    title: "Cell Biology: Structure and Function",
    subject: "Biology",
    chapter: "Cell Biology",
    rawText: `# Cell Biology: Structure and Function

## Cell Theory
All living things are composed of one or more cells, the cell is the basic unit of structure and function in organisms, and all cells arise from pre-existing cells (Virchow). Cells are broadly classified as prokaryotic (no membrane-bound nucleus, e.g. bacteria) or eukaryotic (membrane-bound nucleus and organelles, e.g. plant and animal cells).

## Key Organelles and Their Functions
- Nucleus: houses DNA, controls gene expression and cell activity; surrounded by the nuclear envelope with pores for material exchange.
- Mitochondria: site of aerobic respiration; produces ATP via oxidative phosphorylation. Has its own DNA and a double membrane, with the inner membrane folded into cristae to increase surface area.
- Rough Endoplasmic Reticulum (RER): studded with ribosomes; synthesizes and folds proteins destined for secretion or membranes.
- Smooth Endoplasmic Reticulum (SER): lacks ribosomes; synthesizes lipids, and detoxifies drugs/poisons.
- Golgi Apparatus: modifies, sorts, and packages proteins and lipids received from the ER, often adding carbohydrate groups (glycosylation) before shipping them to their destination.
- Lysosomes: contain hydrolytic enzymes for breaking down waste materials, old organelles, and foreign particles (intracellular digestion).
- Ribosomes: sites of protein synthesis; can be free in the cytoplasm or bound to the RER.
- Cell membrane: a phospholipid bilayer with embedded proteins; controls what enters and exits the cell (selective permeability).

## Common Exam Traps
Students frequently confuse the Golgi apparatus (packaging/modifying) with the ER (synthesis), and lysosomes (digestion) with peroxisomes (breakdown of fatty acids and detoxification of hydrogen peroxide). Read each option carefully for the specific verb used — "synthesizes" vs "modifies" vs "packages" vs "digests" often distinguishes the correct organelle.

## Membrane Transport
- Diffusion: net movement of molecules from high to low concentration, requires no energy.
- Osmosis: diffusion of water specifically, across a selectively permeable membrane, from a region of higher water potential to lower water potential.
- Active transport: movement of molecules against their concentration gradient, requires ATP and carrier proteins (e.g. the sodium-potassium pump).
- Facilitated diffusion: passive movement of molecules through specific channel or carrier proteins, still along the concentration gradient (no ATP needed), but faster than simple diffusion for large or charged molecules.

## Enzymes
Enzymes are biological catalysts, typically proteins, that lower the activation energy of a reaction without being consumed. Their activity is affected by temperature (activity rises with temperature up to an optimum, then falls sharply as the enzyme denatures), pH (each enzyme has an optimum pH; extremes denature it), substrate concentration (activity rises then plateaus once the enzyme is saturated), and enzyme concentration.

Inhibitors reduce enzyme activity: competitive inhibitors resemble the substrate and bind the active site (overcome by raising substrate concentration), while non-competitive (allosteric) inhibitors bind elsewhere on the enzyme, changing its shape and reducing activity regardless of substrate concentration.`,
  },
  {
    title: "Human Physiology: The Digestive System",
    subject: "Biology",
    chapter: "Human Physiology",
    rawText: `# Human Physiology: The Digestive System

## Overview
The digestive system breaks down food into absorbable nutrients through mechanical and chemical digestion, then absorbs those nutrients into the bloodstream, and eliminates waste.

## Key Organs and Their Roles
- Mouth: mechanical digestion (chewing) begins chemical digestion via salivary amylase, which starts breaking down starch into maltose.
- Stomach: highly acidic environment (pH around 2) produced by parietal cells secreting HCl. Chief cells secrete pepsinogen, activated to pepsin by the acid, which begins protein digestion. The acidic environment also kills most ingested bacteria.
- Small intestine (duodenum, jejunum, ileum): the primary site of digestion and absorption.
  - The pancreas secretes digestive enzymes (amylase, lipase, trypsin/chymotrypsin) and bicarbonate (to neutralize stomach acid) into the duodenum.
  - The liver produces bile, stored in the gallbladder, which emulsifies fats (breaks large fat globules into smaller droplets) to increase surface area for lipase.
  - The intestinal wall is lined with villi and microvilli, dramatically increasing surface area for nutrient absorption.
- Large intestine: absorbs water and electrolytes from indigestible food matter, forming and storing feces.

## Key Enzyme Table (memorize source, substrate, product)
- Salivary amylase — source: salivary glands — substrate: starch — product: maltose
- Pepsin — source: stomach (chief cells) — substrate: proteins — product: peptides
- Pancreatic amylase — source: pancreas — substrate: starch — product: maltose
- Trypsin — source: pancreas — substrate: proteins/peptides — product: smaller peptides
- Lipase — source: pancreas — substrate: fats (triglycerides) — product: fatty acids + glycerol

## Common Exam Traps
Bile is NOT an enzyme — it is a fluid that physically emulsifies fat, increasing the surface area available for lipase to act on. Questions often test whether students know bile "does not chemically digest" fat. Also, pepsinogen (inactive) vs pepsin (active) is a frequent distinction tested — pepsinogen is activated by stomach acid (and later by pepsin itself, autocatalytically).`,
  },
  {
    title: "Stoichiometry and the Mole Concept",
    subject: "Chemistry",
    chapter: "Stoichiometry",
    rawText: `# Stoichiometry and the Mole Concept

## The Mole
A mole is defined as the amount of substance containing as many elementary entities (atoms, molecules, ions) as there are atoms in exactly 12 grams of carbon-12 — this number is Avogadro's number, approximately 6.022 x 10^23.

Molar mass is the mass of one mole of a substance, expressed in grams per mole (g/mol), and is numerically equal to the substance's atomic or molecular mass in atomic mass units.

Key relationships:
- Number of moles = given mass / molar mass
- Number of particles = number of moles x Avogadro's number
- For gases at STP, 1 mole occupies 22.4 liters (molar volume)

## Balancing Chemical Equations
A balanced equation has equal numbers of each type of atom on both sides, reflecting conservation of mass. Always balance the equation first before doing any mole-ratio calculation — this is the single most common source of stoichiometry errors.

## The Stoichiometry Method (step by step)
1. Write and balance the chemical equation.
2. Convert the given mass (or volume, or particles) of the starting substance into moles.
3. Use the mole ratio from the balanced equation (coefficients) to find moles of the substance you want.
4. Convert moles of the target substance back into the units the question asks for (mass, volume, particles).

## Limiting Reagent
When two or more reactants are combined, the limiting reagent is the one that runs out first, determining the maximum amount of product that can form. To identify it: calculate how much product each reactant could theoretically produce independently — whichever gives the smaller amount of product is the limiting reagent. The other reactant is in excess.

## Percent Yield
Percent yield = (actual yield / theoretical yield) x 100. Theoretical yield is calculated from stoichiometry assuming the reaction goes to completion with no losses; actual yield is what is measured experimentally, and is almost always lower due to side reactions, incomplete reactions, or loss during purification.

## Common Exam Traps
The most frequent stoichiometry errors are: forgetting to balance the equation before using mole ratios, mixing grams and moles without converting, and using the wrong reactant's molar mass in a limiting reagent problem. Always write units next to every number during a calculation to catch these errors before selecting an answer.`,
  },
  {
    title: "Kinematics: Motion in a Straight Line",
    subject: "Physics",
    chapter: "Kinematics",
    rawText: `# Kinematics: Motion in a Straight Line

## Key Definitions
- Distance: total path length traveled, a scalar quantity (no direction).
- Displacement: the straight-line distance between the initial and final position, a vector quantity (has direction).
- Speed: rate of change of distance with time, scalar.
- Velocity: rate of change of displacement with time, vector.
- Acceleration: rate of change of velocity with time, vector. Positive acceleration means speeding up in the direction of motion; negative acceleration (deceleration) means slowing down, though the sign depends on the chosen direction convention.

## The Equations of Motion (for constant acceleration)
Given initial velocity u, final velocity v, acceleration a, time t, and displacement s:
1. v = u + at
2. s = ut + (1/2)at^2
3. v^2 = u^2 + 2as
4. s = ((u + v)/2) x t

These equations only apply when acceleration is constant. If acceleration varies with time, calculus-based methods (or graph analysis) are needed instead.

## Reading Motion Graphs
- Displacement-time graph: the slope at any point equals the instantaneous velocity. A horizontal line means the object is at rest; a straight sloped line means constant velocity; a curve means changing velocity (acceleration).
- Velocity-time graph: the slope equals acceleration. The area under the curve (between the line and the time axis) equals the displacement over that time interval.

## Common Exam Traps
Students often confuse the slope and the area on a velocity-time graph — slope gives acceleration, area gives displacement, and these are frequently swapped in distractor options. Sign errors are also common: when an object decelerates while still moving forward, its velocity is still positive but its acceleration is negative (opposing the direction of motion) — this is different from an object that has reversed direction entirely.

## Free Fall (a special case of constant acceleration)
Near Earth's surface, objects in free fall accelerate downward at g, approximately 9.8 m/s^2 (often rounded to 10 m/s^2 for quick MCQ calculations), regardless of their mass (ignoring air resistance). At the highest point of vertical projectile motion, velocity is momentarily zero, but acceleration remains g, directed downward — a very frequently tested distinction.`,
  },
];
