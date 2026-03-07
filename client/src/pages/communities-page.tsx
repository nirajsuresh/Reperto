import { Layout } from "@/components/layout";
import { PianoAvatar } from "@/components/piano-avatars";
import {
  Trophy, Users, Music, Zap, ArrowUpRight, CalendarDays, BookOpen,
  Star, PlusCircle, Video, MessageSquare, Clock, Library,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn, toComposerImageUrl } from "@/lib/utils";
import { ERA_DOT, ACTIVITY } from "@/lib/palette";
import { formatDistanceToNow } from "date-fns";

// ─────────────────────────────────────────────────────────────────────────────
// Constants / helpers
// ─────────────────────────────────────────────────────────────────────────────

const COMPOSER_ERA_MAP: Record<string, string> = {
  Bach: "Baroque", Handel: "Baroque", Vivaldi: "Baroque", Scarlatti: "Baroque", Purcell: "Baroque",
  Haydn: "Classical", Mozart: "Classical", Clementi: "Classical", Beethoven: "Classical",
  Schubert: "Romantic", Chopin: "Romantic", Schumann: "Romantic", Mendelssohn: "Romantic",
  Liszt: "Romantic", Brahms: "Romantic", Tchaikovsky: "Romantic", Rachmaninoff: "Romantic",
  Grieg: "Romantic", Franck: "Romantic", Mussorgsky: "Romantic", Medtner: "Romantic",
  Debussy: "Impressionist", Ravel: "Impressionist", Satie: "Impressionist", Faure: "Impressionist",
  Prokofiev: "Modern", Bartók: "Modern", Shostakovich: "Modern", Messiaen: "Modern",
  Stravinsky: "Modern", Scriabin: "Modern",
};

const ERA_GRADIENT: Record<string, string> = {
  Baroque:       "from-amber-700 to-amber-950",
  Classical:     "from-sky-600 to-sky-900",
  Romantic:      "from-rose-700 to-rose-950",
  Impressionist: "from-teal-600 to-teal-900",
  Modern:        "from-violet-700 to-violet-950",
  Other:         "from-stone-600 to-stone-900",
};

const ACTIVE_STATUSES = new Set(["In Progress", "Maintaining"]);

function getEra(composerName: string): string {
  const last = composerName.trim().split(" ").slice(-1)[0];
  return COMPOSER_ERA_MAP[last] ?? "Other";
}

function eraColor(era: string): string {
  return ERA_DOT[era] ?? ERA_DOT.Other;
}

function formatRelTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// ActivityCard — compact scrollable card (used by PieceCommunityPanel)
// ─────────────────────────────────────────────────────────────────────────────

interface ActivityPost {
  id: number;
  userId: string;
  content: string | null;
  type?: string;
  postType?: string;
  pieceTitle: string | null;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
}

function ActivityCard({ item }: { item: ActivityPost }) {
  const type = item.type ?? item.postType ?? "status_change";
  return (
    <div className="shrink-0 w-[172px] rounded-xl border border-border bg-card p-3 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-muted">
          <PianoAvatar avatarId={item.avatarUrl || "avatar-1"} size={24} className="w-full h-full" />
        </div>
        <span className="text-[11px] font-semibold truncate text-foreground">{item.displayName ?? "Musician"}</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3 flex-1">
        {activityLabel(type, item.content, item.pieceTitle)}
      </p>
      <p className="text-[10px] text-muted-foreground/50 font-medium">{formatRelTime(item.createdAt)}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ComposerCommunityPanel
// ─────────────────────────────────────────────────────────────────────────────

interface FollowedComposer {
  id: number; name: string; imageUrl: string | null; period: string | null;
  learnerCount: number; followerCount: number; recentActivity: ActivityPost[];
}

// Activity type config (matches piece-detail.tsx style)
type ActivityType = "status" | "added" | "milestone" | "recording" | "practice";
const ACTIVITY_CFG: Record<string, { icon: typeof Star; border: string; iconBg: string; iconColor: string }> = {
  status_change: { icon: Star,       ...ACTIVITY.status },
  added_piece:   { icon: PlusCircle, ...ACTIVITY.added },
  milestone:     { icon: Zap,        ...ACTIVITY.milestone },
  recording:     { icon: Video,      ...ACTIVITY.recording },
  practice_log:  { icon: Clock,      ...ACTIVITY.added },
  text:          { icon: MessageSquare, ...ACTIVITY.status },
};
const DEFAULT_CFG = ACTIVITY_CFG.status_change;

function activityLabel(type: string, content: string | null, pieceTitle: string | null): string {
  switch (type) {
    case "status_change": return content ?? (pieceTitle ? `Updated status for "${pieceTitle}"` : "Updated a piece status");
    case "milestone":     return content ?? "Reached a milestone";
    case "practice_log":  return content ?? (pieceTitle ? `Practised "${pieceTitle}"` : "Logged a practice session");
    case "recording":     return `Shared a recording${pieceTitle ? ` of "${pieceTitle}"` : ""}`;
    case "text":          return content ?? "Shared a thought";
    default:              return content ?? "Posted an update";
  }
}

function RichActivityCard({ item }: { item: ActivityPost }) {
  const type = item.type ?? item.postType ?? "status_change";
  const cfg = ACTIVITY_CFG[type] ?? DEFAULT_CFG;
  const Icon = cfg.icon;
  const timeStr = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
    : "";
  return (
    <div className={cn("shrink-0 w-52 rounded-xl border-l-4 bg-muted/30 border border-border p-3 hover:bg-muted/60 transition-colors", cfg.border)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", cfg.iconBg)}>
          <Icon className={cn("w-3 h-3", cfg.iconColor)} />
        </div>
        <span className="text-xs font-semibold truncate text-foreground">{item.displayName ?? "A member"}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug line-clamp-3 flex-1 mb-1.5">
        {activityLabel(type, item.content, item.pieceTitle)}
      </p>
      {item.pieceTitle && (
        <p className="text-[10px] font-medium text-muted-foreground/70 truncate mb-1">{item.pieceTitle}</p>
      )}
      <p className="text-[10px] text-muted-foreground/50">{timeStr}</p>
    </div>
  );
}

function ComposerCommunityPanel({ composer }: { composer: FollowedComposer }) {
  const era = getEra(composer.name);
  const resolvedImg = toComposerImageUrl(composer.imageUrl) || composer.imageUrl || null;

  // Fetch community stats (followers, active learners, catalog size)
  const { data: stats } = useQuery<{ followerCount: number; activeLearners: number; catalogSize: number; mostPopularPiece: any }>({
    queryKey: [`/api/composers/${composer.id}/community`],
    staleTime: 60_000,
  });

  // Fetch active challenges for this composer
  const { data: challenges = [] } = useQuery<{ id: number; title: string; description: string; deadline: string | null; pieceTitle: string | null }[]>({
    queryKey: [`/api/composers/${composer.id}/challenges`],
    staleTime: 120_000,
  });

  // Fetch discussion
  const { data: discussion = [] } = useQuery<{ id: number; userId: string; displayName: string | null; avatarUrl: string | null; content: string; createdAt: string }[]>({
    queryKey: [`/api/composers/${composer.id}/comments`],
    staleTime: 60_000,
  });

  return (
    <section>
      <div className="rounded-2xl overflow-hidden border border-border bg-card">

        {/* ── GRADIENT HEADER ─────────────────────────────────── */}
        <div className={cn("bg-gradient-to-r px-5 py-4 flex items-center gap-4", ERA_GRADIENT[era] ?? ERA_GRADIENT.Other)}>
          {/* Photo */}
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-white/10 border border-white/20">
            {resolvedImg ? (
              <img src={resolvedImg} alt={composer.name} className="w-full h-full object-cover object-top"
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl font-bold text-white/80">
                  {composer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          {/* Name + era */}
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-bold text-white leading-tight truncate">{composer.name}</h2>
            <p className="text-white/60 text-xs mt-0.5">{composer.period ?? era}</p>
          </div>
          <Link href={`/composer/${composer.id}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-medium">
            View community <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ── SNAPSHOT STATS ──────────────────────────────────── */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/20">
          {[
            { icon: Users,   label: "Followers",       val: stats?.followerCount    ?? composer.followerCount },
            { icon: Music,   label: "Active learners",  val: stats?.activeLearners   ?? composer.learnerCount },
            { icon: Library, label: "Pieces in catalog",val: stats?.catalogSize      ?? "—" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex flex-col items-center justify-center py-3 px-2 text-center">
              <Icon className="w-3.5 h-3.5 text-muted-foreground mb-1" />
              <span className="text-lg font-bold tabular-nums leading-none">{val}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* ── COMMUNITY ACTIVITY ──────────────────────────────── */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Community activity</span>
          </div>
          {composer.recentActivity.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {composer.recentActivity.map(item => (
                <RichActivityCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-2">No recent activity — be the first to post!</p>
          )}
        </div>

        {/* ── ACTIVE CHALLENGES ───────────────────────────────── */}
        {(challenges as any[]).length > 0 && (
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Active challenges</span>
            </div>
            <div className="space-y-2">
              {(challenges as any[]).map((c: any) => (
                <div key={c.id} className="flex items-start gap-3 bg-muted/30 rounded-xl px-4 py-3">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight">{c.title}</p>
                    {c.pieceTitle && <p className="text-xs text-muted-foreground mt-0.5">{c.pieceTitle}</p>}
                  </div>
                  {c.deadline && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(c.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCUSSION ──────────────────────────────────────── */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Discussion</span>
            </div>
            <Link href={`/composer/${composer.id}`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Join discussion <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {(discussion as any[]).length > 0 ? (
            <div className="space-y-3">
              {(discussion as any[]).slice(0, 3).map((d: any) => (
                <div key={d.id} className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-muted mt-0.5">
                    <PianoAvatar avatarId={d.avatarUrl || "avatar-1"} size={28} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground">{d.displayName ?? "Member"}</span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {d.createdAt ? formatDistanceToNow(new Date(d.createdAt), { addSuffix: true }) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{d.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-1">No discussion yet. Visit the composer page to start the conversation.</p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PieceCommunityPanel — fetches piece activity internally
// ─────────────────────────────────────────────────────────────────────────────

function PieceCommunityPanel({ pieceId, pieceTitle, composerName, composerId, era }: {
  pieceId: number; pieceTitle: string; composerName: string; composerId: number; era: string;
}) {
  const { data: activity = [] } = useQuery<ActivityPost[]>({
    queryKey: [`/api/pieces/${pieceId}/activity`],
    staleTime: 60_000,
  });

  const { data: learners = [] } = useQuery<{ userId: string; displayName: string | null; avatarUrl: string | null; status: string }[]>({
    queryKey: [`/api/pieces/${pieceId}/learners`],
    staleTime: 60_000,
  });

  const accentColor = eraColor(era);

  return (
    <section className="space-y-3">
      <div className="rounded-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-4"
          style={{ backgroundColor: accentColor + "22", borderLeft: `4px solid ${accentColor}` }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-base font-bold leading-tight text-foreground truncate">{pieceTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {composerName} · <span className="font-medium">{(learners as any[]).length} learners in community</span>
            </p>
          </div>
          {/* Learner avatars */}
          {(learners as any[]).length > 0 && (
            <div className="flex -space-x-2 shrink-0">
              {(learners as any[]).slice(0, 5).map((l, i) => (
                <div key={l.userId} className="w-7 h-7 rounded-full overflow-hidden border-2 border-background bg-muted" style={{ zIndex: 5 - i }}>
                  <PianoAvatar avatarId={l.avatarUrl || "avatar-1"} size={28} className="w-full h-full" />
                </div>
              ))}
              {(learners as any[]).length > 5 && (
                <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted-foreground">+{(learners as any[]).length - 5}</span>
                </div>
              )}
            </div>
          )}
          <Link
            href={`/piece/${pieceId}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted transition-colors text-xs font-medium text-foreground"
          >
            View piece <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Activity */}
        {activity.length > 0 ? (
          <div className="bg-muted/20 border border-border border-t-0 rounded-b-2xl px-5 py-4">
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {activity.slice(0, 8).map(item => (
                <ActivityCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/10 border border-border border-t-0 rounded-b-2xl px-5 py-3">
            <p className="text-xs text-muted-foreground">No recent activity — share your progress!</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DiscoverPanel — trending + challenges
// ─────────────────────────────────────────────────────────────────────────────

interface TrendingData {
  composers: { id: number; name: string; imageUrl: string | null; period: string | null; learnerCount: number }[];
  pieces: { id: number; title: string; composerName: string; composerId: number; learnerCount: number }[];
}

interface Challenge {
  id: number; title: string; description: string;
  pieceId: number | null; deadline: string | null; isActive: boolean;
}

function DiscoverPanel({ trending, challenges }: { trending?: TrendingData; challenges?: Challenge[] }) {
  return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-primary px-6 py-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Discover</h2>
        <span className="text-xs text-primary-foreground/70">What's popular across Reperto right now</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Trending composers + pieces */}
        <div className="p-5 space-y-5">
          {/* Composers */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Trending Composers
            </h3>
            <div className="space-y-2">
              {(trending?.composers ?? []).slice(0, 5).map((c, i) => {
                const era = getEra(c.name);
                const img = toComposerImageUrl(c.imageUrl) || c.imageUrl;
                return (
                  <Link key={c.id} href={`/composer/${c.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                      <span className="text-xs font-bold text-muted-foreground/40 w-4 shrink-0">{i + 1}</span>
                      {/* Photo / monogram */}
                      <div
                        className={cn("w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gradient-to-b flex items-center justify-center", ERA_GRADIENT[era] ?? ERA_GRADIENT.Other)}
                      >
                        {img ? (
                          <img src={img} alt={c.name} className="w-full h-full object-cover object-top" referrerPolicy="no-referrer"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <span className="text-sm font-bold text-white/80">
                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.period ?? era}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold">{c.learnerCount}</p>
                        <p className="text-[10px] text-muted-foreground">learners</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Pieces */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" /> Trending Pieces
            </h3>
            <div className="space-y-2">
              {(trending?.pieces ?? []).slice(0, 4).map((p, i) => {
                const era = getEra(p.composerName);
                return (
                  <Link key={p.id} href={`/piece/${p.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                      <span className="text-xs font-bold text-muted-foreground/40 w-4 shrink-0">{i + 1}</span>
                      <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: eraColor(era) }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.composerName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold">{p.learnerCount}</p>
                        <p className="text-[10px] text-muted-foreground">learners</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Challenges */}
        <div className="p-5">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Active Challenges
          </h3>
          {(!challenges || challenges.length === 0) ? (
            <p className="text-xs text-muted-foreground">No active challenges right now.</p>
          ) : (
            <div className="space-y-3">
              {challenges.filter(c => c.isActive).slice(0, 3).map(ch => (
                <div key={ch.id} className="rounded-xl bg-muted/40 border border-border p-4 space-y-1.5">
                  <p className="text-sm font-bold text-foreground">{ch.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ch.description}</p>
                  {ch.deadline && (
                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground/70 pt-1">
                      <CalendarDays className="w-3 h-3" />
                      Deadline: {new Date(ch.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main CommunitiesPage
// ─────────────────────────────────────────────────────────────────────────────

export default function CommunitiesPage() {
  const [, navigate] = useLocation();
  const userId = localStorage.getItem("userId");

  useEffect(() => { if (!userId) navigate("/auth"); }, [userId, navigate]);

  const { data: followedComposers = [] } = useQuery<FollowedComposer[]>({
    queryKey: [`/api/users/${userId}/followed-composers`],
    enabled: !!userId,
    staleTime: 30_000,
  });

  const { data: trending } = useQuery<TrendingData>({
    queryKey: ["/api/community/trending"],
    staleTime: 60_000,
  });

  const { data: challenges = [] } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
    staleTime: 120_000,
  });

  const { data: rawRepertoire = [] } = useQuery<any[]>({
    queryKey: [`/api/repertoire/${userId}`],
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Derive active pieces (deduped) from repertoire
  const activePieces = useMemo(() => {
    const seen = new Set<number>();
    const result: { pieceId: number; pieceTitle: string; composerName: string; composerId: number; era: string }[] = [];
    for (const e of (rawRepertoire as any[])) {
      if (!seen.has(e.pieceId) && ACTIVE_STATUSES.has(e.status)) {
        seen.add(e.pieceId);
        result.push({
          pieceId: e.pieceId, pieceTitle: e.pieceTitle,
          composerName: e.composerName, composerId: e.composerId,
          era: getEra(e.composerName),
        });
      }
    }
    // Cap at 6 most-relevant (first encountered = highest display order)
    return result.slice(0, 6);
  }, [rawRepertoire]);

  if (!userId) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-background pb-20">

        {/* ── HERO ──────────────────────────────────────────── */}
        <div className="bg-black text-primary-foreground">
          <div className="container mx-auto px-6 xl:px-8 max-w-[1760px] pt-6 pb-8">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">Communities</h1>
                <p className="text-primary-foreground/70 mt-1 text-sm">Explore what's happening across Reperto</p>
              </div>
              <div className="hidden sm:flex items-center gap-5 text-sm text-primary-foreground/70 pb-1">
                <span><span className="font-bold text-primary-foreground mr-1">{(followedComposers as any[]).length}</span> composers followed</span>
                <span><span className="font-bold text-primary-foreground mr-1">{activePieces.length}</span> pieces active</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────── */}
        <div className="container mx-auto px-6 xl:px-8 max-w-[1760px] py-8 space-y-10">

          {/* Discover panel */}
          <DiscoverPanel trending={trending} challenges={challenges as Challenge[]} />

          {/* Composer communities */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Composer Communities</h2>
            </div>

            {(followedComposers as FollowedComposer[]).length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm font-medium">You haven't followed any composers yet.</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Visit a <Link href="/search" className="underline hover:text-primary">composer's page</Link> and click Follow to see their community here.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {(followedComposers as FollowedComposer[]).map(composer => (
                  <ComposerCommunityPanel key={composer.id} composer={composer} />
                ))}
              </div>
            )}
          </section>

          {/* Piece communities */}
          {activePieces.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Your Active Pieces</h2>
                <span className="text-xs text-muted-foreground/50">community activity</span>
              </div>
              <div className="space-y-5">
                {activePieces.map(p => (
                  <PieceCommunityPanel
                    key={p.pieceId}
                    pieceId={p.pieceId}
                    pieceTitle={p.pieceTitle}
                    composerName={p.composerName}
                    composerId={p.composerId}
                    era={p.era}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </Layout>
  );
}
