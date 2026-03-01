import { Layout } from "@/components/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Music, Target, Clock, Trophy, MessageCircle, Play, Calendar, ChevronRight, Sparkles, UserPlus, Heart, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";

// Read userId directly from localStorage — same source as the rest of the app
function getStoredUserId(): string {
  return localStorage.getItem("userId") || "";
}

interface FeedPost {
  id: number;
  userId: string;
  type: string;
  content: string | null;
  pieceId: number | null;
  recordingUrl: string | null;
  practiceHours: number | null;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
  pieceTitle: string | null;
  composerName: string | null;
  likeCount: number;
  userLiked: boolean;
  commentCount: number;
}

interface PostComment {
  id: number;
  postId: number;
  userId: string;
  content: string;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  pieceId: number | null;
  startMeasure: number | null;
  endMeasure: number | null;
  deadline: string | null;
  isActive: boolean;
}

interface SuggestedUser {
  userId: string;
  displayName: string;
  instrument: string | null;
  level: string | null;
  avatarUrl: string | null;
}

function getPostIcon(type: string) {
  switch (type) {
    case "status_change": return <Music className="w-4 h-4" />;
    case "added_piece": return <Music className="w-4 h-4" />;
    case "milestone": return <Trophy className="w-4 h-4" />;
    case "practice_log": return <Clock className="w-4 h-4" />;
    case "recording": return <Play className="w-4 h-4" />;
    default: return <MessageCircle className="w-4 h-4" />;
  }
}

function getPostTypeLabel(type: string) {
  switch (type) {
    case "status_change": return "Repertoire Update";
    case "added_piece": return "Added Piece";
    case "milestone": return "Milestone";
    case "practice_log": return "Practice Log";
    case "recording": return "Recording";
    default: return "Post";
  }
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function PostCard({ post, feedUserId }: { post: FeedPost; feedUserId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const authUserId = getStoredUserId();

  const { data: comments = [], isLoading: commentsLoading } = useQuery<PostComment[]>({
    queryKey: [`/api/posts/${post.id}/comments`],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: showComments,
    staleTime: 0,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const method = post.userLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method,
        headers: { "x-user-id": authUserId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to like post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["/api/feed", feedUserId] });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't like post", description: err.message, variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": authUserId },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to post comment");
      }
      return res.json();
    },
    onSuccess: () => {
      setCommentText("");
      queryClient.refetchQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      queryClient.refetchQueries({ queryKey: ["/api/feed", feedUserId] });
    },
    onError: (err: Error) => {
      toast({ title: "Couldn't post comment", description: err.message, variant: "destructive" });
    },
  });

  const handleComment = () => {
    if (commentText.trim()) {
      commentMutation.mutate(commentText.trim());
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComment();
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-border/50 hover:shadow-md transition-shadow" data-testid={`post-card-${post.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-[#d4967c]/20">
            <AvatarImage src={post.avatarUrl || undefined} alt={post.displayName || "User"} />
            <AvatarFallback className="bg-[#d4967c]/10 text-[#d4967c] font-semibold">
              {getInitials(post.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground" data-testid={`post-author-${post.id}`}>
                {post.displayName || "Anonymous"}
              </span>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                {getPostIcon(post.type)}
                {getPostTypeLabel(post.type)}
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm mb-3" data-testid={`post-time-${post.id}`}>{timeAgo}</p>

            {post.content && (
              <p className="text-foreground mb-3 leading-relaxed" data-testid={`post-content-${post.id}`}>{post.content}</p>
            )}

            {post.pieceTitle && post.composerName && (
              <Link href={`/piece/${post.pieceId}`}>
                <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer mb-3" data-testid={`post-piece-${post.id}`}>
                  <Music className="w-4 h-4 text-[#d4967c]" />
                  <span className="text-sm">
                    <span className="font-medium">{post.pieceTitle}</span>
                    <span className="text-muted-foreground"> by {post.composerName}</span>
                  </span>
                </div>
              </Link>
            )}

            {post.recordingUrl && (
              <div className="mt-3 p-4 bg-[#d4967c]/5 rounded-lg border border-[#d4967c]/20" data-testid={`post-recording-${post.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#d4967c] flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Recording Available</p>
                    <p className="text-xs text-muted-foreground">Click to listen</p>
                  </div>
                </div>
              </div>
            )}

            {post.practiceHours && post.type === "milestone" && (
              <div className="mt-3 flex items-center gap-2 text-[#d4967c]" data-testid={`post-milestone-${post.id}`}>
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">{post.practiceHours} hours</span>
              </div>
            )}

            {/* Like and comment actions */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
              <button
                onClick={() => likeMutation.mutate()}
                disabled={!authUserId || likeMutation.isPending}
                className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-40 ${
                  post.userLiked
                    ? "text-[#d4967c]"
                    : "text-muted-foreground hover:text-[#d4967c]"
                }`}
                data-testid={`like-button-${post.id}`}
              >
                <Heart className={`w-4 h-4 ${post.userLiked ? "fill-current" : ""}`} />
                <span>{post.likeCount > 0 ? post.likeCount : ""}</span>
              </button>

              <button
                onClick={() => {
                  setShowComments(!showComments);
                  if (!showComments) {
                    setTimeout(() => commentInputRef.current?.focus(), 100);
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`comment-button-${post.id}`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentCount > 0 ? post.commentCount : "Comment"}</span>
              </button>
            </div>

            {/* Comments section */}
            {showComments && (
              <div className="mt-3 space-y-3">
                {commentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-2">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2">
                        <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                          <AvatarImage src={comment.avatarUrl || undefined} />
                          <AvatarFallback className="bg-[#d4967c]/10 text-[#d4967c] text-xs font-semibold">
                            {getInitials(comment.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/40 rounded-lg px-3 py-2">
                          <span className="text-xs font-semibold text-foreground mr-2">{comment.displayName || "Anonymous"}</span>
                          <span className="text-sm text-foreground">{comment.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                )}

                {authUserId && (
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Add a comment..."
                      className="min-h-[60px] resize-none text-sm"
                      rows={2}
                    />
                    <Button
                      size="icon"
                      onClick={handleComment}
                      disabled={!commentText.trim() || commentMutation.isPending}
                      className="shrink-0 bg-[#d4967c] hover:bg-[#c47a5a] text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComposeBox({ feedUserId }: { feedUserId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const authUserId = getStoredUserId();

  const handlePost = async () => {
    if (!text.trim() || !authUserId) return;
    setIsPosting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": authUserId },
        body: JSON.stringify({ content: text.trim(), type: "text" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `Server error ${res.status}`);
      }
      setText("");
      // Force a fresh refetch of the feed
      await queryClient.refetchQueries({ queryKey: ["/api/feed", feedUserId] });
    } catch (err: any) {
      toast({ title: "Couldn't post", description: err.message, variant: "destructive" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handlePost();
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-border/50 mb-6">
      <CardContent className="p-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what you're working on..."
          className="min-h-[80px] resize-none mb-3 border-border/50 focus:border-[#d4967c]/50"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">⌘+Enter to post</p>
          <Button
            onClick={handlePost}
            disabled={!text.trim() || isPosting || !authUserId}
            className="bg-[#d4967c] hover:bg-[#c47a5a] text-white"
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const daysRemaining = challenge.deadline
    ? Math.ceil((new Date(challenge.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="bg-gradient-to-br from-[#d4967c]/10 to-[#d4967c]/5 border-[#d4967c]/30 hover:border-[#d4967c]/50 transition-colors" data-testid={`challenge-card-${challenge.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#d4967c]/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-[#d4967c]" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground mb-1 truncate" data-testid={`challenge-title-${challenge.id}`}>
              {challenge.title}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {challenge.description}
            </p>
            {daysRemaining !== null && daysRemaining > 0 && (
              <div className="flex items-center gap-1 text-xs text-[#d4967c]">
                <Calendar className="w-3 h-3" />
                <span>{daysRemaining} days left</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestedUserCard({ user }: { user: SuggestedUser }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors" data-testid={`suggested-user-${user.userId}`}>
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName} />
        <AvatarFallback className="bg-[#d4967c]/10 text-[#d4967c] text-sm font-semibold">
          {getInitials(user.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{user.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {user.level} {user.instrument && `• ${user.instrument}`}
        </p>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0" data-testid={`button-follow-${user.userId}`}>
        <UserPlus className="w-4 h-4" />
      </Button>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-white/80">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FeedPage() {
  // Use localStorage directly — same as the rest of the app
  const feedUserId = localStorage.getItem("userId") || "";
  const queryClient = useQueryClient();

  const { data: posts, isLoading: postsLoading } = useQuery<FeedPost[]>({
    queryKey: ["/api/feed", feedUserId],
    queryFn: async () => {
      if (!feedUserId) return [];
      const res = await fetch(`/api/feed/${feedUserId}`, {
        headers: { "x-user-id": feedUserId },
      });
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    enabled: !!feedUserId,
    staleTime: 0,
  });

  const { data: challenges, isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
    queryFn: async () => {
      const res = await fetch("/api/challenges");
      if (!res.ok) throw new Error("Failed to fetch challenges");
      return res.json();
    },
  });

  const { data: suggestedUsers } = useQuery<SuggestedUser[]>({
    queryKey: ["/api/users", feedUserId, "suggested"],
    queryFn: async () => {
      if (!feedUserId) return [];
      const res = await fetch(`/api/users/${feedUserId}/suggested`);
      if (!res.ok) throw new Error("Failed to fetch suggested users");
      return res.json();
    },
    enabled: !!feedUserId,
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="font-serif text-3xl font-bold text-primary" data-testid="feed-title">Your Feed</h1>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-sm"
                  onClick={() => queryClient.refetchQueries({ queryKey: ["/api/feed", feedUserId] })}
                  data-testid="button-refresh-feed"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {feedUserId && <ComposeBox feedUserId={feedUserId} />}

              {postsLoading ? (
                <FeedSkeleton />
              ) : posts && posts.length > 0 ? (
                <div className="space-y-4" data-testid="feed-posts-list">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} feedUserId={feedUserId} />
                  ))}
                </div>
              ) : (
                <Card className="bg-white/80">
                  <CardContent className="p-12 text-center">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">Follow other musicians to see their updates here, or share your first post above.</p>
                    <Link href="/search">
                      <Button variant="outline" data-testid="button-discover-musicians">
                        Discover Musicians
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#d4967c]" />
                    Community Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3" data-testid="challenges-list">
                  {challengesLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : challenges && challenges.length > 0 ? (
                    challenges.slice(0, 3).map((challenge) => (
                      <ChallengeCard key={challenge.id} challenge={challenge} />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No active challenges</p>
                  )}

                  {challenges && challenges.length > 3 && (
                    <Button variant="ghost" className="w-full text-sm text-[#d4967c] hover:text-[#d4967c]" data-testid="button-view-all-challenges">
                      View All Challenges
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#d4967c]" />
                    Musicians to Follow
                  </CardTitle>
                </CardHeader>
                <CardContent data-testid="suggested-users-list">
                  {suggestedUsers && suggestedUsers.length > 0 ? (
                    <div className="space-y-1">
                      {suggestedUsers.map((user) => (
                        <SuggestedUserCard key={user.userId} user={user} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm py-2">No suggestions available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-5">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#d4967c]" />
                    Latest Recordings
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Discover recordings shared by the community
                  </p>
                  <Link href="/search?type=recordings">
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-browse-recordings">
                      Browse Recordings
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
