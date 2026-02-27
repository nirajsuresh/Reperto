const statusBadgeColors: Record<string, string> = {
  "Want to learn": "bg-[#b8c8bf] text-black border-[#a0b5a8]",
  "Up next": "bg-[#a3bfb0] text-black border-[#8fae9d]",
  "Learning": "bg-[#8fa79a] text-black border-[#7a9488]",
  "Refining": "bg-[#d4967c] text-black border-[#c4866c]",
  "Maintaining": "bg-[#c4a882] text-black border-[#b49872]",
  "Performance Ready": "bg-[#c88264] text-black border-[#b87254]",
  "Shelved": "bg-[#8e8b88] text-black border-[#7e7b78]",
};

const statusDotColors: Record<string, string> = {
  "Want to learn": "#b8c8bf",
  "Up next": "#a3bfb0",
  "Learning": "#8fa79a",
  "Refining": "#d4967c",
  "Maintaining": "#c4a882",
  "Performance Ready": "#c88264",
  "Shelved": "#8e8b88",
};

export const STATUSES = [
  "Want to learn",
  "Up next",
  "Learning",
  "Refining",
  "Maintaining",
  "Performance Ready",
  "Shelved",
] as const;

export type RepertoireStatus = (typeof STATUSES)[number];

export const VALID_TRANSITIONS: Record<RepertoireStatus, RepertoireStatus[]> = {
  "Want to learn": ["Up next"],
  "Up next": ["Learning", "Want to learn"],
  "Learning": ["Refining", "Maintaining", "Shelved"],
  "Refining": ["Performance Ready", "Learning"],
  "Maintaining": ["Learning", "Shelved"],
  "Performance Ready": ["Maintaining", "Refining"],
  "Shelved": ["Want to learn", "Up next"],
};

export function getStatusColor(status: string): string {
  return statusBadgeColors[status] ?? "bg-muted text-muted-foreground";
}

export function getStatusDotColor(status: string): string {
  return statusDotColors[status] ?? "#94a3b8";
}
