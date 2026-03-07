/**
 * Single source of truth for Reperto color palette.
 * Status colors drive badges, dropdowns, charts, and progress; other semantic
 * colors align to the same vibrant brand system.
 */

// ── Status (piece learning) ─────────────────────────────────────────────────
export const STATUS_DOT: Record<string, string> = {
  "Want to learn": "#DAD2D8",
  "Up next": "#D4967C",
  "In Progress": "#0F8B8D",
  "Maintaining": "#EC9A29",
  "Resting": "#143642",
};

export const STATUS_BADGE: Record<string, string> = {
  "Want to learn": "bg-[#DAD2D8] text-[#143642] border-[#c8bdc5]",
  "Up next": "bg-[#D4967C] text-[#143642] border-[#c88566]",
  "In Progress": "bg-[#0F8B8D] text-white border-[#0b7173]",
  "Maintaining": "bg-[#EC9A29] text-[#143642] border-[#da8716]",
  "Resting": "bg-[#143642] text-[#DAD2D8] border-[#214b5c]",
};

// ── Milestones ───────────────────────────────────────────────────────────────
export const MILESTONE_DOT: Record<string, string> = {
  started: "#0F8B8D",
  read_through: "#0F8B8D",
  notes_learned: "#0F8B8D",
  up_to_speed: "#0F8B8D",
  memorized: "#0F8B8D",
  completed: "#EC9A29",
  performed: "#A8201A",
};

export const MILESTONE_BG: Record<string, string> = {
  started: "bg-[#0F8B8D]/12",
  read_through: "bg-[#0F8B8D]/12",
  notes_learned: "bg-[#0F8B8D]/12",
  up_to_speed: "bg-[#0F8B8D]/12",
  memorized: "bg-[#0F8B8D]/12",
  completed: "bg-[#EC9A29]/18",
  performed: "bg-[#A8201A]/16",
};

export const MILESTONE_BORDER: Record<string, string> = {
  started: "border-[#0F8B8D]",
  read_through: "border-[#0F8B8D]",
  notes_learned: "border-[#0F8B8D]",
  up_to_speed: "border-[#0F8B8D]",
  memorized: "border-[#0F8B8D]",
  completed: "border-[#EC9A29]",
  performed: "border-[#A8201A]",
};

// ── Brand / accent ───────────────────────────────────────────────────────────
export const BRAND = {
  primary: "#143642",
  primaryHover: "#1f4f62",
  primaryMuted: "rgba(20, 54, 66, 0.10)",
  primaryMutedBorder: "rgba(20, 54, 66, 0.22)",
  logo: "#d4967c",
  accent: "#EC9A29",
  cyan: "#0F8B8D",
  red: "#A8201A",
} as const;

// ── Progress bar segments (by journey stage) ─────────────────────────────────
export const PROGRESS = {
  completed: STATUS_DOT["Maintaining"],
  high: STATUS_DOT["In Progress"],
  low: BRAND.logo,
} as const;

export function getProgressColor(pct: number): string {
  if (pct >= 100) return PROGRESS.completed;
  if (pct >= 60) return PROGRESS.high;
  return PROGRESS.low;
}

// ── Activity feed types (border, bg, text) ──────────────────────────────────
export const ACTIVITY = {
  status: { border: "border-l-[#0F8B8D]", iconBg: "bg-[#0F8B8D]/15", iconColor: "text-[#0F8B8D]" },
  added: { border: "border-l-[#143642]", iconBg: "bg-[#143642]/12", iconColor: "text-[#143642]" },
  milestone: { border: "border-l-[#EC9A29]", iconBg: "bg-[#EC9A29]/16", iconColor: "text-[#c77e1b]" },
  recording: { border: "border-l-[#A8201A]", iconBg: "bg-[#A8201A]/12", iconColor: "text-[#A8201A]" },
} as const;

// ── Era distribution ──────────────────────────────────────────────────────────
export const ERA_DOT: Record<string, string> = {
  Renaissance: "#D4967C",
  Baroque: "#EC9A29",
  Classical: "#143642",
  Romantic: "#A8201A",
  Impressionist: "#0F8B8D",
  Modern: "#7b5ea7",
  Contemporary: "#0F8B8D",
  Other: "#8a7f86",
};

export const ERA_BADGE: Record<string, string> = {
  Renaissance: "bg-[#D4967C]/20 text-[#7a4a32]",
  Baroque: "bg-[#EC9A29]/20 text-[#8a560e]",
  Classical: "bg-[#143642]/18 text-[#143642]",
  Romantic: "bg-[#A8201A]/18 text-[#A8201A]",
  Impressionist: "bg-[#0F8B8D]/16 text-[#0F8B8D]",
  Modern: "bg-[#7b5ea7]/18 text-[#5a4280]",
  Contemporary: "bg-[#0F8B8D]/16 text-[#0F8B8D]",
  Other: "bg-[#8a7f86]/20 text-[#5d545a]",
};

// ── Difficulty badges ──────────────────────────────────────────────────────
export const DIFFICULTY_BADGE: Record<string, string> = {
  Beginner: "bg-[#DAD2D8] text-[#143642]",
  Intermediate: "bg-[#0F8B8D]/20 text-[#0F8B8D]",
  Advanced: "bg-[#EC9A29]/20 text-[#7e4d0c]",
  Expert: "bg-[#A8201A]/20 text-[#7a1712]",
};

// ── Discussion/tag badges ────────────────────────────────────────────────────
export const TAG_BADGE: Record<string, string> = {
  General: "bg-[#143642]/10 text-[#143642]",
  "Tips & Technique": "bg-[#0F8B8D]/15 text-[#0F8B8D]",
  Interpretation: "bg-[#EC9A29]/18 text-[#8a560e]",
  Help: "bg-[#A8201A]/14 text-[#8d1a14]",
};

// ── Video type badges (Performance / Analysis / Masterclass) ──────────────────
export const VIDEO_TYPE_BADGE: Record<string, string> = {
  Performance: "bg-[#A8201A]/16 text-[#8d1a14]",
  Analysis: "bg-[#0F8B8D]/16 text-[#0F8B8D]",
  Masterclass: "bg-[#EC9A29]/18 text-[#8a560e]",
};

// ── Surfaces ────────────────────────────────────────────────────────────────
export const SURFACE = {
  card: "#ffffff",
  cardBorder: "border-primary/25",
} as const;

// ── Semantic ────────────────────────────────────────────────────────────────
export const SEMANTIC = {
  success: "#0F8B8D",
  destructive: "#A8201A",
} as const;

// ── Star rating (warm gold from palette) ───────────────────────────────────
export const RATING = {
  filled: "#EC9A29",
  filledHalf: "rgba(236, 154, 41, 0.5)",
  empty: "currentColor",
} as const;

// ── Learned/performed emphasis helpers ─────────────────────────────────────
export const HIGHLIGHT = {
  learnedRow: "bg-gradient-to-r from-[#fff8e8] to-[#ffefcb] hover:from-[#fff2d9] hover:to-[#ffe3ae]",
  performedRow: "bg-gradient-to-r from-[#ffecea] via-[#ffd7d3] to-[#ffc2bb] hover:from-[#ffe0dc] hover:to-[#ffb4aa]",
  learnedBorder: "border-l-[#EC9A29]",
  performedBorder: "border-l-[#A8201A]",
  learnedEdge: "bg-[#EC9A29]",
  performedEdge: "bg-[#A8201A]",
  learnedPill: "bg-[#EC9A29] text-[#143642]",
  performedPill: "bg-[#A8201A] text-white",
  performedIcon: "#8d1a14",
} as const;
