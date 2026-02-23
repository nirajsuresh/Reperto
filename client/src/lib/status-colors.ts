const statusBadgeColors: Record<string, string> = {
  "Want to learn": "bg-[#b8c8bf] text-black border-[#a0b5a8]",
  "Learning": "bg-[#8fa79a] text-black border-[#7a9488]",
  "Polishing": "bg-[#d4967c] text-black border-[#c4866c]",
  "Performance-ready": "bg-[#c88264] text-black border-[#b87254]",
  "Shelved": "bg-[#8e8b88] text-black border-[#7e7b78]",
};

const statusDotColors: Record<string, string> = {
  "Want to learn": "#b8c8bf",
  "Learning": "#8fa79a",
  "Polishing": "#d4967c",
  "Performance-ready": "#c88264",
  "Shelved": "#8e8b88",
};

export function getStatusColor(status: string): string {
  return statusBadgeColors[status] ?? "bg-muted text-muted-foreground";
}

export function getStatusDotColor(status: string): string {
  return statusDotColors[status] ?? "#94a3b8";
}
