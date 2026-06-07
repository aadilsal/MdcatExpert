/**
 * Converts messy AI/plain-text blog output into well-structured Markdown
 * before rendering. Handles missing ## headers, inline bullet lists, etc.
 */

const KNOWN_SECTIONS = [
  "Introduction to MDCAT",
  "Understanding the MDCAT Syllabus",
  "Key Subjects and Topics",
  "Creating a Study Plan",
  "Time Management",
  "Study Tips and Strategies",
  "Conclusion",
  "Introduction",
  "Overview",
  "Final Thoughts",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split inline bullet lists: "foo * bar * baz" → separate lines */
function splitInlineBullets(text: string): string {
  let out = text.replace(/\s+\*\s+\*\*/g, "\n- **");
  out = out.replace(/\s+\*\s+(?=[A-Z*])/g, "\n- ");
  return out;
}

/** Insert ## before known section titles embedded in a wall of text */
function insertKnownSectionHeaders(text: string): string {
  let out = text;
  for (const section of KNOWN_SECTIONS) {
    // Match at start, after newline, or after sentence end — before body text
    const re = new RegExp(
      `(^|\\n|(?<=[.!?])\\s+)(${escapeRegex(section)})(?=\\s+[A-Z])`,
      "g",
    );
    out = out.replace(re, "\n\n## $2\n\n");
  }
  return out;
}

/**
 * Detect Title Case section headings (2–6 words) followed by body text
 * e.g. "Creating a Study Plan A well-structured..."
 */
function insertGenericSectionHeaders(text: string): string {
  if (/^##\s/m.test(text)) return text;

  return text.replace(
    /(?:^|\n\n)([A-Z][a-z]+(?:\s+(?:the|to|a|an|for|and|with|in|of|[A-Z][a-z]+)){1,5})\s+(?=(?:The|A|An|Students|Here|By|Remember|With|Effective|MdcatXpert|Preparing|This|It|You|Your|Use|Focus|Join|Review|Set|Create|Allocate|Identify|Practice)\b)/g,
    "\n\n## $1\n\n",
  );
}

/** Ensure markdown headings use ## when AI used plain bold titles */
function normalizeHeadingMarkers(text: string): string {
  return text
    .replace(/^#\s(?!#)/gm, "## ")
    .replace(/\n#\s(?!#)/g, "\n## ");
}

/** Collapse whitespace and trim blocks */
function tidyWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeBlogContent(raw: string): string {
  if (!raw?.trim()) return "";

  let text = raw.trim().replace(/\r\n/g, "\n");

  const hasStructure =
    /^#{1,3}\s/m.test(text) &&
    (text.includes("\n\n") || /^[-*]\s/m.test(text));

  if (!hasStructure) {
    text = insertKnownSectionHeaders(text);
    text = insertGenericSectionHeaders(text);
  }

  text = splitInlineBullets(text);
  text = normalizeHeadingMarkers(text);
  text = tidyWhitespace(text);

  return text;
}
