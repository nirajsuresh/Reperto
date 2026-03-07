import { db } from "./db";
import { sql } from "drizzle-orm";
import {
  users, userProfiles, posts, follows, composers, pieces,
  pieceRatings, pieceComments, repertoireEntries, composerFollows, composerComments, pieceMilestones,
} from "@shared/schema";

// ─────────────────────────────────────────────────────────────────────────────
// 15 realistic fake pianists
// ─────────────────────────────────────────────────────────────────────────────

const EXTRA_USERS = [
  { username: "thomas_weber",    password: "password123" },
  { username: "yuki_tanaka",     password: "password123" },
  { username: "isabelle_dupont", password: "password123" },
  { username: "carlos_ruiz",     password: "password123" },
  { username: "anna_kowalski",   password: "password123" },
  { username: "james_hartley",   password: "password123" },
  { username: "priya_sharma",    password: "password123" },
  { username: "lucas_moreau",    password: "password123" },
  { username: "emma_wilson",     password: "password123" },
  { username: "mikhail_volkov",  password: "password123" },
  { username: "li_wei",          password: "password123" },
  { username: "sara_nilsson",    password: "password123" },
  { username: "rafael_santos",   password: "password123" },
  { username: "claire_bernard",  password: "password123" },
  { username: "kai_fischer",     password: "password123" },
];

// ─────────────────────────────────────────────────────────────────────────────
export async function seedExtraUsers() {
  try {
    console.log("Seeding extra users...");

    // ── 0. Schema migrations (idempotent) ────────────────────────────────────
    // Add current_cycle column to repertoire_entries if it doesn't exist
    await db.execute(sql`
      ALTER TABLE repertoire_entries
      ADD COLUMN IF NOT EXISTS current_cycle integer NOT NULL DEFAULT 1
    `);

    // ── 1. Insert users ──────────────────────────────────────────────────────
    const insertedOrExisting = await db
      .insert(users)
      .values(EXTRA_USERS)
      .onConflictDoNothing()
      .returning();

    // Reload all users to build complete map (handles already-existing case)
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.username, u.id]));

    const u = (name: string) => userMap.get(name)!;

    // ── 2. User profiles ─────────────────────────────────────────────────────
    const profileData = [
      { userId: u("thomas_weber"),    displayName: "Thomas Weber",     instrument: "Piano", level: "Professional",      location: "Berlin, Germany",        bio: "Concert pianist at the Berlin Philharmonie. Bach specialist and founder of the Bach Collegium Berlin.", avatarUrl: null },
      { userId: u("yuki_tanaka"),     displayName: "Yuki Tanaka",      instrument: "Piano", level: "Advanced Student",  location: "Tokyo, Japan",           bio: "Student at the Tokyo University of the Arts. Passionate about late Romantic and Impressionist piano writing.", avatarUrl: null },
      { userId: u("isabelle_dupont"), displayName: "Isabelle Dupont",  instrument: "Piano", level: "Serious Amateur",   location: "Lyon, France",           bio: "French literature teacher who has studied piano since childhood. Devoted to Debussy and Ravel above all else.", avatarUrl: null },
      { userId: u("carlos_ruiz"),     displayName: "Carlos Ruiz",      instrument: "Piano", level: "Professional",      location: "Madrid, Spain",          bio: "Performing pianist with a particular love for Chopin and Schubert. Regular guest at the Palacio de la Música.", avatarUrl: null },
      { userId: u("anna_kowalski"),   displayName: "Anna Kowalski",    instrument: "Piano", level: "Serious Amateur",   location: "Warsaw, Poland",         bio: "Pianist and musicologist. Lives and breathes Chopin — learning every étude, nocturne, and ballade.", avatarUrl: null },
      { userId: u("james_hartley"),   displayName: "James Hartley",    instrument: "Piano", level: "Hobbyist",          location: "London, UK",             bio: "Civil engineer by profession, Haydn and Mozart devotee by passion. Daily practice after work keeps me sane.", avatarUrl: null },
      { userId: u("priya_sharma"),    displayName: "Priya Sharma",     instrument: "Piano", level: "Advanced Student",  location: "Mumbai, India",          bio: "Studying piano performance at the National Centre for the Performing Arts. Broad repertoire spanning all eras.", avatarUrl: null },
      { userId: u("lucas_moreau"),    displayName: "Lucas Moreau",     instrument: "Piano", level: "Advanced Student",  location: "Paris, France",          bio: "Conservatoire de Paris student. My heart belongs to the French school — Debussy, Ravel, Messiaen.", avatarUrl: null },
      { userId: u("emma_wilson"),     displayName: "Emma Wilson",      instrument: "Piano", level: "Professional",      location: "New York, USA",          bio: "Manhattan School of Music faculty. Specialise in late Romantic and 20th-century repertoire.", avatarUrl: null },
      { userId: u("mikhail_volkov"),  displayName: "Mikhail Volkov",   instrument: "Piano", level: "Professional",      location: "St. Petersburg, Russia", bio: "Principal pianist with the Mariinsky Orchestra. Rachmaninoff and Prokofiev are in my bones.", avatarUrl: null },
      { userId: u("li_wei"),          displayName: "Li Wei",           instrument: "Piano", level: "Advanced Student",  location: "Shanghai, China",        bio: "Shanghai Conservatory student. Obsessed with Liszt's technical and poetic genius.", avatarUrl: null },
      { userId: u("sara_nilsson"),    displayName: "Sara Nilsson",     instrument: "Piano", level: "Serious Amateur",   location: "Stockholm, Sweden",      bio: "Music teacher and amateur pianist. Grieg and Nordic repertoire alongside the main Romantic canon.", avatarUrl: null },
      { userId: u("rafael_santos"),   displayName: "Rafael Santos",    instrument: "Piano", level: "Hobbyist",          location: "São Paulo, Brazil",      bio: "Architect and weekend pianist. Started late at 35 but making up for lost time with a lot of enthusiasm.", avatarUrl: null },
      { userId: u("claire_bernard"),  displayName: "Claire Bernard",   instrument: "Piano", level: "Professional",      location: "Brussels, Belgium",      bio: "Award-winning recitalist. My life project is performing and recording the complete Chopin catalogue.", avatarUrl: null },
      { userId: u("kai_fischer"),     displayName: "Kai Fischer",      instrument: "Piano", level: "Advanced Student",  location: "Munich, Germany",        bio: "Munich Hochschule für Musik student. Bach counterpoint and Brahms weight are my two obsessions.", avatarUrl: null },
    ].filter(p => p.userId); // skip if userId not found

    await db.insert(userProfiles).values(profileData).onConflictDoNothing();
    console.log(`Upserted ${profileData.length} extra user profiles`);

    // ── 3. Lookup composers & pieces ─────────────────────────────────────────
    const allComposers = await db.select().from(composers);
    const cMap = new Map(allComposers.map(c => [c.name, c.id]));

    const allPieces = await db.select().from(pieces);

    const findPiece = (composerName: string, titleFragment: string) => {
      const cId = cMap.get(composerName);
      if (!cId) return undefined;
      return allPieces.find(p => p.composerId === cId && p.title.toLowerCase().includes(titleFragment.toLowerCase()));
    };

    // Pieces we'll reference
    const p_ballade1   = findPiece("Frédéric Chopin",      "Ballade no. 1");
    const p_ballade4   = findPiece("Frédéric Chopin",      "Ballade no. 4");
    const p_nocturnes9 = findPiece("Frédéric Chopin",      "Nocturnes Op. 9");
    const p_etudes10   = findPiece("Frédéric Chopin",      "Twelve Études Op. 10");
    const p_fantaisie  = findPiece("Frédéric Chopin",      "Fantaisie-Impromptu");
    const p_wtc1       = findPiece("Johann Sebastian Bach","Well-Tempered Clavier, Book 1");
    const p_goldberg   = findPiece("Johann Sebastian Bach","Goldberg Variations");
    const p_moonlight  = findPiece("Ludwig van Beethoven", "Sonata no. 14");
    const p_appas      = findPiece("Ludwig van Beethoven", "Sonata no. 23");
    const p_pathetique = findPiece("Ludwig van Beethoven", "Sonata no. 8");
    const p_berga      = findPiece("Claude Debussy",       "Suite bergamasque");
    const p_preludes1  = findPiece("Claude Debussy",       "Préludes, Book 1");
    const p_images1    = findPiece("Claude Debussy",       "Images, Série 1");
    const p_transcend  = findPiece("Franz Liszt",          "Transcendental Études");
    const p_lisztSon   = findPiece("Franz Liszt",          "Sonata in B minor");
    const p_rach23     = findPiece("Sergei Rachmaninoff",  "Préludes Op. 23");
    const p_rach39     = findPiece("Sergei Rachmaninoff",  "Études-tableaux Op. 39");
    const p_gaspard    = findPiece("Maurice Ravel",        "Gaspard de la nuit");
    const p_miroirs    = findPiece("Maurice Ravel",        "Miroirs");
    const p_scriabin5  = findPiece("Alexander Scriabin",   "Sonata no. 5");
    const p_brahms118  = findPiece("Johannes Brahms",      "Intermezzo");

    // Composer IDs
    const cChopin      = cMap.get("Frédéric Chopin");
    const cBach        = cMap.get("Johann Sebastian Bach");
    const cBeethoven   = cMap.get("Ludwig van Beethoven");
    const cDebussy     = cMap.get("Claude Debussy");
    const cListz       = cMap.get("Franz Liszt");
    const cRach        = cMap.get("Sergei Rachmaninoff");
    const cRavel       = cMap.get("Maurice Ravel");
    const cScriabin    = cMap.get("Alexander Scriabin");
    const cBrahms      = cMap.get("Johannes Brahms");
    const cMozart      = cMap.get("Wolfgang Amadeus Mozart");
    const cProkofiev   = cMap.get("Sergei Prokofiev");
    const cSchubert    = cMap.get("Franz Schubert");

    // ── 4. Composer follows ──────────────────────────────────────────────────
    const composerFollowData: { userId: string; composerId: number }[] = [];
    const addCF = (username: string, composerId: number | undefined) => {
      const uid = u(username);
      if (uid && composerId) composerFollowData.push({ userId: uid, composerId });
    };

    // Thomas — Bach, Beethoven, Brahms, Mozart, Schubert
    addCF("thomas_weber", cBach); addCF("thomas_weber", cBeethoven);
    addCF("thomas_weber", cBrahms); addCF("thomas_weber", cMozart); addCF("thomas_weber", cSchubert);

    // Yuki — Chopin, Scriabin, Ravel, Debussy
    addCF("yuki_tanaka", cChopin); addCF("yuki_tanaka", cScriabin);
    addCF("yuki_tanaka", cRavel);  addCF("yuki_tanaka", cDebussy);

    // Isabelle — Debussy, Ravel
    addCF("isabelle_dupont", cDebussy); addCF("isabelle_dupont", cRavel);
    addCF("isabelle_dupont", cChopin);

    // Carlos — Chopin, Schubert, Liszt, Rachmaninoff
    addCF("carlos_ruiz", cChopin);  addCF("carlos_ruiz", cSchubert);
    addCF("carlos_ruiz", cListz);   addCF("carlos_ruiz", cRach);

    // Anna — Chopin exclusively (+ Scriabin)
    addCF("anna_kowalski", cChopin); addCF("anna_kowalski", cScriabin);

    // James — Mozart, Haydn/Beethoven
    addCF("james_hartley", cMozart); addCF("james_hartley", cBeethoven);
    addCF("james_hartley", cSchubert);

    // Priya — Chopin, Beethoven, Brahms, Debussy
    addCF("priya_sharma", cChopin);  addCF("priya_sharma", cBeethoven);
    addCF("priya_sharma", cBrahms);  addCF("priya_sharma", cDebussy);

    // Lucas — Debussy, Ravel, Scriabin
    addCF("lucas_moreau", cDebussy); addCF("lucas_moreau", cRavel);
    addCF("lucas_moreau", cScriabin);

    // Emma — Rachmaninoff, Prokofiev, Chopin, Beethoven
    addCF("emma_wilson", cRach);     addCF("emma_wilson", cProkofiev);
    addCF("emma_wilson", cChopin);   addCF("emma_wilson", cBeethoven);

    // Mikhail — Rachmaninoff, Prokofiev, Scriabin
    addCF("mikhail_volkov", cRach);    addCF("mikhail_volkov", cProkofiev);
    addCF("mikhail_volkov", cScriabin);

    // Li Wei — Liszt, Chopin, Rachmaninoff
    addCF("li_wei", cListz); addCF("li_wei", cChopin); addCF("li_wei", cRach);

    // Sara — Chopin, Grieg equivalent (Brahms), Schumann not in list so Schubert
    addCF("sara_nilsson", cChopin);  addCF("sara_nilsson", cBrahms);
    addCF("sara_nilsson", cSchubert);

    // Rafael — Chopin, Debussy, Beethoven
    addCF("rafael_santos", cChopin); addCF("rafael_santos", cDebussy);
    addCF("rafael_santos", cBeethoven);

    // Claire — Chopin (deep focus), Liszt
    addCF("claire_bernard", cChopin); addCF("claire_bernard", cListz);
    addCF("claire_bernard", cScriabin);

    // Kai — Bach, Brahms, Beethoven, Schubert
    addCF("kai_fischer", cBach);   addCF("kai_fischer", cBrahms);
    addCF("kai_fischer", cBeethoven); addCF("kai_fischer", cSchubert);

    await db.insert(composerFollows).values(composerFollowData).onConflictDoNothing();
    console.log(`Seeded ${composerFollowData.length} composer follows`);

    // ── 5. Repertoire entries ────────────────────────────────────────────────
    const existingRepertoire = await db.select({ id: repertoireEntries.id }).from(repertoireEntries);
    if (existingRepertoire.length > 25) {
      console.log("Repertoire already rich, skipping extra repertoire seed");
    } else {
      const R: { userId: string; composerId: number; pieceId: number; status: string; startedDate?: string }[] = [];

      const addR = (username: string, composerId: number | undefined, piece: typeof p_ballade1, status: string, startedDate?: string) => {
        const uid = u(username);
        if (uid && composerId && piece) R.push({ userId: uid, composerId, pieceId: piece.id, status, ...(startedDate ? { startedDate } : {}) });
      };

      // thomas_weber: Bach + Beethoven + Brahms scholar
      addR("thomas_weber", cBach,     p_wtc1,      "Performance-ready", "2021-03-01");
      addR("thomas_weber", cBach,     p_goldberg,  "Polishing",         "2024-09-15");
      addR("thomas_weber", cBeethoven, p_appas,    "Performance-ready", "2022-06-10");
      addR("thomas_weber", cBeethoven, p_pathetique,"Learned",           "2020-01-01");
      addR("thomas_weber", cBrahms,   p_brahms118, "In Progress",       "2025-10-01");

      // yuki_tanaka: Chopin + Scriabin + Impressionist
      addR("yuki_tanaka", cChopin,   p_ballade1,  "In Progress",       "2025-07-01");
      addR("yuki_tanaka", cChopin,   p_etudes10,  "In Progress",          "2025-01-15");
      addR("yuki_tanaka", cScriabin, p_scriabin5, "Performance-ready", "2024-05-20");
      addR("yuki_tanaka", cRavel,    p_miroirs,   "Polishing",         "2024-11-01");
      addR("yuki_tanaka", cDebussy,  p_berga,     "Learned",           "2023-08-01");
      addR("yuki_tanaka", cDebussy,  p_images1,   "Want to learn");

      // isabelle_dupont: Debussy / Ravel devotee
      addR("isabelle_dupont", cDebussy, p_berga,    "Performance-ready", "2022-04-01");
      addR("isabelle_dupont", cDebussy, p_preludes1,"Polishing",         "2024-03-01");
      addR("isabelle_dupont", cRavel,   p_miroirs,  "In Progress",       "2025-06-01");
      addR("isabelle_dupont", cChopin,  p_nocturnes9,"Want to learn");

      // carlos_ruiz: Romantic generalist
      addR("carlos_ruiz", cChopin,  p_ballade1,  "Performance-ready", "2021-09-01");
      addR("carlos_ruiz", cChopin,  p_ballade4,  "Polishing",         "2024-07-15");
      addR("carlos_ruiz", cListz,   p_lisztSon,  "In Progress",       "2025-08-01");
      addR("carlos_ruiz", cRach,    p_rach23,    "Learned",           "2023-03-01");
      addR("carlos_ruiz", cSchubert, p_wtc1,     "Want to learn");    // placeholder - Schubert piece handled gracefully

      // anna_kowalski: Chopin completist
      addR("anna_kowalski", cChopin, p_ballade1,  "Performance-ready", "2020-11-01");
      addR("anna_kowalski", cChopin, p_ballade4,  "Performance-ready", "2022-03-15");
      addR("anna_kowalski", cChopin, p_etudes10,  "Performance-ready", "2021-06-01");
      addR("anna_kowalski", cChopin, p_nocturnes9,"Performance-ready", "2019-09-01");
      addR("anna_kowalski", cChopin, p_fantaisie, "Performance-ready", "2018-01-01");
      addR("anna_kowalski", cScriabin, p_scriabin5,"In Progress",      "2025-11-01");

      // james_hartley: hobbyist, Classical focus
      addR("james_hartley", cBeethoven, p_moonlight,"In Progress",     "2025-04-01");
      addR("james_hartley", cBeethoven, p_pathetique,"Want to learn");
      addR("james_hartley", cMozart,    p_wtc1,     "Want to learn");  // placeholder

      // priya_sharma: broad repertoire
      addR("priya_sharma", cChopin,   p_nocturnes9,"Polishing",        "2024-08-01");
      addR("priya_sharma", cBeethoven,p_moonlight, "Performance-ready","2023-02-01");
      addR("priya_sharma", cBeethoven,p_appas,     "In Progress",         "2025-09-01");
      addR("priya_sharma", cBrahms,   p_brahms118, "Want to learn");
      addR("priya_sharma", cDebussy,  p_berga,     "In Progress",      "2025-05-01");

      // lucas_moreau: Debussy / Ravel / Scriabin
      addR("lucas_moreau", cDebussy, p_preludes1, "Performance-ready", "2023-10-01");
      addR("lucas_moreau", cDebussy, p_images1,   "Performance-ready", "2022-07-01");
      addR("lucas_moreau", cRavel,   p_gaspard,   "In Progress",          "2025-10-15");
      addR("lucas_moreau", cRavel,   p_miroirs,   "Polishing",         "2024-12-01");
      addR("lucas_moreau", cScriabin,p_scriabin5, "Want to learn");

      // emma_wilson: Romantic / Modern professional
      addR("emma_wilson", cRach,     p_rach39,    "Performance-ready", "2022-01-01");
      addR("emma_wilson", cRach,     p_rach23,    "Learned",           "2020-05-01");
      addR("emma_wilson", cProkofiev,p_scriabin5, "In Progress",       "2025-07-01"); // prokofiev lookup fallback
      addR("emma_wilson", cChopin,   p_ballade1,  "Performance-ready", "2021-04-01");
      addR("emma_wilson", cBeethoven,p_appas,     "Learned",           "2019-08-01");

      // mikhail_volkov: Russian heavyweights
      addR("mikhail_volkov", cRach,    p_rach39,    "Performance-ready", "2020-03-01");
      addR("mikhail_volkov", cRach,    p_rach23,    "Performance-ready", "2018-06-01");
      addR("mikhail_volkov", cScriabin,p_scriabin5, "Learned",           "2019-11-01");
      addR("mikhail_volkov", cChopin,  p_etudes10,  "Performance-ready", "2017-09-01");

      // li_wei: Liszt / Chopin virtuoso student
      addR("li_wei", cListz,  p_transcend, "In Progress",       "2025-03-01");
      addR("li_wei", cListz,  p_lisztSon,  "Want to learn");
      addR("li_wei", cChopin, p_etudes10,  "Polishing",         "2024-10-01");
      addR("li_wei", cChopin, p_ballade1,  "Performance-ready", "2024-01-15");
      addR("li_wei", cRach,   p_rach39,    "In Progress",          "2025-09-01");

      // sara_nilsson: Romantic amateur
      addR("sara_nilsson", cChopin,   p_nocturnes9,"Performance-ready","2023-05-01");
      addR("sara_nilsson", cChopin,   p_ballade1,  "Polishing",        "2024-11-01");
      addR("sara_nilsson", cBrahms,   p_brahms118, "In Progress",      "2025-08-01");
      addR("sara_nilsson", cSchubert, p_wtc1,      "Want to learn");

      // rafael_santos: enthusiastic hobbyist
      addR("rafael_santos", cChopin,   p_nocturnes9,"In Progress",     "2025-06-01");
      addR("rafael_santos", cDebussy,  p_berga,     "In Progress",         "2025-10-01");
      addR("rafael_santos", cBeethoven,p_moonlight, "Want to learn");

      // claire_bernard: Chopin completist professional
      addR("claire_bernard", cChopin, p_ballade1,   "Performance-ready", "2016-09-01");
      addR("claire_bernard", cChopin, p_ballade4,   "Performance-ready", "2017-03-01");
      addR("claire_bernard", cChopin, p_etudes10,   "Performance-ready", "2015-01-01");
      addR("claire_bernard", cChopin, p_nocturnes9, "Performance-ready", "2014-06-01");
      addR("claire_bernard", cChopin, p_fantaisie,  "Performance-ready", "2013-11-01");
      addR("claire_bernard", cListz,  p_lisztSon,   "Polishing",         "2025-01-01");

      // kai_fischer: Bach / Brahms / Beethoven scholar
      addR("kai_fischer", cBach,     p_wtc1,      "Performance-ready", "2023-01-01");
      addR("kai_fischer", cBach,     p_goldberg,  "In Progress",       "2025-08-01");
      addR("kai_fischer", cBrahms,   p_brahms118, "Polishing",         "2025-02-01");
      addR("kai_fischer", cBeethoven,p_appas,     "In Progress",       "2025-10-01");
      addR("kai_fischer", cBeethoven,p_moonlight, "Learned",           "2022-09-01");

      // Filter out any nulls from missing piece/composer lookups
      const validR = R.filter(r => r.userId && r.composerId && r.pieceId);
      if (validR.length > 0) {
        await db.insert(repertoireEntries).values(
          validR.map((r, i) => ({ ...r, displayOrder: i, progress: 0, splitView: false }))
        );
        console.log(`Seeded ${validR.length} extra repertoire entries`);
      }
    }

    // ── 6. Posts ─────────────────────────────────────────────────────────────
    const existingPosts = await db.select({ id: posts.id }).from(posts);
    if (existingPosts.length > 20) {
      console.log("Posts already rich, skipping extra post seed");
    } else {
      const P: { userId: string; type: string; content: string; pieceId?: number; practiceHours?: number; recordingUrl?: string }[] = [];
      const addP = (username: string, type: string, content: string, extra?: { pieceId?: number; practiceHours?: number; recordingUrl?: string }) => {
        const uid = u(username);
        if (uid) P.push({ userId: uid, type, content, ...extra });
      };

      // thomas_weber
      addP("thomas_weber", "status_change", "Finally nailed the Art of Fugue-level counterpoint in WTC Book 1. Performance-ready!", { pieceId: p_wtc1?.id });
      addP("thomas_weber", "practice_log",  "Six hours on the Goldberg Variations today — focusing on the French overture and the canon at the 9th.", { pieceId: p_goldberg?.id, practiceHours: 6 });
      addP("thomas_weber", "text",          "Anyone know a good Urtext edition of the Goldberg Variations that preserves Bach's own ornament table? The Bärenreiter is my go-to but curious about alternatives.");

      // yuki_tanaka
      addP("yuki_tanaka", "status_change", "Scriabin Sonata No. 5 is now performance-ready. The mystical vortex of it never gets old.", { pieceId: p_scriabin5?.id });
      addP("yuki_tanaka", "practice_log",  "Deep dive into the Étude Op. 10 No. 5 (the 'Black Keys') today. Keeping the wrist supple is everything.", { pieceId: p_etudes10?.id, practiceHours: 2 });
      addP("yuki_tanaka", "recording",     "My Ravel Miroirs recording — still rough around the edges but I'm happy with the atmosphere.", { pieceId: p_miroirs?.id, recordingUrl: "https://example.com/yuki-miroirs" });

      // isabelle_dupont
      addP("isabelle_dupont", "status_change", "Debussy Suite bergamasque is performance-ready at last! Six years of revisiting Clair de lune and it finally feels right.", { pieceId: p_berga?.id });
      addP("isabelle_dupont", "text",          "Ravel's Miroirs is quietly one of the most demanding pieces in the French repertoire. 'Alborada del gracioso' alone took me a year.");
      addP("isabelle_dupont", "practice_log",  "Working through the Debussy Préludes Book 1 — 'La cathédrale engloutie' sounding huge today.", { pieceId: p_preludes1?.id, practiceHours: 3 });

      // carlos_ruiz
      addP("carlos_ruiz", "status_change", "Chopin Ballade No. 1 back in repertoire after a brief hiatus. The G minor gravity never leaves.", { pieceId: p_ballade1?.id });
      addP("carlos_ruiz", "practice_log",  "Three hours on the Liszt B minor Sonata's exposition. The architecture of this piece is staggering.", { pieceId: p_lisztSon?.id, practiceHours: 3 });
      addP("carlos_ruiz", "text",          "Strong opinion: the Rachmaninoff Préludes Op. 23 are criminally underplayed. Op. 23 No. 5 in G minor is as dramatic as anything in the repertoire.");

      // anna_kowalski
      addP("anna_kowalski", "milestone",    "Completed the full set of Chopin Études Op. 10! Three years of work. Now I start Op. 25.", { practiceHours: 1095 });
      addP("anna_kowalski", "status_change","Chopin Ballade No. 4 — performance-ready. The coda still makes my hands shake every single time.", { pieceId: p_ballade4?.id });
      addP("anna_kowalski", "recording",    "Chopin Ballade No. 1 from my recent Warsaw recital. First time performing it publicly.", { pieceId: p_ballade1?.id, recordingUrl: "https://example.com/anna-ballade1" });
      addP("anna_kowalski", "text",         "Chopin's Nocturne Op. 9 No. 2 is where I always send beginners who ask about Chopin. Infinite depth in a simple melody.");

      // james_hartley
      addP("james_hartley", "status_change","Started the Moonlight Sonata! My teacher always said to wait until I was ready — I think 40 was the right age.", { pieceId: p_moonlight?.id });
      addP("james_hartley", "text",          "Genuinely underrated: Beethoven's Pathétique Sonata second movement. More emotional depth per bar than almost anything I've studied.");

      // priya_sharma
      addP("priya_sharma", "status_change", "Beethoven 'Moonlight' Sonata is now performance-ready. The first movement especially feels deeply personal now.", { pieceId: p_moonlight?.id });
      addP("priya_sharma", "practice_log",  "Two-hour session on the Chopin Nocturnes Op. 9 — the ornamental right-hand lines in No. 1 are deceptively difficult to keep musical.", { pieceId: p_nocturnes9?.id, practiceHours: 2 });
      addP("priya_sharma", "text",          "The Appassionata Sonata's first movement recap is one of Beethoven's most electrifying moments. Currently deep in learning mode.");

      // lucas_moreau
      addP("lucas_moreau", "status_change", "Debussy Préludes Book 1 — performance-ready after two years. 'Des pas sur la neige' is still the one that moves me most.", { pieceId: p_preludes1?.id });
      addP("lucas_moreau", "practice_log",  "On the Ravel Gaspard today. 'Ondine' is flowing now but Scarbo remains a monster. The tempo I want is still 20 bpm away.", { pieceId: p_gaspard?.id, practiceHours: 4 });
      addP("lucas_moreau", "text",          "Hot take: Ravel's Miroirs contains five more individual worlds than most complete piano sonatas. 'Oiseaux tristes' is heartbreaking.");

      // emma_wilson
      addP("emma_wilson", "status_change", "Rachmaninoff Études-tableaux Op. 39 — performance-ready. No. 5 in E-flat minor is the crown jewel.", { pieceId: p_rach39?.id });
      addP("emma_wilson", "practice_log",  "Working with students on Chopin Ballade No. 1 this week — teaching it is making me hear details I missed in my own learning.", { pieceId: p_ballade1?.id, practiceHours: 3 });
      addP("emma_wilson", "text",          "The Prokofiev War Sonatas are essential for understanding the 20th century piano. Sonata No. 7 especially — nothing prepares you for the final Precipitato.");

      // mikhail_volkov
      addP("mikhail_volkov", "milestone",    "Celebrating my 2000th hour of practice logged on Reperto. Mostly Rachmaninoff and Prokofiev.", { practiceHours: 2000 });
      addP("mikhail_volkov", "status_change","Rachmaninoff Études-tableaux Op. 39 — entire set performance-ready. A life's work.", { pieceId: p_rach39?.id });
      addP("mikhail_volkov", "text",         "Unpopular opinion: Rachmaninoff's Préludes Op. 23 are more interesting than the Op. 32. The G minor, D major, and B minor alone justify this claim.");

      // li_wei
      addP("li_wei", "status_change", "Chopin Ballade No. 1 — performance-ready! After four years of preparation. The modulations in the development section finally sound inevitable.", { pieceId: p_ballade1?.id });
      addP("li_wei", "practice_log",  "Eight hours on Liszt Transcendental Études No. 10 'Appassionata'. My endurance is the real test.", { pieceId: p_transcend?.id, practiceHours: 8 });
      addP("li_wei", "recording",     "Excerpt from my Chopin Études Op. 10 practice — No. 1 in C major (Waterfall). Still polishing the final bars.", { pieceId: p_etudes10?.id, recordingUrl: "https://example.com/li-etude1" });

      // sara_nilsson
      addP("sara_nilsson", "status_change", "Chopin Nocturnes Op. 9 — finally feel performance-ready on these. What a journey.", { pieceId: p_nocturnes9?.id });
      addP("sara_nilsson", "practice_log",  "Slow Saturday with the Brahms Intermezzo. The middle section's inner voices are finally singing.", { pieceId: p_brahms118?.id, practiceHours: 2 });
      addP("sara_nilsson", "text",          "The Chopin Ballade No. 1 is the piece I've listened to most in my life. Hearing my own version start to take shape after years is surreal.");

      // rafael_santos
      addP("rafael_santos", "status_change","Added Debussy Suite bergamasque to my repertoire. Clair de lune was actually what made me start piano at 35!", { pieceId: p_berga?.id });
      addP("rafael_santos", "text",          "Beethoven's Moonlight Sonata third movement: am I the only one who thinks it's more terrifying than the first two combined?");

      // claire_bernard
      addP("claire_bernard", "milestone",    "Recording session complete — Chopin Études Op. 10 in the can. Release planned for autumn.", { practiceHours: 5000 });
      addP("claire_bernard", "status_change","Chopin Ballade No. 1 — returning to this masterpiece for my new recording. Every note still reveals something new.", { pieceId: p_ballade1?.id });
      addP("claire_bernard", "practice_log", "Full run-through of the Liszt B minor Sonata today in preparation for Brussels. The architecture feels solid now.", { pieceId: p_lisztSon?.id, practiceHours: 5 });
      addP("claire_bernard", "text",         "Chopin's harmonic language in the Ballade No. 4 is more forward-looking than almost anything until Debussy. The ambiguity of the opening is extraordinary.");

      // kai_fischer
      addP("kai_fischer", "status_change", "Bach WTC Book 1 — performance-ready for my degree recital. Six months of focused work.", { pieceId: p_wtc1?.id });
      addP("kai_fischer", "practice_log",  "Deep in the Goldberg Variations. Variation 25 (the Aria adagio) took three hours today — the chromaticism is unforgiving.", { pieceId: p_goldberg?.id, practiceHours: 3 });
      addP("kai_fischer", "text",          "The Brahms Intermezzo Op. 118 No. 2 is one of the most emotionally concentrated pieces in the repertoire. A whole world in six minutes.");

      if (P.length > 0) {
        await db.insert(posts).values(P);
        console.log(`Seeded ${P.length} extra posts`);
      }
    }

    // ── 7. Piece ratings ─────────────────────────────────────────────────────
    const ratingRows: { pieceId: number; userId: string; rating: number }[] = [];
    const addRating = (username: string, piece: typeof p_ballade1, rating: number) => {
      const uid = u(username);
      if (uid && piece) ratingRows.push({ userId: uid, pieceId: piece.id, rating });
    };

    // Ballade No. 1 — heavy ratings (the flagship piece)
    addRating("thomas_weber",    p_ballade1, 5);
    addRating("yuki_tanaka",     p_ballade1, 5);
    addRating("carlos_ruiz",     p_ballade1, 5);
    addRating("anna_kowalski",   p_ballade1, 5);
    addRating("james_hartley",   p_ballade1, 4);
    addRating("priya_sharma",    p_ballade1, 5);
    addRating("emma_wilson",     p_ballade1, 5);
    addRating("li_wei",          p_ballade1, 5);
    addRating("sara_nilsson",    p_ballade1, 5);
    addRating("claire_bernard",  p_ballade1, 5);
    addRating("mikhail_volkov",  p_ballade1, 4);
    addRating("rafael_santos",   p_ballade1, 4);
    addRating("kai_fischer",     p_ballade1, 5);
    addRating("lucas_moreau",    p_ballade1, 4);
    addRating("isabelle_dupont", p_ballade1, 5);

    // Moonlight Sonata
    addRating("thomas_weber",    p_moonlight, 5);
    addRating("james_hartley",   p_moonlight, 5);
    addRating("priya_sharma",    p_moonlight, 5);
    addRating("rafael_santos",   p_moonlight, 5);
    addRating("anna_kowalski",   p_moonlight, 4);
    addRating("sara_nilsson",    p_moonlight, 5);
    addRating("yuki_tanaka",     p_moonlight, 4);
    addRating("carlos_ruiz",     p_moonlight, 5);
    addRating("kai_fischer",     p_moonlight, 4);

    // Suite bergamasque (Clair de lune)
    addRating("isabelle_dupont", p_berga, 5);
    addRating("lucas_moreau",    p_berga, 5);
    addRating("yuki_tanaka",     p_berga, 5);
    addRating("rafael_santos",   p_berga, 5);
    addRating("priya_sharma",    p_berga, 4);
    addRating("sara_nilsson",    p_berga, 5);
    addRating("carlos_ruiz",     p_berga, 4);
    addRating("anna_kowalski",   p_berga, 4);

    // Gaspard de la nuit
    addRating("lucas_moreau",    p_gaspard, 5);
    addRating("isabelle_dupont", p_gaspard, 5);
    addRating("emma_wilson",     p_gaspard, 5);
    addRating("mikhail_volkov",  p_gaspard, 4);
    addRating("claire_bernard",  p_gaspard, 5);

    // Transcendental Études
    addRating("li_wei",         p_transcend, 5);
    addRating("claire_bernard", p_transcend, 5);
    addRating("carlos_ruiz",    p_transcend, 4);
    addRating("anna_kowalski",  p_transcend, 5);
    addRating("emma_wilson",    p_transcend, 5);

    // Chopin Études Op. 10
    addRating("anna_kowalski",  p_etudes10, 5);
    addRating("claire_bernard", p_etudes10, 5);
    addRating("yuki_tanaka",    p_etudes10, 5);
    addRating("li_wei",         p_etudes10, 5);
    addRating("carlos_ruiz",    p_etudes10, 5);
    addRating("mikhail_volkov", p_etudes10, 5);

    // WTC Book 1
    addRating("thomas_weber",  p_wtc1, 5);
    addRating("kai_fischer",   p_wtc1, 5);
    addRating("priya_sharma",  p_wtc1, 4);
    addRating("james_hartley", p_wtc1, 5);

    await db.insert(pieceRatings).values(ratingRows).onConflictDoNothing();
    console.log(`Seeded ${ratingRows.length} piece ratings`);

    // ── 8. Piece comments ────────────────────────────────────────────────────
    const existingComments = await db.select({ id: pieceComments.id }).from(pieceComments);
    if (existingComments.length > 10) {
      console.log("Comments already rich, skipping");
    } else {
      const comments: { pieceId: number; userId: string; content: string }[] = [];
      const addComment = (username: string, piece: typeof p_ballade1, content: string) => {
        const uid = u(username);
        if (uid && piece) comments.push({ userId: uid, pieceId: piece.id, content });
      };

      // Ballade No. 1 comments
      addComment("claire_bernard",  p_ballade1, "The Ballade No. 1 is where Chopin's formal architecture reaches its peak. The way the coda emerges from the recapitulation is inevitable and devastating. I've performed it over 50 times and still feel nervous before the final page.");
      addComment("anna_kowalski",   p_ballade1, "Chopin must have been thinking of Mickiewicz's Konrad Wallenrod when he wrote this — the sense of heroism crumbling into tragedy is so visceral. The shift to A major in the second theme is one of the most beautiful moments in all of piano music.");
      addComment("carlos_ruiz",     p_ballade1, "The opening is deceptively gentle. I've heard pianists rush it, but the rhythmic ambiguity (is it in 3 or in 6?) is the whole point. Cortot's recording still teaches me something new each time.");
      addComment("li_wei",          p_ballade1, "Technically the coda is not the hardest passage but it is the most demanding emotionally. You have to be completely present or it disintegrates. Four years to get it right and I still approach it with respect every time.");
      addComment("emma_wilson",     p_ballade1, "I use this piece in my teaching to explain the difference between difficulty and depth. Students can learn the notes in a year. Understanding what the notes mean takes a decade. Essential Chopin.");
      addComment("mikhail_volkov",  p_ballade1, "The Ballade No. 1 is the reason I became a pianist. Hearing Pollini's recording at age 8 changed everything. Now it's the first piece I assign serious students.");

      // Moonlight Sonata comments
      addComment("thomas_weber",    p_moonlight, "The 'Moonlight' title is Rellstab's invention, not Beethoven's. He called it 'quasi una fantasia' — almost a fantasy. The first movement is a funeral march, not moonlight on a lake. Once you hear it that way you cannot unhear it.");
      addComment("james_hartley",   p_moonlight, "Started this at 40 after 30 years away from piano. The first movement is meditative in a way that made me fall back in love with music. The third movement will have to wait another decade!");
      addComment("priya_sharma",    p_moonlight, "The Sonata is three movements with a narrative arc: grief, a moment of grace, then rage. The Adagio sostenuto has to breathe like you're holding back tears. It took years before I could play it without rushing.");
      addComment("rafael_santos",   p_moonlight, "The reason I started piano. I know that's a cliché but it's genuinely true. The first movement is meditative in a way I've never found in any other piece.");

      // Suite bergamasque comments
      addComment("isabelle_dupont", p_berga, "Clair de lune is surrounded by three other masterpieces that nobody plays. The Prélude, Menuet, and Passepied are all extraordinary. If you only know Clair de lune you're missing three-quarters of the suite.");
      addComment("lucas_moreau",    p_berga, "The Suite bergamasque marks the beginning of Debussy's mature style even though it was written earlier. The harmonic language of the Passepied especially points directly to the Préludes. Essential for understanding the evolution of French piano music.");
      addComment("rafael_santos",   p_berga, "Clair de lune is the reason I started piano at 35. No regrets whatsoever. If it took a late start to find this music I would do it the same way again.");

      // Gaspard comments
      addComment("lucas_moreau",    p_gaspard, "Ravel said he wanted Scarbo to be harder than Balakirev's Islamey. He succeeded. But Le Gibet is the movement that separates good pianists from great ones. That Bb ostinato must never draw attention to itself even as everything else shifts around it. Impossibly difficult.");
      addComment("isabelle_dupont", p_gaspard, "I've been working on Ondine for two years and it still sounds like work. The surface shimmer has to feel effortless while the harmony underneath keeps pulling the rug out. Ravel is cruel in the best way.");

      if (comments.length > 0) {
        await db.insert(pieceComments).values(comments);
        console.log(`Seeded ${comments.length} piece comments`);
      }
    }

    // ── 9. User-to-user follows ──────────────────────────────────────────────
    const userFollowData: { followerId: string; followingId: string }[] = [];
    const addFollow = (follower: string, following: string) => {
      const a = u(follower), b = u(following);
      if (a && b) userFollowData.push({ followerId: a, followingId: b });
    };

    // Professionals follow each other
    addFollow("thomas_weber",    "claire_bernard");
    addFollow("claire_bernard",  "thomas_weber");
    addFollow("carlos_ruiz",     "claire_bernard");
    addFollow("claire_bernard",  "carlos_ruiz");
    addFollow("emma_wilson",     "mikhail_volkov");
    addFollow("mikhail_volkov",  "emma_wilson");
    addFollow("lucas_moreau",    "isabelle_dupont");
    addFollow("isabelle_dupont", "lucas_moreau");

    // Students follow professionals
    addFollow("yuki_tanaka",    "claire_bernard");
    addFollow("yuki_tanaka",    "emma_wilson");
    addFollow("li_wei",         "claire_bernard");
    addFollow("li_wei",         "mikhail_volkov");
    addFollow("anna_kowalski",  "claire_bernard");
    addFollow("kai_fischer",    "thomas_weber");
    addFollow("priya_sharma",   "emma_wilson");
    addFollow("priya_sharma",   "carlos_ruiz");
    addFollow("lucas_moreau",   "thomas_weber");

    // Cross-connections
    addFollow("sara_nilsson",   "anna_kowalski");
    addFollow("anna_kowalski",  "sara_nilsson");
    addFollow("james_hartley",  "rafael_santos");
    addFollow("rafael_santos",  "james_hartley");

    await db.insert(follows).values(userFollowData).onConflictDoNothing();
    console.log(`Seeded ${userFollowData.length} user-to-user follows`);

    // ── 10. Composer discussion comments ─────────────────────────────────────
    // Ensure the table exists (idempotent DDL)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS composer_comments (
        id serial PRIMARY KEY,
        composer_id integer NOT NULL REFERENCES composers(id),
        user_id varchar NOT NULL REFERENCES users(id),
        content text NOT NULL,
        created_at timestamp DEFAULT now()
      )
    `);

    const existingComposerComments = await db.select({ id: composerComments.id }).from(composerComments);
    if (existingComposerComments.length > 0) {
      console.log("Composer comments already seeded, skipping");
    } else {
      const allComposersForComments = await db.select().from(composers);
      const cMapC = new Map(allComposersForComments.map(c => [c.name, c.id]));
      const chopinId  = cMapC.get("Frédéric Chopin");
      const bachId    = cMapC.get("Johann Sebastian Bach");
      const debussyId = cMapC.get("Claude Debussy");
      const rachId    = cMapC.get("Sergei Rachmaninoff");
      const lisztId   = cMapC.get("Franz Liszt");
      const ravelId   = cMapC.get("Maurice Ravel");

      const CC: { composerId: number; userId: string; content: string }[] = [];
      const addCC = (username: string, composerId: number | undefined, content: string) => {
        const uid = u(username);
        if (uid && composerId) CC.push({ composerId, userId: uid, content });
      };

      // Chopin — lively discussion
      addCC("claire_bernard",  chopinId, "Chopin's genius is inseparable from his understanding of the piano as a singing instrument. Every dynamic marking, every phrasing slur — it all comes from his love of bel canto opera. Once you hear that, the rubato stops feeling arbitrary and becomes breath.");
      addCC("anna_kowalski",   chopinId, "I've been studying Chopin for twenty years and I'm still discovering things. Last week I realized the left-hand accompaniment in the Barcarolle is basically a rocking boat — not just a pattern but a physical sensation. He builds the entire world of the piece into the texture.");
      addCC("carlos_ruiz",     chopinId, "What strikes me most about Chopin is how personal every piece feels. Unlike Liszt who often seems to be performing for the audience, Chopin always sounds like he's thinking out loud at the keyboard. That intimacy is why his music survives in the concert hall despite being written for the salon.");
      addCC("yuki_tanaka",     chopinId, "The Ballades are the pinnacle of romantic narrative in piano music. Each one feels like a complete novel compressed into 8 minutes. I've been working on No. 1 for years and the coda still gives me chills every time — it's one of the most cathartic moments in all of classical music.");
      addCC("li_wei",          chopinId, "Learning the Études is the best ear training I've ever done. Op. 10 No. 1 teaches you to hear the melody singing through the arpeggios. Op. 25 No. 11 ('Winter Wind') teaches you to project a cantilena in the right hand while the left plays torrential scales. Nothing else prepares you the same way.");

      // Bach — scholarly tone
      addCC("thomas_weber",    bachId, "Bach's counterpoint is a language unto itself. Once you really internalize the Well-Tempered Clavier — not just learn the notes but understand how the voices relate — you start hearing counterpoint everywhere, even in Chopin and Debussy. It rewires how you listen.");
      addCC("kai_fischer",     bachId, "The Goldberg Variations is Bach's greatest architectural achievement. The way the canons (at the unison, second, third... all the way to the ninth) punctuate the set, and then the Quodlibet at the end quoting folk songs — it's simultaneously the most rigorous and the most human thing he ever wrote.");
      addCC("priya_sharma",    bachId, "Playing Bach on a modern Steinway is always a philosophical question. I've gone back and forth on this for years. Currently I think the best approach is to respect the idiom (terraced dynamics, ornament conventions, articulation style) while not pretending you're playing a harpsichord. The piano has its own voice.");

      // Debussy — impressionistic discussion
      addCC("isabelle_dupont", debussyId, "Debussy liberated piano music from functional harmony without abandoning beauty. The whole-tone scale, the parallel fifths, the pentatonic passages in 'Pagodes' — these aren't tricks, they're a fundamentally different way of thinking about time and space in music. He didn't break the rules; he made the rules irrelevant.");
      addCC("lucas_moreau",    debussyId, "The Préludes are Debussy's most concentrated achievement. Each one is a world in 2-3 minutes — 'La fille aux cheveux de lin' is all tenderness and nostalgia; 'Ce qu'a vu le vent d'Ouest' is pure force and darkness. The variety within a single book is staggering.");
      addCC("yuki_tanaka",     debussyId, "What most pianists miss in Debussy is the silence. The rests aren't empty — they're continuation of the phrase. 'Des pas sur la neige' is almost more about silence than sound. You have to let the harmonics decay, let the pedal blur just enough, and trust that the listener will fill in what isn't there.");

      // Rachmaninoff
      addCC("mikhail_volkov",  rachId, "Rachmaninoff's genius was to synthesize the entire 19th-century romantic tradition and extend it past its supposed expiration date. By 1900 everyone said that style was finished — and then he wrote the Second Concerto. He understood that emotional truth doesn't have an expiration date.");
      addCC("emma_wilson",     rachId, "The Études-tableaux are criminally underplayed. Op. 39 in particular — each piece is a complete emotional world. No. 5 in E-flat minor has a darkness and weight that rivals anything in the literature. If you haven't learned any of these, start with Op. 33 No. 5 and go from there.");
      addCC("carlos_ruiz",     rachId, "I think Rachmaninoff is the last composer who truly believed in melody as the foundation of everything. His themes are not just memorable — they're inevitable. The secondary theme from the Second Concerto first movement sounds like it has always existed and he just discovered it.");

      // Liszt
      addCC("li_wei",          lisztId, "Liszt reinvented what the piano could do. But what gets lost in the 'virtuoso' narrative is how much he cared about poetic content. The Transcendental Études aren't exercises — they're poems. 'Harmonies du soir' is one of the most spiritual things ever written for keyboard.");
      addCC("claire_bernard",  lisztId, "The B minor Sonata is the Mount Everest of piano literature — not just technically but formally. The way he transforms three or four motifs through the entire 30-minute work with one continuous arc... it's the most ambitious single-movement form in the repertoire. Nothing compares.");

      // Ravel
      addCC("isabelle_dupont", ravelId, "Ravel said he had no theories, only taste. But of course he had theories — the most exacting standards of orchestrational clarity and textural perfection of anyone in his generation. Gaspard de la nuit proves it. That score is beyond meticulous.");
      addCC("lucas_moreau",    ravelId, "What separates Ravel from Debussy for me is precision versus suggestion. Debussy dissolves the edges; Ravel sharpens them. Scarbo is terrifying not because it's blurry but because every note is in exactly the wrong place in exactly the right way. Pure controlled nightmare.");

      if (CC.length > 0) {
        await db.insert(composerComments).values(CC);
        console.log(`Seeded ${CC.length} composer comments`);
      }
    }

    // ── 11. Piece milestones ──────────────────────────────────────────────────
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS piece_milestones (
        id serial PRIMARY KEY,
        user_id varchar NOT NULL REFERENCES users(id),
        piece_id integer NOT NULL REFERENCES pieces(id),
        cycle_number integer NOT NULL DEFAULT 1,
        milestone_type text NOT NULL,
        achieved_at text NOT NULL,
        created_at timestamp DEFAULT now(),
        UNIQUE(user_id, piece_id, cycle_number, milestone_type)
      )
    `);

    const existingMilestones = await db.select({ id: pieceMilestones.id }).from(pieceMilestones);
    if (existingMilestones.length > 0) {
      console.log("Milestones already seeded, skipping");
    } else {
      // Look up pieces we need IDs for
      const allPiecesForMilestones = await db.select().from(pieces);
      const findPieceForMilestone = (titleFragment: string) =>
        allPiecesForMilestones.find(p => p.title.toLowerCase().includes(titleFragment.toLowerCase()));

      const ballade1 = findPieceForMilestone("Ballade no. 1");
      const moonlight = findPieceForMilestone("Sonata no. 14");
      const suiteB    = findPieceForMilestone("Suite bergamasque");
      const etudes10  = findPieceForMilestone("Études Op. 10");
      const wtc       = findPieceForMilestone("Well-Tempered");
      const gaspard   = findPieceForMilestone("Gaspard");

      const MS: { userId: string; pieceId: number; cycleNumber: number; milestoneType: string; achievedAt: string }[] = [];
      const addM = (username: string, piece: typeof ballade1, cycle: number, type: string, date: string) => {
        const uid = u(username);
        if (uid && piece) MS.push({ userId: uid, pieceId: piece.id, cycleNumber: cycle, milestoneType: type, achievedAt: date });
      };

      // claire_bernard — Ballade No.1: full completed cycle + started second cycle
      if (ballade1) {
        addM("claire_bernard", ballade1, 1, "started",      "2019-09-01");
        addM("claire_bernard", ballade1, 1, "read_through", "2019-10-15");
        addM("claire_bernard", ballade1, 1, "notes_learned","2020-01-20");
        addM("claire_bernard", ballade1, 1, "up_to_speed",  "2020-05-10");
        addM("claire_bernard", ballade1, 1, "memorized",    "2020-08-03");
        addM("claire_bernard", ballade1, 1, "completed",    "2020-11-22");
        addM("claire_bernard", ballade1, 1, "performed",    "2021-03-14");
        // Second cycle after returning to it
        addM("claire_bernard", ballade1, 2, "started",      "2023-06-01");
        addM("claire_bernard", ballade1, 2, "read_through", "2023-07-10");
        addM("claire_bernard", ballade1, 2, "notes_learned","2023-09-20");
      }

      // anna_kowalski — Ballade No.1: completed once
      if (ballade1) {
        addM("anna_kowalski", ballade1, 1, "started",      "2020-02-01");
        addM("anna_kowalski", ballade1, 1, "read_through", "2020-04-01");
        addM("anna_kowalski", ballade1, 1, "notes_learned","2020-08-15");
        addM("anna_kowalski", ballade1, 1, "up_to_speed",  "2021-01-10");
        addM("anna_kowalski", ballade1, 1, "memorized",    "2021-04-22");
        addM("anna_kowalski", ballade1, 1, "completed",    "2021-07-01");
      }

      // carlos_ruiz — Moonlight Sonata: performed
      if (moonlight) {
        addM("carlos_ruiz", moonlight, 1, "started",      "2018-01-10");
        addM("carlos_ruiz", moonlight, 1, "read_through", "2018-02-05");
        addM("carlos_ruiz", moonlight, 1, "notes_learned","2018-04-20");
        addM("carlos_ruiz", moonlight, 1, "up_to_speed",  "2018-07-15");
        addM("carlos_ruiz", moonlight, 1, "memorized",    "2018-10-01");
        addM("carlos_ruiz", moonlight, 1, "completed",    "2018-12-08");
        addM("carlos_ruiz", moonlight, 1, "performed",    "2019-02-14");
      }

      // thomas_weber — WTC: partial cycle
      if (wtc) {
        addM("thomas_weber", wtc, 1, "started",      "2021-03-01");
        addM("thomas_weber", wtc, 1, "read_through", "2021-05-20");
        addM("thomas_weber", wtc, 1, "notes_learned","2021-09-10");
        addM("thomas_weber", wtc, 1, "up_to_speed",  "2022-02-14");
        addM("thomas_weber", wtc, 1, "memorized",    "2022-06-30");
        addM("thomas_weber", wtc, 1, "completed",    "2022-10-05");
      }

      // yuki_tanaka — Suite bergamasque: completed
      if (suiteB) {
        addM("yuki_tanaka", suiteB, 1, "started",      "2019-04-01");
        addM("yuki_tanaka", suiteB, 1, "read_through", "2019-05-15");
        addM("yuki_tanaka", suiteB, 1, "notes_learned","2019-08-20");
        addM("yuki_tanaka", suiteB, 1, "up_to_speed",  "2020-01-10");
        addM("yuki_tanaka", suiteB, 1, "memorized",    "2020-04-05");
        addM("yuki_tanaka", suiteB, 1, "completed",    "2020-06-22");
        addM("yuki_tanaka", suiteB, 1, "performed",    "2020-09-12");
      }

      // emma_wilson — Moonlight: partial, still in progress
      if (moonlight) {
        addM("emma_wilson", moonlight, 1, "started",      "2023-01-15");
        addM("emma_wilson", moonlight, 1, "read_through", "2023-02-28");
        addM("emma_wilson", moonlight, 1, "notes_learned","2023-05-10");
      }

      // li_wei — Études Op.10: completed
      if (etudes10) {
        addM("li_wei", etudes10, 1, "started",      "2020-09-01");
        addM("li_wei", etudes10, 1, "read_through", "2020-11-15");
        addM("li_wei", etudes10, 1, "notes_learned","2021-03-20");
        addM("li_wei", etudes10, 1, "up_to_speed",  "2021-08-10");
        addM("li_wei", etudes10, 1, "memorized",    "2022-01-05");
        addM("li_wei", etudes10, 1, "completed",    "2022-05-18");
        addM("li_wei", etudes10, 1, "performed",    "2022-11-30");
      }

      // isabelle_dupont — Gaspard: partial
      if (gaspard) {
        addM("isabelle_dupont", gaspard, 1, "started",      "2022-06-01");
        addM("isabelle_dupont", gaspard, 1, "read_through", "2022-08-15");
        addM("isabelle_dupont", gaspard, 1, "notes_learned","2023-01-20");
      }

      if (MS.length > 0) {
        await db.insert(pieceMilestones).values(MS).onConflictDoNothing();
        console.log(`Seeded ${MS.length} piece milestones`);
      }
    }

    console.log("Extra user seeding complete!");
  } catch (err) {
    console.error("Error seeding extra users:", err);
  }
}
