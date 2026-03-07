import {
  type User, type InsertUser,
  type Composer, type InsertComposer,
  type Piece, type InsertPiece,
  type Movement, type InsertMovement,
  type RepertoireEntry, type InsertRepertoireEntry,
  type Post, type InsertPost,
  type PostLike, type PostComment,
  type Challenge, type InsertChallenge,
  type UserProfile, type InsertUserProfile,
  type Follow, type InsertFollow,
  type PieceRating, type InsertPieceRating,
  type PieceComment, type InsertPieceComment,
  type PieceAnalysis, type InsertPieceAnalysis,
  type Connection, type InsertConnection,
  type ComposerFollow,
  type PieceMilestone,
  users, composers, pieces, movements, repertoireEntries, posts, postLikes, postComments, challenges, userProfiles, follows,
  pieceRatings, pieceComments, pieceAnalyses, connections, composerFollows, composerComments, pieceMilestones
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, desc, inArray, sql, count, avg, or, ne } from "drizzle-orm";

const CANONICAL_REPERTOIRE_STATUSES = [
  "Want to learn",
  "Up next",
  "In Progress",
  "Maintaining",
  "Resting",
] as const;

function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function normalizeRepertoireStatus(status: string | null | undefined): string {
  if (!status || typeof status !== "string") return "In Progress";
  const key = normalizeStatusKey(status);
  if (key === "want to learn" || key === "wishlist") return "Want to learn";
  if (key === "up next") return "Up next";
  if (key === "in progress" || key === "learning" || key === "refining" || key === "polishing") return "In Progress";
  if (key === "maintaining" || key === "performance ready" || key === "learned") return "Maintaining";
  if (key === "resting" || key === "shelved" || key === "stopped learning" || key === "paused") return "Resting";

  const canonical = CANONICAL_REPERTOIRE_STATUSES.find((s) => normalizeStatusKey(s) === key);
  return canonical ?? "In Progress";
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  searchComposers(query: string): Promise<Composer[]>;
  getComposerById(id: number): Promise<Composer | undefined>;
  createComposer(composer: InsertComposer): Promise<Composer>;
  
  searchPieces(query: string, composerId?: number): Promise<(Piece & { composerName: string })[]>;
  getPieceById(id: number): Promise<Piece | undefined>;
  getPiecesByComposer(composerId: number): Promise<Piece[]>;
  createPiece(piece: InsertPiece): Promise<Piece>;
  
  getMovementsByPiece(pieceId: number): Promise<Movement[]>;
  getMovementById(id: number): Promise<Movement | undefined>;
  createMovement(movement: InsertMovement): Promise<Movement>;
  
  getRepertoireByUser(userId: string): Promise<{
    entries: (RepertoireEntry & {
      composerName: string;
      pieceTitle: string;
      movementName: string | null;
      composer_image_url: string | null;
      composer_period: string | null;
      composer_birth_year?: number | null;
      composer_death_year?: number | null;
      hasStartedMilestone: boolean;
      everMilestone: "completed" | "performed" | null;
      performedCount: number;
    })[];
    movementOrderByPiece: Record<number, number[]>;
  }>;
  createRepertoireEntry(entry: InsertRepertoireEntry): Promise<RepertoireEntry>;
  updateRepertoireEntry(id: number, updates: Partial<InsertRepertoireEntry>): Promise<RepertoireEntry | undefined>;
  updateRepertoireByPiece(userId: string, pieceId: number, updates: Partial<InsertRepertoireEntry>): Promise<RepertoireEntry[]>;
  deleteRepertoireEntry(id: number): Promise<boolean>;
  deleteRepertoireByPiece(userId: string, pieceId: number): Promise<boolean>;
  updateRepertoireOrder(userId: string, order: { pieceId: number; displayOrder: number }[]): Promise<void>;
  
  createPost(post: InsertPost): Promise<Post>;
  getUserActivityLog(userId: string, limit?: number): Promise<any[]>;
  deletePost(id: number): Promise<boolean>;
  getPostById(id: number): Promise<Post | undefined>;
  getFeedPosts(userId: string, limit?: number, viewerUserId?: string): Promise<any[]>;
  likePost(postId: number, userId: string): Promise<void>;
  unlikePost(postId: number, userId: string): Promise<void>;
  getPostLikeCount(postId: number): Promise<number>;
  hasUserLikedPost(postId: number, userId: string): Promise<boolean>;
  addPostComment(postId: number, userId: string, content: string): Promise<PostComment>;
  getPostComments(postId: number): Promise<any[]>;
  deletePostComment(id: number): Promise<boolean>;
  getActiveChallenges(): Promise<Challenge[]>;
  getRecordingPosts(limit?: number): Promise<any[]>;
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getFollowing(userId: string): Promise<string[]>;
  getSuggestedUsers(userId: string, limit?: number): Promise<any[]>;
  
  getPieceRatingSummary(pieceId: number): Promise<{ averageRating: number; totalRatings: number }>;
  getPieceComments(pieceId: number): Promise<any[]>;
  getPieceStatusDistribution(pieceId: number): Promise<{ status: string; count: number }[]>;
  
  getPieceAnalysis(pieceId: number): Promise<PieceAnalysis | undefined>;
  savePieceAnalysis(data: InsertPieceAnalysis): Promise<PieceAnalysis>;

  unifiedSearch(query: string): Promise<{
    type: "piece" | "movement";
    composerId: number;
    composerName: string;
    pieceId: number;
    pieceTitle: string;
    movementId: number | null;
    movementName: string | null;
    score: number;
  }[]>;
  searchUsers(query: string, currentUserId: string): Promise<any[]>;
  sendConnectionRequest(requesterId: string, recipientId: string): Promise<Connection>;
  getConnectionBetween(userA: string, userB: string): Promise<Connection | undefined>;
  getConnectionById(id: number): Promise<Connection | undefined>;
  getPendingRequestsReceived(userId: string): Promise<any[]>;
  getPendingRequestsSent(userId: string): Promise<any[]>;
  updateConnectionStatus(connectionId: number, status: "accepted" | "denied"): Promise<Connection>;
  getAcceptedConnections(userId: string): Promise<any[]>;

  // Composer follows
  followComposer(userId: string, composerId: number): Promise<ComposerFollow>;
  unfollowComposer(userId: string, composerId: number): Promise<boolean>;
  isFollowingComposer(userId: string, composerId: number): Promise<boolean>;
  getComposerFollowerCount(composerId: number): Promise<number>;
  getComposerCommunityStats(composerId: number): Promise<{
    followerCount: number;
    activeLearners: number;
    catalogSize: number;
    mostPopularPiece: { id: number; title: string; learnerCount: number } | null;
  }>;
  getComposerComments(composerId: number, limit?: number): Promise<any[]>;
  addComposerComment(composerId: number, userId: string, content: string): Promise<any>;
  getComposerChallenges(composerId: number, limit?: number): Promise<any[]>;
  getComposerPiecesWithCounts(composerId: number): Promise<(Piece & { learnerCount: number })[]>;
  getPieceActivity(pieceId: number, limit?: number): Promise<any[]>;
  getPieceLearners(pieceId: number, limit?: number): Promise<{ userId: string; displayName: string | null; avatarUrl: string | null; status: string }[]>;
  getRelatedPieces(pieceId: number, limit?: number): Promise<{ id: number; title: string; composerName: string; coCount: number }[]>;
  getComposerMembers(composerId: number, limit?: number): Promise<{
    userId: string; displayName: string | null; avatarUrl: string | null; instrument: string | null;
  }[]>;
  getComposerActivity(composerId: number, limit?: number): Promise<any[]>;
  // Pioneer badge queries
  getPioneerStatus(userId: string): Promise<{ pioneerComposers: string[]; pioneerPieces: string[] }>;
  // Communities feed
  getFollowedComposersWithFeed(userId: string): Promise<Array<{
    id: number; name: string; imageUrl: string | null; period: string | null;
    learnerCount: number; followerCount: number; recentActivity: any[];
  }>>;
  getTrendingCommunityData(): Promise<{
    composers: Array<{ id: number; name: string; imageUrl: string | null; period: string | null; learnerCount: number }>;
    pieces:    Array<{ id: number; title: string; composerName: string; composerId: number; learnerCount: number }>;
  }>;

  // Milestones
  getMilestones(userId: string, pieceId: number, movementId?: number | null): Promise<PieceMilestone[]>;
  upsertMilestone(userId: string, pieceId: number, cycleNumber: number, milestoneType: string, achievedAt: string, movementId?: number | null): Promise<PieceMilestone>;
  updateMilestoneDate(id: number, achievedAt: string): Promise<PieceMilestone | undefined>;
  deleteMilestone(id: number): Promise<boolean>;
  startNewCycle(repertoireEntryId: number): Promise<RepertoireEntry | undefined>;
  removeCurrentCycle(repertoireEntryId: number): Promise<RepertoireEntry | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async searchComposers(query: string): Promise<Composer[]> {
    const lastNameOrder = sql`split_part(${composers.name}, ' ', array_length(string_to_array(${composers.name}, ' '), 1))`;
    if (!query.trim()) {
      return db.select().from(composers).orderBy(lastNameOrder);
    }
    const tokens = query.trim().split(/\s+/).filter(Boolean);
    const tokenConditions = tokens.map(t => sql`unaccent(${composers.name}) ILIKE unaccent(${'%' + t + '%'})`);
    const allTokensMatch = sql.join(tokenConditions, sql` AND `);
    const tokenHits = tokens.map(t => sql`CASE WHEN unaccent(${composers.name}) ILIKE unaccent(${'%' + t + '%'}) THEN 1 ELSE 0 END`);
    const tokenScore = sql`(${sql.join(tokenHits, sql` + `)})::float / ${tokens.length}`;
    return db.select().from(composers)
      .where(sql`(${allTokensMatch}) OR word_similarity(unaccent(${query}), unaccent(${composers.name})) > 0.3`)
      .orderBy(sql`GREATEST(word_similarity(unaccent(${query}), unaccent(${composers.name})), ${tokenScore}) DESC`, lastNameOrder);
  }

  async getComposerById(id: number): Promise<Composer | undefined> {
    const [composer] = await db.select().from(composers).where(eq(composers.id, id));
    return composer;
  }

  async createComposer(composer: InsertComposer): Promise<Composer> {
    const [newComposer] = await db.insert(composers).values(composer).returning();
    return newComposer;
  }

  async searchPieces(query: string, composerId?: number): Promise<(Piece & { composerName: string })[]> {
    const selectFields = {
      id: pieces.id,
      title: pieces.title,
      composerId: pieces.composerId,
      instrument: pieces.instrument,
      imslpUrl: pieces.imslpUrl,
      keySignature: pieces.keySignature,
      yearComposed: pieces.yearComposed,
      difficulty: pieces.difficulty,
      composerName: composers.name,
    };

    if (composerId && query.trim()) {
      const tokens = query.trim().split(/\s+/).filter(Boolean);
      const tokenConditions = tokens.map(t => sql`unaccent(${pieces.title}) ILIKE unaccent(${'%' + t + '%'})`);
      const allTokensMatch = sql.join(tokenConditions, sql` AND `);
      const tokenHits = tokens.map(t => sql`CASE WHEN unaccent(${pieces.title}) ILIKE unaccent(${'%' + t + '%'}) THEN 1 ELSE 0 END`);
      const tokenScore = sql`(${sql.join(tokenHits, sql` + `)})::float / ${tokens.length}`;
      return db.select(selectFields).from(pieces)
        .innerJoin(composers, eq(pieces.composerId, composers.id))
        .where(sql`${pieces.composerId} = ${composerId} AND ((${allTokensMatch}) OR word_similarity(unaccent(${query}), unaccent(${pieces.title})) > 0.3)`)
        .orderBy(sql`GREATEST(word_similarity(unaccent(${query}), unaccent(${pieces.title})), ${tokenScore}) DESC`, pieces.title);
    } else if (composerId) {
      return db.select(selectFields).from(pieces)
        .innerJoin(composers, eq(pieces.composerId, composers.id))
        .where(eq(pieces.composerId, composerId));
    } else if (query.trim()) {
      const combined = sql`(${pieces.title} || ' ' || ${composers.name})`;
      const tokens = query.trim().split(/\s+/).filter(Boolean);
      const tokenConditions = tokens.map(t => sql`unaccent(${combined}) ILIKE unaccent(${'%' + t + '%'})`);
      const allTokensMatch = sql.join(tokenConditions, sql` AND `);
      const tokenHits = tokens.map(t => sql`CASE WHEN unaccent(${combined}) ILIKE unaccent(${'%' + t + '%'}) THEN 1 ELSE 0 END`);
      const tokenScore = sql`(${sql.join(tokenHits, sql` + `)})::float / ${tokens.length}`;
      return db.select(selectFields).from(pieces)
        .innerJoin(composers, eq(pieces.composerId, composers.id))
        .where(
          sql`(${allTokensMatch}) OR word_similarity(unaccent(${query}), unaccent(${combined})) > 0.3`
        )
        .orderBy(sql`GREATEST(word_similarity(unaccent(${query}), unaccent(${combined})), ${tokenScore}) DESC`, pieces.title)
        .limit(50);
    }
    return db.select(selectFields).from(pieces)
      .innerJoin(composers, eq(pieces.composerId, composers.id))
      .limit(50);
  }

  async getPieceById(id: number): Promise<Piece | undefined> {
    const [piece] = await db.select().from(pieces).where(eq(pieces.id, id));
    return piece;
  }

  async getPiecesByComposer(composerId: number): Promise<Piece[]> {
    return db.select().from(pieces).where(eq(pieces.composerId, composerId));
  }

  async createPiece(piece: InsertPiece): Promise<Piece> {
    const [newPiece] = await db.insert(pieces).values(piece).returning();
    return newPiece;
  }

  async getMovementsByPiece(pieceId: number): Promise<Movement[]> {
    return db.select().from(movements).where(eq(movements.pieceId, pieceId)).orderBy(movements.id);
  }

  async getMovementById(id: number): Promise<Movement | undefined> {
    const [movement] = await db.select().from(movements).where(eq(movements.id, id));
    return movement;
  }

  async createMovement(movement: InsertMovement): Promise<Movement> {
    const [newMovement] = await db.insert(movements).values(movement).returning();
    return newMovement;
  }

  async getRepertoireByUser(userId: string): Promise<{
    entries: (RepertoireEntry & {
      composerName: string;
      pieceTitle: string;
      movementName: string | null;
      composer_image_url: string | null;
      composer_period: string | null;
      composer_birth_year?: number | null;
      composer_death_year?: number | null;
      hasStartedMilestone: boolean;
      everMilestone: "completed" | "performed" | null;
      performedCount: number;
      movementEverMilestone: "completed" | "performed" | null;
      movementPerformedCount: number;
    })[];
    movementOrderByPiece: Record<number, number[]>;
  }> {
    const results = await db
      .select({
        id: repertoireEntries.id,
        userId: repertoireEntries.userId,
        composerId: repertoireEntries.composerId,
        pieceId: repertoireEntries.pieceId,
        movementId: repertoireEntries.movementId,
        status: repertoireEntries.status,
        startedDate: repertoireEntries.startedDate,
        displayOrder: repertoireEntries.displayOrder,
        progress: repertoireEntries.progress,
        splitView: repertoireEntries.splitView,
        currentCycle: repertoireEntries.currentCycle,
        composerName: composers.name,
        pieceTitle: pieces.title,
        movementName: movements.name,
        composer_image_url: composers.imageUrl,
        composer_period: composers.period,
        composer_birth_year: composers.birthYear,
        composer_death_year: composers.deathYear,
        hasStartedMilestone: sql<boolean>`EXISTS (
          SELECT 1
          FROM ${pieceMilestones} pm
          WHERE pm.user_id = ${userId}
            AND pm.piece_id = ${repertoireEntries.pieceId}
            AND pm.milestone_type = 'started'
        )`,
        everMilestone: sql<"completed" | "performed" | null>`CASE
          WHEN EXISTS (
            SELECT 1
            FROM ${pieceMilestones} pm
            WHERE pm.user_id = ${userId}
              AND pm.piece_id = ${repertoireEntries.pieceId}
              AND pm.movement_id IS NULL
              AND pm.milestone_type LIKE 'performed%'
          ) THEN 'performed'
          WHEN EXISTS (
            SELECT 1
            FROM ${pieceMilestones} pm
            WHERE pm.user_id = ${userId}
              AND pm.piece_id = ${repertoireEntries.pieceId}
              AND pm.movement_id IS NULL
              AND pm.milestone_type = 'completed'
          ) THEN 'completed'
          ELSE NULL
        END`,
        performedCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${pieceMilestones} pm
          WHERE pm.user_id = ${userId}
            AND pm.piece_id = ${repertoireEntries.pieceId}
            AND pm.movement_id IS NULL
            AND pm.milestone_type LIKE 'performed%'
        )::int`,
        movementEverMilestone: sql<"completed" | "performed" | null>`CASE
          WHEN ${repertoireEntries.movementId} IS NULL THEN NULL
          WHEN EXISTS (
            SELECT 1
            FROM ${pieceMilestones} pm
            WHERE pm.user_id = ${userId}
              AND pm.piece_id = ${repertoireEntries.pieceId}
              AND pm.movement_id = ${repertoireEntries.movementId}
              AND pm.milestone_type LIKE 'performed%'
          ) THEN 'performed'
          WHEN EXISTS (
            SELECT 1
            FROM ${pieceMilestones} pm
            WHERE pm.user_id = ${userId}
              AND pm.piece_id = ${repertoireEntries.pieceId}
              AND pm.movement_id = ${repertoireEntries.movementId}
              AND pm.milestone_type = 'completed'
          ) THEN 'completed'
          ELSE NULL
        END`,
        movementPerformedCount: sql<number>`CASE
          WHEN ${repertoireEntries.movementId} IS NULL THEN 0
          ELSE (
            SELECT COUNT(*)
            FROM ${pieceMilestones} pm
            WHERE pm.user_id = ${userId}
              AND pm.piece_id = ${repertoireEntries.pieceId}
              AND pm.movement_id = ${repertoireEntries.movementId}
              AND pm.milestone_type LIKE 'performed%'
          )::int
        END`,
      })
      .from(repertoireEntries)
      .innerJoin(composers, eq(repertoireEntries.composerId, composers.id))
      .innerJoin(pieces, eq(repertoireEntries.pieceId, pieces.id))
      .leftJoin(movements, eq(repertoireEntries.movementId, movements.id))
      .where(eq(repertoireEntries.userId, userId))
      .orderBy(repertoireEntries.displayOrder, repertoireEntries.id);

    const entries = results.map((row) => ({
      ...row,
      status: normalizeRepertoireStatus(row.status),
    }));

    const pieceIds = Array.from(new Set(results.map((r) => r.pieceId)));
    const movementOrderByPiece: Record<number, number[]> = {};
    for (const pieceId of pieceIds) {
      const list = await this.getMovementsByPiece(pieceId);
      movementOrderByPiece[pieceId] = list.map((m) => m.id);
    }

    return { entries, movementOrderByPiece };
  }

  async updateRepertoireOrder(userId: string, order: { pieceId: number; displayOrder: number }[]): Promise<void> {
    await db.transaction(async (tx) => {
      for (const item of order) {
        await tx
          .update(repertoireEntries)
          .set({ displayOrder: item.displayOrder })
          .where(
            and(
              eq(repertoireEntries.userId, userId),
              eq(repertoireEntries.pieceId, item.pieceId)
            )
          );
      }
    });
  }

  async createRepertoireEntry(entry: InsertRepertoireEntry): Promise<RepertoireEntry> {
    entry = { ...entry, status: normalizeRepertoireStatus(entry.status) };
    if (entry.displayOrder === undefined || entry.displayOrder === null) {
      const [maxResult] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${repertoireEntries.displayOrder}), -1)` })
        .from(repertoireEntries)
        .where(eq(repertoireEntries.userId, entry.userId));
      entry = { ...entry, displayOrder: (maxResult?.maxOrder ?? -1) + 1 };
    }
    const [newEntry] = await db.insert(repertoireEntries).values(entry).returning();
    return newEntry;
  }

  async updateRepertoireEntry(id: number, updates: Partial<InsertRepertoireEntry>): Promise<RepertoireEntry | undefined> {
    if (updates.status !== undefined) {
      updates = { ...updates, status: normalizeRepertoireStatus(updates.status) };
    }
    const [updated] = await db.update(repertoireEntries).set(updates).where(eq(repertoireEntries.id, id)).returning();
    return updated;
  }

  async updateRepertoireByPiece(userId: string, pieceId: number, updates: Partial<InsertRepertoireEntry>): Promise<RepertoireEntry[]> {
    if (updates.status !== undefined) {
      updates = { ...updates, status: normalizeRepertoireStatus(updates.status) };
    }
    if (updates.splitView === true) {
      const entries = await db.select().from(repertoireEntries).where(and(eq(repertoireEntries.userId, userId), eq(repertoireEntries.pieceId, pieceId)));
      const wholePieceEntry = entries.find(e => e.movementId === null);
      if (wholePieceEntry && entries.length === 1) {
        const movementList = await this.getMovementsByPiece(pieceId);
        if (movementList.length > 0) {
          const baseOrder = wholePieceEntry.displayOrder;
          for (let i = 0; i < movementList.length; i++) {
            await this.createRepertoireEntry({
              userId,
              composerId: wholePieceEntry.composerId,
              pieceId,
              movementId: movementList[i].id,
              status: wholePieceEntry.status,
              startedDate: wholePieceEntry.startedDate,
              displayOrder: baseOrder + i,
              progress: wholePieceEntry.progress,
              splitView: true,
              currentCycle: wholePieceEntry.currentCycle,
            });
          }
          await this.deleteRepertoireEntry(wholePieceEntry.id);
          const after = await db.select().from(repertoireEntries).where(and(eq(repertoireEntries.userId, userId), eq(repertoireEntries.pieceId, pieceId)));
          return after;
        }
      }
    }
    const updated = await db.update(repertoireEntries)
      .set(updates)
      .where(and(eq(repertoireEntries.userId, userId), eq(repertoireEntries.pieceId, pieceId)))
      .returning();
    return updated;
  }

  async deleteRepertoireEntry(id: number): Promise<boolean> {
    const result = await db.delete(repertoireEntries).where(eq(repertoireEntries.id, id)).returning();
    return result.length > 0;
  }

  async deleteRepertoireByPiece(userId: string, pieceId: number): Promise<boolean> {
    const result = await db.delete(repertoireEntries)
      .where(and(eq(repertoireEntries.userId, userId), eq(repertoireEntries.pieceId, pieceId)))
      .returning();
    return result.length > 0;
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [created] = await db.insert(posts).values(post).returning();
    return created;
  }

  async getUserActivityLog(userId: string, limit: number = 30): Promise<any[]> {
    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        type: posts.type,
        content: posts.content,
        pieceId: posts.pieceId,
        createdAt: posts.createdAt,
        pieceTitle: pieces.title,
        composerName: composers.name,
        likeCount: sql<number>`(SELECT COUNT(*) FROM post_likes WHERE post_id = ${posts.id})::int`,
      })
      .from(posts)
      .leftJoin(pieces, eq(posts.pieceId, pieces.id))
      .leftJoin(composers, eq(pieces.composerId, composers.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    return results;
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id)).returning();
    return result.length > 0;
  }

  async getFeedPosts(userId: string, limit: number = 20, viewerUserId?: string): Promise<any[]> {
    const followingIds = await this.getFollowing(userId);
    const allUserIds = [userId, ...followingIds];
    const viewer = viewerUserId || userId;

    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        type: posts.type,
        content: posts.content,
        pieceId: posts.pieceId,
        recordingUrl: posts.recordingUrl,
        practiceHours: posts.practiceHours,
        createdAt: posts.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        pieceTitle: pieces.title,
        composerName: composers.name,
        likeCount: sql<number>`(SELECT COUNT(*) FROM post_likes WHERE post_id = ${posts.id})::int`,
        userLiked: sql<boolean>`EXISTS(SELECT 1 FROM post_likes WHERE post_id = ${posts.id} AND user_id = ${viewer})`,
        commentCount: sql<number>`(SELECT COUNT(*) FROM post_comments WHERE post_id = ${posts.id})::int`,
      })
      .from(posts)
      .leftJoin(userProfiles, eq(posts.userId, userProfiles.userId))
      .leftJoin(pieces, eq(posts.pieceId, pieces.id))
      .leftJoin(composers, eq(pieces.composerId, composers.id))
      .where(inArray(posts.userId, allUserIds))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return results;
  }

  async likePost(postId: number, userId: string): Promise<void> {
    await db.insert(postLikes).values({ postId, userId }).onConflictDoNothing();
  }

  async unlikePost(postId: number, userId: string): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }

  async getPostLikeCount(postId: number): Promise<number> {
    const [result] = await db.select({ count: count(postLikes.id) }).from(postLikes).where(eq(postLikes.postId, postId));
    return result?.count ?? 0;
  }

  async hasUserLikedPost(postId: number, userId: string): Promise<boolean> {
    const [result] = await db.select().from(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    return !!result;
  }

  async addPostComment(postId: number, userId: string, content: string): Promise<PostComment> {
    const [comment] = await db.insert(postComments).values({ postId, userId, content }).returning();
    return comment;
  }

  async getPostComments(postId: number): Promise<any[]> {
    return db
      .select({
        id: postComments.id,
        postId: postComments.postId,
        userId: postComments.userId,
        content: postComments.content,
        createdAt: postComments.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(postComments)
      .leftJoin(userProfiles, eq(postComments.userId, userProfiles.userId))
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
  }

  async deletePostComment(id: number): Promise<boolean> {
    const result = await db.delete(postComments).where(eq(postComments.id, id)).returning();
    return result.length > 0;
  }

  async getActiveChallenges(): Promise<Challenge[]> {
    return db.select().from(challenges).where(eq(challenges.isActive, true)).orderBy(desc(challenges.createdAt));
  }

  async getRecordingPosts(limit: number = 10): Promise<any[]> {
    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        pieceId: posts.pieceId,
        recordingUrl: posts.recordingUrl,
        createdAt: posts.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        pieceTitle: pieces.title,
        composerName: composers.name,
      })
      .from(posts)
      .leftJoin(userProfiles, eq(posts.userId, userProfiles.userId))
      .leftJoin(pieces, eq(posts.pieceId, pieces.id))
      .leftJoin(composers, eq(pieces.composerId, composers.id))
      .where(eq(posts.type, "recording"))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    
    return results;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [newProfile] = await db.insert(userProfiles).values(profile).returning();
    return newProfile;
  }

  async getFollowing(userId: string): Promise<string[]> {
    const result = await db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, userId));
    return result.map(r => r.followingId);
  }

  async getSuggestedUsers(userId: string, limit: number = 5): Promise<any[]> {
    const followingIds = await this.getFollowing(userId);
    const excludeIds = [userId, ...followingIds];
    
    const results = await db
      .select({
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        instrument: userProfiles.instrument,
        level: userProfiles.level,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(userProfiles)
      .limit(limit + excludeIds.length);
    
    return results.filter(r => !excludeIds.includes(r.userId)).slice(0, limit);
  }

  async getPieceRatingSummary(pieceId: number): Promise<{ averageRating: number; totalRatings: number }> {
    const result = await db
      .select({
        averageRating: avg(pieceRatings.rating),
        totalRatings: count(pieceRatings.id),
      })
      .from(pieceRatings)
      .where(eq(pieceRatings.pieceId, pieceId));
    
    return {
      averageRating: result[0]?.averageRating ? parseFloat(result[0].averageRating) : 0,
      totalRatings: result[0]?.totalRatings ?? 0,
    };
  }

  async getPieceComments(pieceId: number): Promise<any[]> {
    const results = await db
      .select({
        id: pieceComments.id,
        content: pieceComments.content,
        createdAt: pieceComments.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(pieceComments)
      .leftJoin(userProfiles, eq(pieceComments.userId, userProfiles.userId))
      .where(eq(pieceComments.pieceId, pieceId))
      .orderBy(desc(pieceComments.createdAt));
    
    return results;
  }

  async getPieceStatusDistribution(pieceId: number): Promise<{ status: string; count: number }[]> {
    const results = await db
      .select({
        status: repertoireEntries.status,
        count: count(repertoireEntries.id),
      })
      .from(repertoireEntries)
      .where(eq(repertoireEntries.pieceId, pieceId))
      .groupBy(repertoireEntries.status);

    const merged = new Map<string, number>();
    for (const row of results) {
      const normalized = normalizeRepertoireStatus(row.status);
      merged.set(normalized, (merged.get(normalized) ?? 0) + row.count);
    }

    return Array.from(merged.entries()).map(([status, count]) => ({ status, count }));
  }
  async getPieceAnalysis(pieceId: number): Promise<PieceAnalysis | undefined> {
    const [analysis] = await db.select().from(pieceAnalyses).where(eq(pieceAnalyses.pieceId, pieceId));
    return analysis;
  }

  async savePieceAnalysis(data: InsertPieceAnalysis): Promise<PieceAnalysis> {
    const [analysis] = await db
      .insert(pieceAnalyses)
      .values(data)
      .onConflictDoUpdate({
        target: pieceAnalyses.pieceId,
        set: { analysis: data.analysis, wikiUrl: data.wikiUrl },
      })
      .returning();
    return analysis;
  }

  async unifiedSearch(query: string): Promise<{
    type: "piece" | "movement";
    composerId: number;
    composerName: string;
    pieceId: number;
    pieceTitle: string;
    movementId: number | null;
    movementName: string | null;
    score: number;
  }[]> {
    if (!query.trim()) return [];

    const tokens = query.trim().split(/\s+/).filter(Boolean);
    const pieceCombined = sql`(${pieces.title} || ' ' || ${composers.name})`;
    const pieceTokenConditions = tokens.map(t => sql`unaccent(${pieceCombined}) ILIKE unaccent(${'%' + t + '%'})`);
    const pieceAllTokensMatch = sql.join(pieceTokenConditions, sql` AND `);
    const pieceTokenHits = tokens.map(t => sql`CASE WHEN unaccent(${pieceCombined}) ILIKE unaccent(${'%' + t + '%'}) THEN 1 ELSE 0 END`);
    const pieceTokenScore = sql`(${sql.join(pieceTokenHits, sql` + `)})::float / ${tokens.length}`;

    const mvtCombined = sql`(${movements.name} || ' ' || ${pieces.title} || ' ' || ${composers.name})`;
    const mvtTokenConditions = tokens.map(t => sql`unaccent(${mvtCombined}) ILIKE unaccent(${'%' + t + '%'})`);
    const mvtAllTokensMatch = sql.join(mvtTokenConditions, sql` AND `);
    const mvtTokenHits = tokens.map(t => sql`CASE WHEN unaccent(${mvtCombined}) ILIKE unaccent(${'%' + t + '%'}) THEN 1 ELSE 0 END`);
    const mvtTokenScore = sql`(${sql.join(mvtTokenHits, sql` + `)})::float / ${tokens.length}`;

    const [pieceResults, movementResults] = await Promise.all([
      db.select({
        composerId: pieces.composerId,
        composerName: composers.name,
        pieceId: pieces.id,
        pieceTitle: pieces.title,
        score: sql<number>`GREATEST(word_similarity(unaccent(${query}), unaccent(${pieceCombined})), ${pieceTokenScore})`,
      })
        .from(pieces)
        .innerJoin(composers, eq(pieces.composerId, composers.id))
        .where(sql`(${pieceAllTokensMatch}) OR word_similarity(unaccent(${query}), unaccent(${pieceCombined})) > 0.3`)
        .orderBy(sql`GREATEST(word_similarity(unaccent(${query}), unaccent(${pieceCombined})), ${pieceTokenScore}) DESC`)
        .limit(15),
      db.select({
        composerId: pieces.composerId,
        composerName: composers.name,
        pieceId: pieces.id,
        pieceTitle: pieces.title,
        movementId: movements.id,
        movementName: movements.name,
        score: sql<number>`GREATEST(word_similarity(unaccent(${query}), unaccent(${mvtCombined})), ${mvtTokenScore})`,
      })
        .from(movements)
        .innerJoin(pieces, eq(movements.pieceId, pieces.id))
        .innerJoin(composers, eq(pieces.composerId, composers.id))
        .where(sql`(${mvtAllTokensMatch}) OR word_similarity(unaccent(${query}), unaccent(${mvtCombined})) > 0.3`)
        .orderBy(sql`GREATEST(word_similarity(unaccent(${query}), unaccent(${mvtCombined})), ${mvtTokenScore}) DESC`)
        .limit(15),
    ]);

    const combined = [
      ...pieceResults.map(r => ({ type: "piece" as const, ...r, movementId: null, movementName: null })),
      ...movementResults.map(r => ({ type: "movement" as const, ...r })),
    ];

    combined.sort((a, b) => b.score - a.score);
    return combined.slice(0, 30);
  }

  async searchUsers(query: string, currentUserId: string): Promise<any[]> {
    if (!query.trim()) return [];
    return db
      .select({
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        instrument: userProfiles.instrument,
        level: userProfiles.level,
        avatarUrl: userProfiles.avatarUrl,
        location: userProfiles.location,
      })
      .from(userProfiles)
      .where(and(
        sql`unaccent(${userProfiles.displayName}) ILIKE unaccent(${'%' + query + '%'}) OR word_similarity(unaccent(${query}), unaccent(${userProfiles.displayName})) > 0.3`,
        ne(userProfiles.userId, currentUserId)
      ))
      .limit(20);
  }

  async sendConnectionRequest(requesterId: string, recipientId: string): Promise<Connection> {
    const existing = await this.getConnectionBetween(requesterId, recipientId);
    if (existing) {
      throw new Error("Connection already exists between these users");
    }
    const [conn] = await db.insert(connections).values({
      requesterId,
      recipientId,
      status: "pending",
    }).returning();
    return conn;
  }

  async getConnectionById(id: number): Promise<Connection | undefined> {
    const [conn] = await db.select().from(connections).where(eq(connections.id, id));
    return conn;
  }

  async getConnectionBetween(userA: string, userB: string): Promise<Connection | undefined> {
    const [conn] = await db.select().from(connections).where(
      or(
        and(eq(connections.requesterId, userA), eq(connections.recipientId, userB)),
        and(eq(connections.requesterId, userB), eq(connections.recipientId, userA))
      )
    );
    return conn;
  }

  async getPendingRequestsReceived(userId: string): Promise<any[]> {
    return db
      .select({
        id: connections.id,
        requesterId: connections.requesterId,
        status: connections.status,
        createdAt: connections.createdAt,
        displayName: userProfiles.displayName,
        instrument: userProfiles.instrument,
        level: userProfiles.level,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(connections)
      .leftJoin(userProfiles, eq(connections.requesterId, userProfiles.userId))
      .where(and(eq(connections.recipientId, userId), eq(connections.status, "pending")));
  }

  async getPendingRequestsSent(userId: string): Promise<any[]> {
    return db
      .select({
        id: connections.id,
        recipientId: connections.recipientId,
        status: connections.status,
        createdAt: connections.createdAt,
        displayName: userProfiles.displayName,
        instrument: userProfiles.instrument,
        level: userProfiles.level,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(connections)
      .leftJoin(userProfiles, eq(connections.recipientId, userProfiles.userId))
      .where(and(eq(connections.requesterId, userId), eq(connections.status, "pending")));
  }

  async updateConnectionStatus(connectionId: number, status: "accepted" | "denied"): Promise<Connection> {
    const [conn] = await db
      .update(connections)
      .set({ status, updatedAt: new Date() })
      .where(eq(connections.id, connectionId))
      .returning();
    return conn;
  }

  async getAcceptedConnections(userId: string): Promise<any[]> {
    const sent = await db
      .select({
        connectionId: connections.id,
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        instrument: userProfiles.instrument,
        level: userProfiles.level,
        avatarUrl: userProfiles.avatarUrl,
        location: userProfiles.location,
      })
      .from(connections)
      .leftJoin(userProfiles, eq(connections.recipientId, userProfiles.userId))
      .where(and(eq(connections.requesterId, userId), eq(connections.status, "accepted")));

    const received = await db
      .select({
        connectionId: connections.id,
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        instrument: userProfiles.instrument,
        level: userProfiles.level,
        avatarUrl: userProfiles.avatarUrl,
        location: userProfiles.location,
      })
      .from(connections)
      .leftJoin(userProfiles, eq(connections.requesterId, userProfiles.userId))
      .where(and(eq(connections.recipientId, userId), eq(connections.status, "accepted")));

    return [...sent, ...received];
  }

  // Composer follows
  async followComposer(userId: string, composerId: number): Promise<ComposerFollow> {
    const [follow] = await db
      .insert(composerFollows)
      .values({ userId, composerId })
      .onConflictDoNothing()
      .returning();
    return follow;
  }

  async unfollowComposer(userId: string, composerId: number): Promise<boolean> {
    const result = await db
      .delete(composerFollows)
      .where(and(eq(composerFollows.userId, userId), eq(composerFollows.composerId, composerId)));
    return (result.rowCount ?? 0) > 0;
  }

  async isFollowingComposer(userId: string, composerId: number): Promise<boolean> {
    const [row] = await db
      .select()
      .from(composerFollows)
      .where(and(eq(composerFollows.userId, userId), eq(composerFollows.composerId, composerId)));
    return !!row;
  }

  async getComposerFollowerCount(composerId: number): Promise<number> {
    const [row] = await db
      .select({ count: count() })
      .from(composerFollows)
      .where(eq(composerFollows.composerId, composerId));
    return row?.count ?? 0;
  }

  async getComposerCommunityStats(composerId: number): Promise<{
    followerCount: number;
    activeLearners: number;
    catalogSize: number;
    mostPopularPiece: { id: number; title: string; learnerCount: number } | null;
  }> {
    const [followerRow, learnersRow, catalogRow, pieceRows] = await Promise.all([
      db.select({ count: count() }).from(composerFollows).where(eq(composerFollows.composerId, composerId)),
      db.select({ count: sql<number>`count(distinct ${repertoireEntries.userId})` })
        .from(repertoireEntries)
        .innerJoin(pieces, eq(repertoireEntries.pieceId, pieces.id))
        .where(eq(pieces.composerId, composerId)),
      db.select({ count: count() }).from(pieces).where(eq(pieces.composerId, composerId)),
      db.select({ id: pieces.id, title: pieces.title, learnerCount: sql<number>`count(${repertoireEntries.id})` })
        .from(pieces)
        .leftJoin(repertoireEntries, eq(pieces.id, repertoireEntries.pieceId))
        .where(eq(pieces.composerId, composerId))
        .groupBy(pieces.id, pieces.title)
        .orderBy(desc(sql`count(${repertoireEntries.id})`))
        .limit(1),
    ]);

    const topPiece = pieceRows[0] ?? null;
    return {
      followerCount: followerRow[0]?.count ?? 0,
      activeLearners: Number(learnersRow[0]?.count ?? 0),
      catalogSize: catalogRow[0]?.count ?? 0,
      mostPopularPiece: topPiece ? { id: topPiece.id, title: topPiece.title, learnerCount: Number(topPiece.learnerCount) } : null,
    };
  }

  async getComposerComments(composerId: number, limit = 8): Promise<any[]> {
    return db
      .select({
        id: composerComments.id,
        userId: composerComments.userId,
        content: composerComments.content,
        createdAt: composerComments.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(composerComments)
      .leftJoin(userProfiles, eq(composerComments.userId, userProfiles.userId))
      .where(eq(composerComments.composerId, composerId))
      .orderBy(desc(composerComments.createdAt))
      .limit(limit);
  }

  async addComposerComment(composerId: number, userId: string, content: string): Promise<any> {
    const [row] = await db
      .insert(composerComments)
      .values({ composerId, userId, content })
      .returning();
    // Re-fetch with profile join
    const [enriched] = await db
      .select({
        id: composerComments.id,
        userId: composerComments.userId,
        content: composerComments.content,
        createdAt: composerComments.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(composerComments)
      .leftJoin(userProfiles, eq(composerComments.userId, userProfiles.userId))
      .where(eq(composerComments.id, row.id));
    return enriched;
  }

  async getComposerChallenges(composerId: number, limit = 3): Promise<any[]> {
    // Find active challenges where the linked piece belongs to this composer
    return db
      .select({
        id: challenges.id,
        title: challenges.title,
        description: challenges.description,
        deadline: challenges.deadline,
        pieceId: challenges.pieceId,
        pieceTitle: pieces.title,
      })
      .from(challenges)
      .leftJoin(pieces, eq(challenges.pieceId, pieces.id))
      .where(
        and(
          eq(challenges.isActive, true),
          or(
            eq(pieces.composerId, composerId),
            // Also include challenges without a pieceId linkage (community-wide)
            sql`${challenges.pieceId} is null`
          )
        )
      )
      .orderBy(desc(challenges.createdAt))
      .limit(limit);
  }

  async getPieceActivity(pieceId: number, limit = 8): Promise<any[]> {
    return db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        postType: posts.type,
        createdAt: posts.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(posts)
      .leftJoin(userProfiles, eq(posts.userId, userProfiles.userId))
      .where(eq(posts.pieceId, pieceId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getPieceLearners(pieceId: number, limit = 8): Promise<{ userId: string; displayName: string | null; avatarUrl: string | null; status: string }[]> {
    return db
      .select({
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        status: repertoireEntries.status,
      })
      .from(repertoireEntries)
      .innerJoin(userProfiles, eq(repertoireEntries.userId, userProfiles.userId))
      .where(eq(repertoireEntries.pieceId, pieceId))
      .limit(limit);
  }

  async getRelatedPieces(pieceId: number, limit = 5): Promise<{ id: number; title: string; composerName: string; coCount: number }[]> {
    const usersWithPiece = db
      .selectDistinct({ userId: repertoireEntries.userId })
      .from(repertoireEntries)
      .where(eq(repertoireEntries.pieceId, pieceId));

    const rows = await db
      .select({
        id: pieces.id,
        title: pieces.title,
        composerName: composers.name,
        coCount: sql<number>`count(distinct ${repertoireEntries.userId})`,
      })
      .from(repertoireEntries)
      .innerJoin(pieces, eq(repertoireEntries.pieceId, pieces.id))
      .innerJoin(composers, eq(pieces.composerId, composers.id))
      .where(and(
        ne(repertoireEntries.pieceId, pieceId),
        inArray(repertoireEntries.userId, usersWithPiece)
      ))
      .groupBy(pieces.id, pieces.title, composers.name)
      .orderBy(desc(sql`count(distinct ${repertoireEntries.userId})`))
      .limit(limit);
    return rows.map(r => ({ ...r, coCount: Number(r.coCount) }));
  }

  async getComposerMembers(composerId: number, limit = 12): Promise<{ userId: string; displayName: string | null; avatarUrl: string | null; instrument: string | null; }[]> {
    const rows = await db
      .selectDistinct({
        userId: userProfiles.userId,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
        instrument: userProfiles.instrument,
      })
      .from(repertoireEntries)
      .innerJoin(pieces, eq(repertoireEntries.pieceId, pieces.id))
      .innerJoin(userProfiles, eq(repertoireEntries.userId, userProfiles.userId))
      .where(eq(pieces.composerId, composerId))
      .limit(limit);
    return rows;
  }

  async getComposerActivity(composerId: number, limit = 10): Promise<any[]> {
    const rows = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        postType: posts.type,
        pieceId: posts.pieceId,
        pieceTitle: pieces.title,
        createdAt: posts.createdAt,
        displayName: userProfiles.displayName,
        avatarUrl: userProfiles.avatarUrl,
      })
      .from(posts)
      .innerJoin(pieces, eq(posts.pieceId, pieces.id))
      .leftJoin(userProfiles, eq(posts.userId, userProfiles.userId))
      .where(and(eq(pieces.composerId, composerId), ne(posts.type, "recording")))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
    return rows;
  }

  // Pioneer status: composer pioneer = first follower; piece pioneer = first post for a piece
  async getPioneerStatus(userId: string): Promise<{ pioneerComposers: string[]; pioneerPieces: string[] }> {
    // Composers where this user was the very first follower
    const followedRows = await db
      .select({ composerId: composerFollows.composerId, composerName: composers.name, followedAt: composerFollows.createdAt })
      .from(composerFollows)
      .innerJoin(composers, eq(composerFollows.composerId, composers.id))
      .where(eq(composerFollows.userId, userId));

    const pioneerComposers: string[] = [];
    for (const row of followedRows) {
      const [first] = await db
        .select({ userId: composerFollows.userId })
        .from(composerFollows)
        .where(eq(composerFollows.composerId, row.composerId))
        .orderBy(composerFollows.createdAt)
        .limit(1);
      if (first?.userId === userId) {
        pioneerComposers.push(row.composerName);
      }
    }

    // Pieces where this user was the first to post (any post type)
    const userPostedPieces = await db
      .select({ pieceId: posts.pieceId, pieceTitle: pieces.title, createdAt: posts.createdAt })
      .from(posts)
      .innerJoin(pieces, eq(posts.pieceId, pieces.id))
      .where(and(eq(posts.userId, userId), sql`${posts.pieceId} is not null`));

    const pioneerPieces: string[] = [];
    const seenPieces = new Set<number>();
    for (const row of userPostedPieces) {
      if (!row.pieceId || seenPieces.has(row.pieceId)) continue;
      seenPieces.add(row.pieceId);
      const [first] = await db
        .select({ userId: posts.userId })
        .from(posts)
        .where(and(eq(posts.pieceId, row.pieceId!), sql`${posts.pieceId} is not null`))
        .orderBy(posts.createdAt)
        .limit(1);
      if (first?.userId === userId) {
        pioneerPieces.push(row.pieceTitle);
      }
    }

    return { pioneerComposers, pioneerPieces };
  }

  async getComposerPiecesWithCounts(composerId: number): Promise<(Piece & { learnerCount: number })[]> {
    const rows = await db
      .select({
        id: pieces.id,
        title: pieces.title,
        composerId: pieces.composerId,
        instrument: pieces.instrument,
        imslpUrl: pieces.imslpUrl,
        keySignature: pieces.keySignature,
        yearComposed: pieces.yearComposed,
        difficulty: pieces.difficulty,
        learnerCount: sql<number>`count(${repertoireEntries.id})`,
      })
      .from(pieces)
      .leftJoin(repertoireEntries, eq(pieces.id, repertoireEntries.pieceId))
      .where(eq(pieces.composerId, composerId))
      .groupBy(pieces.id)
      .orderBy(pieces.title);

    return rows.map(r => ({ ...r, learnerCount: Number(r.learnerCount) }));
  }

  // ── Communities feed ─────────────────────────────────────────────────────────

  async getFollowedComposersWithFeed(userId: string) {
    const followedList = await db
      .select({ id: composers.id, name: composers.name, imageUrl: composers.imageUrl, period: composers.period })
      .from(composerFollows)
      .innerJoin(composers, eq(composerFollows.composerId, composers.id))
      .where(eq(composerFollows.userId, userId))
      .orderBy(composers.name);

    if (followedList.length === 0) return [];

    return Promise.all(followedList.map(async (c) => {
      const [learnerRes, followerRes, activity] = await Promise.all([
        db.select({ count: sql<number>`count(distinct ${repertoireEntries.userId})::int` })
          .from(repertoireEntries).where(eq(repertoireEntries.composerId, c.id)),
        db.select({ count: sql<number>`count(*)::int` })
          .from(composerFollows).where(eq(composerFollows.composerId, c.id)),
        this.getComposerActivity(c.id, 6),
      ]);
      return {
        ...c,
        learnerCount: Number(learnerRes[0]?.count ?? 0),
        followerCount: Number(followerRes[0]?.count ?? 0),
        recentActivity: activity,
      };
    }));
  }

  async getTrendingCommunityData() {
    const [trendingComposers, trendingPieces] = await Promise.all([
      db.select({
        id: composers.id, name: composers.name,
        imageUrl: composers.imageUrl, period: composers.period,
        learnerCount: sql<number>`count(distinct ${repertoireEntries.userId})::int`,
      })
      .from(composers)
      .leftJoin(repertoireEntries, eq(repertoireEntries.composerId, composers.id))
      .groupBy(composers.id, composers.name, composers.imageUrl, composers.period)
      .orderBy(desc(sql`count(distinct ${repertoireEntries.userId})`))
      .limit(8),

      db.select({
        id: pieces.id, title: pieces.title, composerId: pieces.composerId,
        composerName: composers.name,
        learnerCount: sql<number>`count(distinct ${repertoireEntries.userId})::int`,
      })
      .from(pieces)
      .innerJoin(composers, eq(pieces.composerId, composers.id))
      .leftJoin(repertoireEntries, eq(repertoireEntries.pieceId, pieces.id))
      .groupBy(pieces.id, pieces.title, pieces.composerId, composers.name)
      .orderBy(desc(sql`count(distinct ${repertoireEntries.userId})`))
      .limit(8),
    ]);

    return {
      composers: trendingComposers.map(c => ({ ...c, learnerCount: Number(c.learnerCount) })),
      pieces:    trendingPieces.map(p => ({ ...p, learnerCount: Number(p.learnerCount) })),
    };
  }

  // ── Milestones ─────────────────────────────────────────────────────────────

  async getMilestones(userId: string, pieceId: number, movementId?: number | null, allMovements?: boolean): Promise<PieceMilestone[]> {
    const conditions = [eq(pieceMilestones.userId, userId), eq(pieceMilestones.pieceId, pieceId)];
    if (movementId != null) {
      // Filter to a specific movement
      conditions.push(eq(pieceMilestones.movementId, movementId));
    } else if (!allMovements) {
      // Default: only piece-level milestones (no movement)
      conditions.push(sql`${pieceMilestones.movementId} IS NULL`);
    }
    // allMovements=true: return everything (piece-level + all movements)
    const rows = await db
      .select()
      .from(pieceMilestones)
      .where(and(...conditions))
      .orderBy(pieceMilestones.cycleNumber, pieceMilestones.achievedAt, pieceMilestones.createdAt);

    return rows.map((row) => ({
      ...row,
      milestoneType: row.milestoneType.startsWith("performed") ? "performed" : row.milestoneType,
    }));
  }

  async upsertMilestone(
    userId: string,
    pieceId: number,
    cycleNumber: number,
    milestoneType: string,
    achievedAt: string,
    movementId?: number | null,
  ): Promise<PieceMilestone> {
    const movementVal = movementId ?? null;
    if (milestoneType === "performed") {
      const performedType = `performed#${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
      const [row] = await db
        .insert(pieceMilestones)
        .values({ userId, pieceId, movementId: movementVal, cycleNumber, milestoneType: performedType, achievedAt })
        .returning();
      return { ...row, milestoneType: "performed" };
    }

    // Use UPDATE-then-INSERT to avoid ON CONFLICT ambiguity when there are
    // multiple unique constraints on the table (e.g. a stale auto-generated
    // constraint left over from before movement_id was added to the schema).
    // The WHERE clause uses IS NULL for nullable movement_id comparisons.
    const whereCondition = and(
      eq(pieceMilestones.userId, userId),
      eq(pieceMilestones.pieceId, pieceId),
      eq(pieceMilestones.cycleNumber, cycleNumber),
      eq(pieceMilestones.milestoneType, milestoneType),
      movementVal !== null
        ? eq(pieceMilestones.movementId, movementVal)
        : sql`${pieceMilestones.movementId} IS NULL`,
    );
    const [updated] = await db
      .update(pieceMilestones)
      .set({ achievedAt })
      .where(whereCondition)
      .returning();
    if (updated) return updated;
    const [inserted] = await db
      .insert(pieceMilestones)
      .values({ userId, pieceId, movementId: movementVal, cycleNumber, milestoneType, achievedAt })
      .returning();
    return inserted;
  }

  async updateMilestoneDate(id: number, achievedAt: string): Promise<PieceMilestone | undefined> {
    const [row] = await db
      .update(pieceMilestones)
      .set({ achievedAt })
      .where(eq(pieceMilestones.id, id))
      .returning();
    if (!row) return undefined;
    return {
      ...row,
      milestoneType: row.milestoneType.startsWith("performed") ? "performed" : row.milestoneType,
    };
  }

  async deleteMilestone(id: number): Promise<boolean> {
    const result = await db.delete(pieceMilestones).where(eq(pieceMilestones.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async startNewCycle(repertoireEntryId: number): Promise<RepertoireEntry | undefined> {
    const [entry] = await db.select().from(repertoireEntries).where(eq(repertoireEntries.id, repertoireEntryId));
    if (!entry) return undefined;

    const entryWhere = entry.movementId != null
      ? and(eq(repertoireEntries.userId, entry.userId), eq(repertoireEntries.pieceId, entry.pieceId), eq(repertoireEntries.movementId, entry.movementId))
      : and(eq(repertoireEntries.userId, entry.userId), eq(repertoireEntries.pieceId, entry.pieceId));
    const [maxCycleRow] = await db
      .select({ maxCycle: sql<number>`MAX(${repertoireEntries.currentCycle})::int` })
      .from(repertoireEntries)
      .where(entryWhere);

    const nextCycle = (maxCycleRow?.maxCycle ?? entry.currentCycle ?? 1) + 1;
    const updatedRows = await db
      .update(repertoireEntries)
      .set({ currentCycle: nextCycle })
      .where(eq(repertoireEntries.id, repertoireEntryId))
      .returning();
    return updatedRows[0];
  }

  async removeCurrentCycle(repertoireEntryId: number): Promise<RepertoireEntry | undefined> {
    const [entry] = await db.select().from(repertoireEntries).where(eq(repertoireEntries.id, repertoireEntryId));
    if (!entry) return undefined;
    const entryWhere = entry.movementId != null
      ? and(eq(repertoireEntries.userId, entry.userId), eq(repertoireEntries.pieceId, entry.pieceId), eq(repertoireEntries.movementId, entry.movementId))
      : and(eq(repertoireEntries.userId, entry.userId), eq(repertoireEntries.pieceId, entry.pieceId));
    const [maxCycleRow] = await db
      .select({ maxCycle: sql<number>`MAX(${repertoireEntries.currentCycle})::int` })
      .from(repertoireEntries)
      .where(entryWhere);

    const activeCycle = maxCycleRow?.maxCycle ?? entry.currentCycle ?? 1;
    if (activeCycle <= 1) return entry;

    const milestoneWhere = entry.movementId != null
      ? and(eq(pieceMilestones.userId, entry.userId), eq(pieceMilestones.pieceId, entry.pieceId), eq(pieceMilestones.movementId, entry.movementId), eq(pieceMilestones.cycleNumber, activeCycle))
      : and(eq(pieceMilestones.userId, entry.userId), eq(pieceMilestones.pieceId, entry.pieceId), sql`${pieceMilestones.movementId} IS NULL`, eq(pieceMilestones.cycleNumber, activeCycle));

    const updatedRows = await db.transaction(async (tx) => {
      await tx.delete(pieceMilestones).where(milestoneWhere);
      return tx
        .update(repertoireEntries)
        .set({ currentCycle: activeCycle - 1 })
        .where(eq(repertoireEntries.id, repertoireEntryId))
        .returning();
    });

    return updatedRows[0];
  }

}

export const storage = new DatabaseStorage();
