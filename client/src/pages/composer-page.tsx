import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Users, BookOpen, Music2, ExternalLink,
  Youtube, Hash, TrendingUp, Clock, ChevronRight, UserCircle2
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const currentUserId = () => localStorage.getItem("userId") || "";

// ── helpers ──────────────────────────────────────────────────────────────────

function getEra(birthYear?: number | null): string | null {
  if (!birthYear) return null;
  if (birthYear < 1600) return "Renaissance";
  if (birthYear < 1750) return "Baroque";
  if (birthYear < 1820) return "Classical";
  if (birthYear < 1900) return "Romantic";
  if (birthYear < 1945) return "Modern";
  return "Contemporary";
}

function getEraColor(era: string | null) {
  const map: Record<string, string> = {
    Renaissance: "bg-amber-100 text-amber-800",
    Baroque:     "bg-yellow-100 text-yellow-800",
    Classical:   "bg-sky-100 text-sky-800",
    Romantic:    "bg-rose-100 text-rose-800",
    Modern:      "bg-violet-100 text-violet-800",
    Contemporary:"bg-emerald-100 text-emerald-800",
  };
  return map[era ?? ""] ?? "bg-muted text-muted-foreground";
}

function DifficultyDot({ difficulty }: { difficulty?: string | null }) {
  if (!difficulty) return null;
  const map: Record<string, string> = {
    Beginner:     "bg-green-400",
    Intermediate: "bg-blue-400",
    Advanced:     "bg-orange-400",
    Expert:       "bg-red-500",
  };
  return (
    <span className="flex items-center gap-1">
      <span className={cn("w-2 h-2 rounded-full inline-block", map[difficulty] ?? "bg-muted")} />
      <span className="text-xs text-muted-foreground">{difficulty}</span>
    </span>
  );
}

function MemberAvatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name ?? ""} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-primary/70">{initials}</span>
      )}
    </div>
  );
}

function PopularityBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0;
  return (
    <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-2">
      <div className="h-full bg-primary/40 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ComposerPage() {
  const params = useParams<{ id: string }>();
  const composerId = params.id ? parseInt(params.id) : 0;
  const userId = currentUserId();
  const queryClient = useQueryClient();

  const { data: composer, isLoading } = useQuery({
    queryKey: ["/api/composers", composerId],
    queryFn: async () => {
      const res = await fetch(`/api/composers/${composerId}`);
      return res.ok ? res.json() : null;
    },
    enabled: !!composerId,
  });

  const { data: community } = useQuery({
    queryKey: ["/api/composers", composerId, "community"],
    queryFn: async () => {
      const res = await fetch(`/api/composers/${composerId}/community`);
      return res.ok ? res.json() : null;
    },
    enabled: !!composerId,
  });

  const { data: pieces = [] } = useQuery<any[]>({
    queryKey: ["/api/composers", composerId, "pieces"],
    queryFn: async () => {
      const res = await fetch(`/api/composers/${composerId}/pieces`);
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
    enabled: !!composerId,
  });

  const { data: members = [] } = useQuery<any[]>({
    queryKey: ["/api/composers", composerId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/composers/${composerId}/members`);
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
    enabled: !!composerId,
  });

  const { data: activity = [] } = useQuery<any[]>({
    queryKey: ["/api/composers", composerId, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/composers/${composerId}/activity`);
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    },
    enabled: !!composerId,
  });

  const { data: followStatus, isLoading: followLoading } = useQuery({
    queryKey: ["/api/composers", composerId, "follow-status", userId],
    queryFn: async () => {
      if (!userId) return { following: false };
      const res = await fetch(`/api/composers/${composerId}/follow-status?userId=${userId}`);
      return res.ok ? res.json() : { following: false };
    },
    enabled: !!composerId && !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const method = followStatus?.following ? "DELETE" : "POST";
      const res = await fetch(`/api/composers/${composerId}/follow`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/composers", composerId] });
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
      </Layout>
    );
  }

  if (!composer) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Composer not found.</div>
      </Layout>
    );
  }

  const era = getEra(composer.birthYear);
  const isFollowing = followStatus?.following ?? false;
  const lifeDates =
    composer.birthYear && composer.deathYear
      ? `${composer.birthYear}–${composer.deathYear}`
      : composer.birthYear ? `b. ${composer.birthYear}` : null;

  const maxLearners = pieces.reduce((m: number, p: any) => Math.max(m, p.learnerCount ?? 0), 0);
  const featuredPiece = community?.mostPopularPiece
    ? pieces.find((p: any) => p.id === community.mostPopularPiece.id) ?? null
    : pieces[0] ?? null;

  return (
    <Layout>
      <div className="min-h-screen bg-background">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <div className="bg-stone-900 text-stone-100">
          <div className="container mx-auto px-4 max-w-5xl pt-6 pb-10">
            <Link href="/search">
              <Button variant="ghost" size="sm" className="mb-6 text-stone-300 hover:text-white hover:bg-stone-800 group">
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Back
              </Button>
            </Link>

            <div className="flex flex-col sm:flex-row items-start gap-8">
              {/* Portrait */}
              <div className="flex-shrink-0">
                {composer.imageUrl ? (
                  <img
                    src={composer.imageUrl}
                    alt={composer.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-xl border border-stone-700"
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-stone-700 flex items-center justify-center shadow-xl border border-stone-600">
                    <span className="font-serif text-4xl font-bold text-stone-400">
                      {composer.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {era && (
                    <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", getEraColor(era))}>
                      {era}
                    </span>
                  )}
                  {composer.nationality && (
                    <span className="text-xs text-stone-400 font-medium">{composer.nationality}</span>
                  )}
                  {lifeDates && (
                    <span className="text-xs text-stone-400">{lifeDates}</span>
                  )}
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                  {composer.name}
                </h1>

                {composer.bio ? (
                  <p className="text-stone-300 text-sm leading-relaxed max-w-xl mb-5">{composer.bio}</p>
                ) : (
                  <p className="text-stone-500 text-sm italic mb-5">No biography added yet.</p>
                )}

                {/* Actions + quick stats */}
                <div className="flex flex-wrap items-center gap-3">
                  {userId && (
                    <Button
                      size="sm"
                      variant={isFollowing ? "outline" : "default"}
                      className={cn(
                        isFollowing
                          ? "border-stone-500 text-stone-200 hover:bg-stone-800"
                          : "bg-white text-stone-900 hover:bg-stone-100"
                      )}
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending || followLoading}
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                  <span className="text-stone-400 text-sm">
                    <span className="font-semibold text-stone-200">{community?.followerCount ?? 0}</span> followers
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="text-stone-400 text-sm">
                    <span className="font-semibold text-stone-200">{community?.activeLearners ?? 0}</span> studying now
                  </span>
                  <span className="text-stone-600">·</span>
                  <span className="text-stone-400 text-sm">
                    <span className="font-semibold text-stone-200">{pieces.length}</span> pieces
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 max-w-5xl py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT / MAIN col (2/3) ──────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Featured piece */}
              {featuredPiece && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" /> Most studied
                  </h2>
                  <Link href={`/piece/${featuredPiece.id}`}>
                    <Card className="border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group">
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-xl font-semibold group-hover:text-primary transition-colors leading-snug">
                            {featuredPiece.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            {featuredPiece.keySignature && (
                              <span className="text-xs text-muted-foreground">{featuredPiece.keySignature}</span>
                            )}
                            {featuredPiece.yearComposed && (
                              <span className="text-xs text-muted-foreground">{featuredPiece.yearComposed}</span>
                            )}
                            <DifficultyDot difficulty={featuredPiece.difficulty} />
                            {featuredPiece.imslpUrl && (
                              <a
                                href={featuredPiece.imslpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" /> IMSLP
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>{featuredPiece.learnerCount} members learning</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Catalog */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Music2 className="w-3 h-3" /> Catalog ({pieces.length})
                </h2>
                {pieces.length === 0 ? (
                  <Card className="border-none shadow-sm">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      No pieces in the database yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pieces.map((piece: any) => (
                      <Link key={piece.id} href={`/piece/${piece.id}`}>
                        <Card className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group h-full">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-sm leading-snug group-hover:text-primary transition-colors">
                                {piece.title}
                              </p>
                              {piece.learnerCount > 0 && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0 mt-0.5">
                                  <Users className="w-3 h-3" />
                                  {piece.learnerCount}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              {piece.keySignature && (
                                <span className="text-xs text-muted-foreground">{piece.keySignature}</span>
                              )}
                              {piece.yearComposed && (
                                <span className="text-xs text-muted-foreground">{piece.yearComposed}</span>
                              )}
                              <DifficultyDot difficulty={piece.difficulty} />
                            </div>

                            <PopularityBar count={piece.learnerCount ?? 0} max={maxLearners} />

                            {piece.imslpUrl && (
                              <a
                                href={piece.imslpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-2 w-fit"
                                onClick={e => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" /> Sheet music
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Community activity */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Community activity
                </h2>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-0">
                    {activity.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-8">
                        No activity yet — be the first to study a piece by {composer.name.split(" ").slice(-1)[0]}.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {activity.map((post: any) => (
                          <div key={post.id} className="flex items-start gap-3 px-4 py-3">
                            <MemberAvatar name={post.displayName} avatarUrl={post.avatarUrl} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-snug">
                                <span className="font-medium">{post.displayName ?? "A member"}</span>
                                {" "}<span className="text-muted-foreground">{post.content}</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {post.pieceTitle} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── RIGHT / SIDEBAR col (1/3) ──────────────────── */}
            <div className="space-y-5">

              {/* Members studying */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="w-3 h-3" /> Members studying
                </h2>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-4">
                    {members.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <UserCircle2 className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground text-center">
                          No members yet. Add a piece to your repertoire to appear here.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {members.slice(0, 10).map((m: any) => (
                            <Link key={m.userId} href={`/user/${m.userId}`}>
                              <div title={m.displayName ?? m.userId}>
                                <MemberAvatar name={m.displayName} avatarUrl={m.avatarUrl} />
                              </div>
                            </Link>
                          ))}
                          {members.length > 10 && (
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium border-2 border-background">
                              +{members.length - 10}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {members.length} member{members.length !== 1 ? "s" : ""} {members.length === 1 ? "has" : "have"} this composer in their repertoire
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Repertoire breakdown by status */}
              {community && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" /> Community snapshot
                  </h2>
                  <Card className="border-none shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Followers</span>
                        <span className="text-sm font-semibold">{community.followerCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Actively learning</span>
                        <span className="text-sm font-semibold">{community.activeLearners}</span>
                      </div>
                      {community.mostPopularPiece && (
                        <div className="pt-1 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-0.5">Most studied</p>
                          <Link href={`/piece/${community.mostPopularPiece.id}`}>
                            <p className="text-sm font-medium hover:text-primary transition-colors cursor-pointer leading-snug">
                              {community.mostPopularPiece.title}
                            </p>
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {community.mostPopularPiece.learnerCount} learner{community.mostPopularPiece.learnerCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* YouTube stub */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Youtube className="w-3 h-3" /> Top performances
                </h2>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {["Recommended performance", "Analysis & masterclass", "Historical recording"].map((label, i) => (
                      <div key={i} className="flex items-center gap-3 opacity-40">
                        <div className="w-16 h-10 rounded bg-muted flex-shrink-0 flex items-center justify-center">
                          <Youtube className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">YouTube — coming soon</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Reddit stub */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Hash className="w-3 h-3" /> Community discussions
                </h2>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    {["r/piano • 347 comments", "r/classicalmusic • 89 comments", "r/piano • 56 comments"].map((label, i) => (
                      <div key={i} className="opacity-40">
                        <p className="text-xs font-medium">Discussion {i + 1}</p>
                        <p className="text-xs text-muted-foreground">{label} — coming soon</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
