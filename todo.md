# Golf Besty — Todo

## Data Layer & Backend
- [x] Database schema: users, picks, chat_messages tables
- [ ] Polymarket Gamma API integration (no auth required) — fetch golf markets by tag
- [ ] DataGolf API integration — rankings, schedule, field updates (requires API key)
- [x] Fallback: ESPN/PGA Tour public JSON endpoints for schedule/leaderboard
- [x] Server route: GET /api/trpc/golf.tournaments — upcoming PGA schedule
- [x] Server route: GET /api/trpc/golf.leaderboard — live leaderboard for active tournament
- [ ] Server route: GET /api/trpc/golf.players — top player rankings + stats
- [ ] Server route: GET /api/trpc/golf.polymarketOdds — Polymarket golf markets
- [x] Server route: POST /api/trpc/golf.chat — streaming LLM golf banter endpoint
- [x] Server route: POST /api/trpc/picks.makePick — save user pick for a tournament
- [x] Server route: GET /api/trpc/picks.myPicks — get user's picks with results
- [ ] Server route: GET /api/trpc/picks.leaderboard — bragging rights standings

## AI Chat
- [x] Golf banter system prompt — witty, knowledgeable, clubhouse personality
- [x] Streaming LLM response via SSE
- [x] Chat history persistence in DB
- [x] AIChatBox component integration with golf persona

## Tournament Tracker
- [x] Upcoming tournaments panel with dates, venue, purse
- [x] Live leaderboard panel (when tournament in progress)
- [x] Player field list for current/next tournament

## Polymarket Odds
- [ ] Fetch golf prediction markets from Gamma API (tag-based search)
- [ ] Display win probabilities as percentage bars
- [ ] Link to Polymarket market for reference
- [ ] Auto-refresh odds every 5 minutes

## Player Stats
- [ ] World rankings table (top 20)
- [ ] Player card: OWGR rank, recent form, scoring avg, strokes gained
- [ ] Clickable player detail view

## Bragging Rights Pick Mechanic
- [x] Pick panel: select tournament winner from field
- [x] Pick deadline: locks at tournament start
- [x] AI also makes a pick (revealed after user picks)
- [x] Scoring: correct pick = 1 point, wrong = 0; running tally vs AI
- [x] Explicit "No money involved — bragging rights only" disclaimer
- [x] Pick history and results display
- [ ] Weekly recap after tournament: who was right, running "bragging rights" score

## UI / Design
- [x] Global theme: deep green (#1B3A2D), cream (#F5F0E8), brass (#B8960C)
- [x] Typography: scorecard-inspired (serif for headings, monospace for scores)
- [x] Google Fonts: Playfair Display (headings) + IBM Plex Mono (scores/stats)
- [x] Clubhouse-inspired layout: sidebar nav, elegant card components
- [x] Scorecard-style table for leaderboard
- [x] Brass dividers and decorative elements
- [x] Dark green header with cream logo text
- [x] Responsive design (mobile-first)
- [x] Smooth animations
- [x] Empty states and loading skeletons

## Tests
- [ ] Vitest: Polymarket API fetch helper
- [ ] Vitest: pick mechanic scoring logic
- [x] Vitest: chat router procedure

## Jamie's Best Friend Golf Companion (Core Identity Shift)
- [x] Rename AI persona to "Wally" — Jamie's personal golf best friend
- [x] Upgrade system prompt: covers PGA + LPGA + gossip + player drama + personal stories + rivalries + injuries + off-course life
- [x] Golf Feed page: live news from multiple real RSS sources
- [x] Feed covers: PGA politics, player injuries, personal stories, viral moments, course news
- [x] The Caddie knows and references current news in conversation (feed-aware context)
- [x] "What's The Talk" section on home page — top 3 stories right now
- [ ] Player cards include: personal story, recent drama/news, not just stats
- [x] Gossip/drama tags on feed items: "Drama", "Injury", "Comeback", "Rivalry", "Off-Course"
- [x] The Caddie can be asked "what's the latest on [player]?" and pulls from feed context
- [x] Home page hero: "What's happening in golf today" — live summary

## Wally — Jamie's Golf Best Friend (Core Rebuild)
- [x] Rename app identity to "Wally" throughout — not a betting app, a best friend
- [x] Birthday welcome screen: "Happy 60th Jamie — Wally's here"
- [x] Wally persona: warm, real, opinionated, funny, loyal — talks like a golf buddy not a chatbot
- [x] CADDIE_SYSTEM updated: Jamie is in hospital, never implies he's playing golf
- [x] Home page: Wally greets Jamie by name, shows what's happening in golf this week
- [x] Weekly Showdown: Wally makes his prediction, Jamie makes his — pure friendly rivalry, no money language anywhere
- [x] Wally explains his prediction with real reasoning (stats, form, Polymarket signal) in plain English
- [x] Jamie can type his own reasoning/trash talk alongside his pick
- [ ] Weekly recap after tournament: who was right, running "bragging rights" score
- [x] My Game tracker: Jamie logs his own rounds, scores, courses
- [x] My Game: Wally reacts to Jamie's rounds with real commentary
- [x] Remove all "betting", "wagering", "money" language from entire app
- [x] App works great on mobile — Jamie uses it on his phone

## Accessibility — Jamie Can't Talk
- [x] TTS: Wally reads every chat response aloud — speaker button on each message
- [x] TTS: Auto-play toggle so Wally speaks automatically without tapping
- [x] Voice input: mic button so Jamie taps to speak instead of type
- [x] Quick reaction buttons in Chat: "Tell me something good", "Who's hot?", "What did I miss?", "Trash talk me", "This week's tournament"
- [x] Daily morning briefing on Home page — Wally's personal golf note to Jamie each day
- [x] Morning briefing prompt updated: hospital context, never implies playing golf, ends with recovery encouragement

## Wally Full Companion Features
- [x] Wally Memory: Jamie can save personal golf notes, favorite courses, and moments; Wally references them in chat
- [x] Golf Trivia mode: tap A/B/C/D questions, Wally reacts to right and wrong answers with personality
- [x] Family Drops: Amy and family can leave Wally a message or memory that Jamie sees when he opens the app
- [ ] TTS read-aloud on Feed page: speaker button on each news story
- [ ] TTS read-aloud on Tournaments page: Wally narrates the leaderboard

## Voice Aid — Jamie's Communication Tool
- [x] Dedicated Voice Aid page: Jamie types or taps, app speaks it aloud for people in the room
- [x] Large easy-to-read text input — big font, easy to type on phone
- [x] Speak button: tap to have the app read what Jamie typed out loud at full volume
- [x] Quick phrase bank: pre-loaded common phrases Jamie can tap without typing
- [x] Custom phrase saving: Jamie can add his own phrases to the quick bank
- [x] Voice Aid in sidebar navigation — clearly labeled
- [x] PWA start_url points to /voice-aid — opens Voice Aid directly from home screen icon

## AI Credit Efficiency
- [x] Cache Morning Briefing per calendar day — generate once, serve cached version on reload
- [x] Trivia: fixed to not regenerate on every page view
- [x] Morning briefing cache cleared — fresh hospital-aware note will generate today

## Usage Analytics
- [x] DB schema: analytics_events table (guestId, event, page, metadata, timestamp)
- [x] Server: logEvent tRPC mutation (public, fire-and-forget)
- [x] Track: page views (all pages)
- [x] Track: Voice Aid — typed vs tapped phrases, which phrases used most, Speak presses, Say Again presses
- [x] Track: Chat — message count, time of day
- [x] Track: Showdown — picks made, tournaments engaged
- [x] Track: Morning Briefing — opened vs skipped
- [x] Track: Family Drops — messages received, played
- [x] Private /admin/analytics dashboard — ranked features most-to-least used, time-of-day patterns, usage trends
- [x] Add transparent tracking note for Jamie in the app
- [x] Patient Report export — printable one-pager for healthcare organizations

## PWA / Home Screen Install
- [x] Create PWA manifest.json with name, icons, start_url pointing to /voice-aid
- [x] Generate Wally app icons (192x192 and 512x512) for home screen
- [x] Add service worker for offline phrase bank caching
- [x] Wire manifest and theme-color meta tags into index.html
- [x] Optimize Voice Aid page with large above-the-fold Speak button
- [x] Test install flow on iPhone (Safari) and Samsung (Chrome)

## Remaining / New Items
- [x] TTS read-aloud on Feed/Locker Room page: speaker button on each news story
- [x] TTS read-aloud on Tournaments page: Wally narrates the leaderboard
- [ ] Weekly recap after tournament: who was right, running "bragging rights" score
- [ ] Player cards: personal story, recent drama/news (not just stats)
- [ ] Verify player picker fix working correctly on live site (U.S. Open field)
- [ ] Verify LPGA Meijer Classic / Dow Championship fields (ESPN lag check)
- [x] Add /admin/analytics to sidebar for Amy (bookmark-friendly)
- [x] Wally Memory: Wally should reference saved memories in chat context
- [x] Voice Aid: add "Say It Louder" volume boost button for noisy hospital rooms
- [x] Voice Aid: add speed control (slower speech for clarity)
- [ ] Family Drops: email/SMS notification to Amy when Jamie reads a drop
- [ ] Showdown: show season-long bragging rights score (Jamie vs Wally wins/losses)
- [ ] Home page: show next tournament countdown timer
- [ ] Vitest: pick mechanic scoring logic test
