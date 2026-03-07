// Badge system for Reperto
// Badges are computed dynamically from repertoire data + pioneer status

export type BadgeTier = "silver" | "gold" | "platinum";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  tier: BadgeTier;
  category: "composer" | "piece" | "genre" | "milestone" | "pioneer";
}

export interface EarnedBadge extends Badge {
  earnedAt?: string;
  context?: string; // e.g. "Chopin – 5 pieces"
  /** Solid hex background colour for tile rendering (era-based or tier-based) */
  color?: string;
}

// ── Composer → era lookup (mirrors COMPOSER_ERA_MAP in profile-page) ──────────
const COMPOSER_ERA: Record<string, string> = {
  Bach: "Baroque", Handel: "Baroque", Vivaldi: "Baroque", Telemann: "Baroque", Scarlatti: "Baroque", Purcell: "Baroque",
  Haydn: "Classical", Mozart: "Classical", Clementi: "Classical", Dussek: "Classical",
  Beethoven: "Classical", Hummel: "Classical",
  Schubert: "Romantic", Chopin: "Romantic", Schumann: "Romantic", Mendelssohn: "Romantic",
  Liszt: "Romantic", Brahms: "Romantic", Tchaikovsky: "Romantic", Rachmaninoff: "Romantic",
  Grieg: "Romantic", Dvorak: "Romantic", Franck: "Romantic",
  Debussy: "Impressionist", Ravel: "Impressionist", Satie: "Impressionist", Faure: "Impressionist",
  Prokofiev: "Modern", Bartók: "Modern", Shostakovich: "Modern", Messiaen: "Modern",
  Stravinsky: "Modern", Scriabin: "Modern", Hindemith: "Modern", Copland: "Modern",
  Medtner: "Romantic", Mussorgsky: "Romantic", Balakirev: "Romantic",
};

function eraOfComposer(name: string): string {
  const last = name.trim().split(" ").slice(-1)[0];
  return COMPOSER_ERA[last] ?? "Other";
}

// ── Era badge background colors (vibrant brand family) ───────────────────────────
export const ERA_TILE_COLOR: Record<string, string> = {
  Renaissance:   "#D4967C",
  Baroque:       "#EC9A29",
  Classical:     "#143642",
  Romantic:      "#A8201A",
  Impressionist: "#0F8B8D",
  Modern:        "#6D57A7",
  Contemporary:  "#0F8B8D",
  Other:         "#5b4f58",
};

// ── Tier colors (used for tier flair/border only) ───────────────────────────────
export const TIER_TILE_COLOR: Record<BadgeTier, string> = {
  silver:   "#C0C0C0",
  gold:     "#FFD700",
  platinum: "#E5E4E2",
};

// ── Independent badge tile backgrounds (not tier colors) ────────────────────────
export const BADGE_TILE_BG_COLOR: Record<BadgeTier, string> = {
  silver: "#2D8FA3",
  gold: "#C85D2A",
  platinum: "#5B4DB2",
};

export const TIER_TEXT_COLOR: Record<BadgeTier, string> = {
  silver: "#24323A",
  gold: "#3B2E00",
  platinum: "#2D3A45",
};

// ── Tier label text colors (readable on white text) ───────────────────────────
export const TIER_LABEL: Record<BadgeTier, string> = {
  silver:   "Silver",
  gold:     "Gold",
  platinum: "Platinum",
};

// ── Legacy gradient/ring strings kept for backward compat with composer/piece pages ──
export const TIER_COLORS: Record<BadgeTier, string> = {
  silver:   "from-[#d7d7d7] to-[#b5b5b5]",
  gold:     "from-[#ffe37a] to-[#f4c500]",
  platinum: "from-[#f1f1ef] to-[#d7d7d2]",
};

export const TIER_RING: Record<BadgeTier, string> = {
  silver:   "ring-[#C0C0C0]",
  gold:     "ring-[#FFD700]",
  platinum: "ring-[#E5E4E2]",
};

// ── Composer tier badges ───────────────────────────────────────────────────────
const COMPOSER_TIERS: Array<{ min: number; tier: BadgeTier; label: string; icon: string }> = [
  { min: 1, tier: "silver",   label: "Explorer", icon: "🔭" },
  { min: 3, tier: "gold",     label: "Devotee",  icon: "🎓" },
  { min: 5, tier: "platinum", label: "Scholar",  icon: "🏛️" },
];

// ── Composer vibe badges (unlocked at Devotee tier) ───────────────────────────
export const COMPOSER_VIBES: Record<string, { name: string; icon: string; desc: string }> = {
  "Chopin":       { name: "Nocturne Soul",       icon: "🌙", desc: "Devoted to the poetry of Chopin" },
  "Bach":         { name: "Contrapuntist",        icon: "🎼", desc: "Master of counterpoint" },
  "Beethoven":    { name: "Stürmisch",            icon: "⚡", desc: "Stormy and defiant" },
  "Prokofiev":    { name: "Iron Fingers",         icon: "🔩", desc: "Percussive modernist" },
  "Debussy":      { name: "Impressionist",        icon: "🌊", desc: "Painter of sound" },
  "Liszt":        { name: "Virtuoso",             icon: "🔥", desc: "Unbounded technical ambition" },
  "Schubert":     { name: "Wanderer",             icon: "🍂", desc: "Lyric wanderer" },
  "Brahms":       { name: "Autumnal",             icon: "🌾", desc: "Deep and autumnal" },
  "Schumann":     { name: "Florestan",            icon: "🃏", desc: "Romantic duality" },
  "Ravel":        { name: "The Jeweler",          icon: "💎", desc: "Crystalline craftsmanship" },
  "Rachmaninoff": { name: "Last Romanticist",     icon: "🎹", desc: "Sweeping late-Romantic grandeur" },
  "Messiaen":     { name: "Bird Caller",          icon: "🐦", desc: "Mystic ornithologist" },
  "Satie":        { name: "Eccentric",            icon: "🎪", desc: "Quiet revolutionary" },
};

// ── Iconic piece badges (earned at Maintaining) ─────────────────────────
export const PIECE_BADGES: Record<string, { name: string; icon: string; tier: BadgeTier }> = {
  "Goldberg Variations":                { name: "Goldberg Scholar",      icon: "🏆", tier: "gold" },
  "Piano Sonata No. 29 (Hammerklavier)":{ name: "Hammerklavier",         icon: "🔨", tier: "platinum" },
  "Ballade No. 1 in G minor":           { name: "The Ballade",           icon: "📜", tier: "gold" },
  "Transcendental Études":              { name: "Transcendentalist",     icon: "🌌", tier: "platinum" },
  "Vingt regards sur l'Enfant-Jésus":  { name: "Into the Light",        icon: "✨", tier: "platinum" },
  "The Well-Tempered Clavier":          { name: "Equal Temperament",     icon: "🔱", tier: "gold" },
  "Préludes":                           { name: "Préludiste",            icon: "🌫️", tier: "silver" },
  "Études Op. 10":                      { name: "Études Warrior",        icon: "⚔️", tier: "gold" },
  "Piano Concerto No. 2":               { name: "Grand Soloist",         icon: "🎭", tier: "gold" },
  "Kinderszenen":                       { name: "Inner Child",           icon: "🧒", tier: "silver" },
  "Pictures at an Exhibition":          { name: "The Exhibition",        icon: "🖼️", tier: "gold" },
  "Partita No. 2 in D minor":           { name: "Chaconne Bearer",       icon: "🎻", tier: "platinum" },
};

// ── Genre / period badges ──────────────────────────────────────────────────────
// Keyed on simplified composer era / piece genre tags
export const GENRE_BADGES = [
  { id: "baroque_devotee",   name: "Baroque Devotee",    icon: "🎶", tier: "silver" as BadgeTier, min: 3,  era: "Baroque" },
  { id: "classical_era",     name: "Classical Era",      icon: "🏛️", tier: "silver" as BadgeTier, min: 3,  era: "Classical" },
  { id: "romantic_heart",    name: "Romantic Heart",     icon: "❤️", tier: "silver" as BadgeTier, min: 5,  era: "Romantic" },
  { id: "modern_mind",       name: "Modern Mind",        icon: "🔬", tier: "gold"   as BadgeTier, min: 3,  era: "Modern" },
  { id: "concerto_soloist",  name: "Concerto Soloist",   icon: "🎹", tier: "gold"   as BadgeTier, min: 2,  genre: "Concerto" },
  { id: "sonata_explorer",   name: "Sonata Explorer",    icon: "🗺️", tier: "silver" as BadgeTier, min: 3,  genre: "Sonata" },
  { id: "etude_warrior",     name: "Étude Warrior",      icon: "⚔️", tier: "gold"   as BadgeTier, min: 3,  genre: "Étude" },
  { id: "prelude_seeker",    name: "Prélude Seeker",     icon: "🕯️", tier: "silver" as BadgeTier, min: 3,  genre: "Prélude" },
];

// ── Milestone badges ───────────────────────────────────────────────────────────
export const MILESTONE_BADGES = [
  { id: "first_performance", name: "First Performance", icon: "🎉", tier: "silver" as BadgeTier, description: "Marked your first piece as Maintaining" },
  { id: "polymath",          name: "Polymath",          icon: "🦉", tier: "silver" as BadgeTier, description: "Studying 3 or more composers concurrently" },
  { id: "century",           name: "Century",           icon: "💯", tier: "gold"   as BadgeTier, description: "100+ repertoire entries" },
  { id: "completionist",     name: "Completionist",     icon: "✅", tier: "platinum" as BadgeTier, description: "Brought 10 pieces to Maintaining" },
  { id: "dedicated",         name: "Dedicated",         icon: "📅", tier: "silver" as BadgeTier, description: "30+ days of consistent activity" },
];

// ── Pioneer badge template ─────────────────────────────────────────────────────
export function makePioneerBadge(type: "composer" | "piece", name: string): EarnedBadge {
  return {
    id: `pioneer_${type}_${name.toLowerCase().replace(/\s+/g, "_")}`,
    name: type === "composer" ? `${name} Pioneer` : `First Light – ${name}`,
    description: type === "composer"
      ? `One of the first to follow and champion ${name} on Reperto`
      : `First to spark discussion on ${name}`,
    icon: "🚩",
    tier: "platinum",
    category: "pioneer",
    context: name,
  };
}

// ── Main computation ───────────────────────────────────────────────────────────
export interface RepertoireEntry {
  id: number;
  composerName?: string;
  composerEra?: string;
  pieceTitle?: string;
  pieceGenre?: string;
  status?: string;
}

export interface PioneerStatus {
  pioneerComposers: string[];  // composer names user is pioneer of
  pioneerPieces: string[];     // piece titles user is pioneer of
}

// ── Helper: resolve tile color ─────────────────────────────────────────────────
function tileColor(era: string | null | undefined, tier: BadgeTier): string {
  if (era && ERA_TILE_COLOR[era]) return ERA_TILE_COLOR[era];
  return BADGE_TILE_BG_COLOR[tier];
}

export function computeUserBadges(
  repertoire: RepertoireEntry[],
  pioneer?: PioneerStatus
): EarnedBadge[] {
  const earned: EarnedBadge[] = [];

  // ── Composer tier + vibe badges ──────────────────────────────────────────────
  const byComposer = new Map<string, RepertoireEntry[]>();
  for (const r of repertoire) {
    if (!r.composerName) continue;
    const key = r.composerName;
    if (!byComposer.has(key)) byComposer.set(key, []);
    byComposer.get(key)!.push(r);
  }

  for (const [composer, entries] of Array.from(byComposer.entries())) {
    const count = entries.length;
    const era = entries[0]?.composerEra ?? eraOfComposer(composer);
    let topTier: typeof COMPOSER_TIERS[0] | undefined;
    for (const tier of COMPOSER_TIERS) {
      if (count >= tier.min) topTier = tier;
    }
    if (topTier) {
      earned.push({
        id: `composer_${topTier.label.toLowerCase()}_${composer.toLowerCase().replace(/\s+/g, "_")}`,
        name: `${composer} ${topTier.label}`,
        description: `${count} ${composer} piece${count !== 1 ? "s" : ""} in repertoire`,
        icon: topTier.icon,
        tier: topTier.tier,
        category: "composer",
        context: `${composer} – ${count} pieces`,
        color: tileColor(era, topTier.tier),
      });
    }
    // Vibe badge at Devotee (5+)
    if (count >= 5 && COMPOSER_VIBES[composer]) {
      const vibe = COMPOSER_VIBES[composer];
      earned.push({
        id: `vibe_${composer.toLowerCase().replace(/\s+/g, "_")}`,
        name: vibe.name,
        description: vibe.desc,
        icon: vibe.icon,
        tier: "gold",
        category: "composer",
        context: composer,
        color: tileColor(era, "gold"),
      });
    }
  }

  // ── Iconic piece badges ──────────────────────────────────────────────────────
  for (const r of repertoire) {
    if (!r.pieceTitle || !r.composerName) continue;
    const pb = PIECE_BADGES[r.pieceTitle];
    if (pb && r.status === "Maintaining") {
      const era = r.composerEra ?? eraOfComposer(r.composerName);
      earned.push({
        id: `piece_${r.pieceTitle.toLowerCase().replace(/\s+/g, "_").slice(0, 30)}`,
        name: pb.name,
        description: `Brought ${r.pieceTitle} to Maintaining`,
        icon: pb.icon,
        tier: pb.tier,
        category: "piece",
        context: r.pieceTitle,
        color: tileColor(era, pb.tier),
      });
    }
  }

  // ── Genre / period badges ────────────────────────────────────────────────────
  const eraCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  for (const r of repertoire) {
    if (r.composerEra) eraCounts.set(r.composerEra, (eraCounts.get(r.composerEra) ?? 0) + 1);
    if (r.pieceGenre) genreCounts.set(r.pieceGenre, (genreCounts.get(r.pieceGenre) ?? 0) + 1);
  }
  for (const gb of GENRE_BADGES) {
    const count = gb.era ? (eraCounts.get(gb.era) ?? 0) : (genreCounts.get(gb.genre!) ?? 0);
    if (count >= gb.min) {
      earned.push({
        id: gb.id,
        name: gb.name,
        description: `${count} ${gb.era ?? gb.genre} piece${count !== 1 ? "s" : ""} in repertoire`,
        icon: gb.icon,
        tier: gb.tier,
        category: "genre",
        context: `${count} pieces`,
        color: tileColor(gb.era ?? null, gb.tier),
      });
    }
  }

  // ── Milestone badges ─────────────────────────────────────────────────────────
  const perfReady = repertoire.filter(r => r.status === "Maintaining").length;
  const activeComposers = byComposer.size;
  const totalPieces = repertoire.length;

  if (perfReady >= 1)     earned.push({ ...MILESTONE_BADGES[0], category: "milestone", color: tileColor(null, MILESTONE_BADGES[0].tier), earnedAt: undefined });
  if (activeComposers >= 3) earned.push({ ...MILESTONE_BADGES[1], category: "milestone", color: tileColor(null, MILESTONE_BADGES[1].tier) });
  if (totalPieces >= 100)   earned.push({ ...MILESTONE_BADGES[2], category: "milestone", color: tileColor(null, MILESTONE_BADGES[2].tier) });
  if (perfReady >= 10)    earned.push({ ...MILESTONE_BADGES[3], category: "milestone", color: tileColor(null, MILESTONE_BADGES[3].tier) });

  // ── Pioneer badges ───────────────────────────────────────────────────────────
  if (pioneer) {
    for (const c of pioneer.pioneerComposers) {
      const badge = makePioneerBadge("composer", c);
      earned.push({ ...badge, color: tileColor(null, "platinum") });
    }
    for (const p of pioneer.pioneerPieces) {
      const badge = makePioneerBadge("piece", p);
      earned.push({ ...badge, color: tileColor(null, "platinum") });
    }
  }

  return earned;
}

// ── Helper: check if a single piece unlocks a badge ───────────────────────────
export function getPieceBadge(pieceTitle: string): { name: string; icon: string; tier: BadgeTier } | null {
  return PIECE_BADGES[pieceTitle] ?? null;
}

// ── Helper: get top N badges for display ─────────────────────────────────────
export function getTopBadges(badges: EarnedBadge[], n = 6): EarnedBadge[] {
  const tierOrder: BadgeTier[] = ["platinum", "gold", "silver"];
  return [...badges]
    .sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier))
    .slice(0, n);
}
