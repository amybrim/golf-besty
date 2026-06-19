# Golf Besty — Todo

## Data Layer & Backend
- [ ] Database schema: users, picks, chat_messages tables
- [ ] Polymarket Gamma API integration (no auth required) — fetch golf markets by tag
- [ ] DataGolf API integration — rankings, schedule, field updates (requires API key)
- [ ] Fallback: ESPN/PGA Tour public JSON endpoints for schedule/leaderboard
- [ ] Server route: GET /api/trpc/golf.tournaments — upcoming PGA schedule
- [ ] Server route: GET /api/trpc/golf.leaderboard — live leaderboard for active tournament
- [ ] Server route: GET /api/trpc/golf.players — top player rankings + stats
- [ ] Server route: GET /api/trpc/golf.polymarketOdds — Polymarket golf markets
- [ ] Server route: POST /api/trpc/golf.chat — streaming LLM golf banter endpoint
- [ ] Server route: POST /api/trpc/picks.makePick — save user pick for a tournament
- [ ] Server route: GET /api/trpc/picks.myPicks — get user's picks with results
- [ ] Server route: GET /api/trpc/picks.leaderboard — bragging rights standings

## AI Chat
- [ ] Golf banter system prompt — witty, knowledgeable, clubhouse personality
- [ ] Streaming LLM response via SSE
- [ ] Chat history persistence in DB
- [ ] AIChatBox component integration with golf persona

## Tournament Tracker
- [ ] Upcoming tournaments panel with dates, venue, purse
- [ ] Live leaderboard panel (when tournament in progress)
- [ ] Player field list for current/next tournament

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
- [ ] Pick panel: select tournament winner from field
- [ ] Pick deadline: locks at tournament start
- [ ] AI also makes a pick (revealed after user picks)
- [ ] Scoring: correct pick = 1 point, wrong = 0; running tally vs AI
- [ ] Explicit "No money involved — bragging rights only" disclaimer
- [ ] Pick history and results display

## UI / Design
- [ ] Global theme: deep green (#1B3A2D), cream (#F5F0E8), brass (#B8960C)
- [ ] Typography: scorecard-inspired (serif for headings, monospace for scores)
- [ ] Google Fonts: Playfair Display (headings) + IBM Plex Mono (scores/stats)
- [ ] Clubhouse-inspired layout: sidebar nav, elegant card components
- [ ] Scorecard-style table for leaderboard
- [ ] Brass dividers and decorative elements
- [ ] Dark green header with cream logo text
- [ ] Responsive design (mobile-first)
- [ ] Smooth animations (framer-motion)
- [ ] Empty states and loading skeletons

## Tests
- [ ] Vitest: Polymarket API fetch helper
- [ ] Vitest: pick mechanic scoring logic
- [ ] Vitest: chat router procedure

## Jamie's Best Friend Golf Companion (Core Identity Shift)
- [x] Rename AI persona to "The Caddie" — Jamie's personal golf best friend
- [x] Upgrade system prompt: covers PGA + LIV + gossip + player drama + personal stories + rivalries + injuries + off-course life
- [x] Golf Feed page: live news from multiple real RSS sources (Golf Channel, Golf Digest, No Laying Up, Barstool Golf, etc.)
- [x] Feed covers: LIV drama, PGA politics, player injuries, personal stories, viral moments, course news
- [ ] The Caddie knows and references current news in conversation (feed-aware context)
- [x] "What's The Talk" section on home page — top 3 stories right now
- [ ] Player cards include: personal story, recent drama/news, not just stats
- [x] LIV Golf section: LIV schedule, LIV standings, LIV drama feed
- [x] Gossip/drama tags on feed items: "Drama", "LIV", "Injury", "Comeback", "Rivalry", "Off-Course"
- [ ] The Caddie can be asked "what's the latest on [player]?" and pulls from feed context
- [x] Home page hero: "What's happening in golf today" — live summary

## Wally — Jamie's Golf Best Friend (Core Rebuild)
- [x] Rename app identity to "Wally" throughout — not a betting app, a best friend
- [x] Birthday welcome screen: "Happy 60th Jamie — Wally's here"
- [x] Wally persona: warm, real, opinionated, funny, loyal — talks like a golf buddy not a chatbot
- [x] Home page: Wally greets Jamie by name, shows what's happening in golf this week
- [x] Weekly Showdown: Wally makes his prediction, Jamie makes his — pure friendly rivalry, no money language anywhere
- [x] Wally explains his prediction with real reasoning (stats, form, Polymarket signal) in plain English
- [x] Jamie can type his own reasoning/trash talk alongside his pick
- [ ] Weekly recap after tournament: who was right, running "bragging rights" score
- [x] My Game tracker: Jamie logs his own rounds, scores, courses
- [x] My Game: Wally reacts to Jamie's rounds with real commentary ("That 73 at Pebble? Respect.")
- [x] Remove all "betting", "wagering", "money" language from entire app
- [x] App works great on mobile — Jamie uses it on his phone

## Accessibility — Jamie Can't Talk
- [x] TTS: Wally reads every chat response aloud — speaker button on each message
- [x] TTS: Auto-play toggle so Wally speaks automatically without tapping
- [x] Voice input: mic button so Jamie taps to speak instead of type
- [x] Quick reaction buttons in Chat: "Tell me something good", "Who's hot?", "What did I miss?", "Trash talk me", "This week's tournament"
- [x] Daily morning briefing on Home page — Wally's personal golf note to Jamie each day

## Wally Full Companion Features (Amy's Recommendations)
- [ ] Wally Memory: Jamie can save personal golf notes, favorite courses, and moments; Wally references them in chat
- [ ] Golf Trivia mode: tap A/B/C/D questions, Wally reacts to right and wrong answers with personality
- [ ] Family Drops: Amy and family can leave Wally a message or memory that Jamie sees when he opens the app
- [ ] TTS read-aloud on Feed page: speaker button on each news story
- [ ] TTS read-aloud on Tournaments page: Wally narrates the leaderboard

## Voice Aid — Jamie's Communication Tool
- [ ] Dedicated Voice Aid page: Jamie types or taps, app speaks it aloud for people in the room
- [ ] Large easy-to-read text input — big font, easy to type on phone
- [ ] Speak button: tap to have the app read what Jamie typed out loud at full volume
- [ ] Quick phrase bank: pre-loaded common phrases Jamie can tap without typing
- [ ] Custom phrase saving: Jamie can add his own phrases to the quick bank
- [ ] Voice Aid in sidebar navigation — clearly labeled

## AI Credit Efficiency
- [ ] Cache Morning Briefing per calendar day — generate once, serve cached version on reload, regenerate only when date changes
- [ ] Audit all LLM call sites — confirm Showdown pick reasoning, round reactions, and any other invokeLLM calls only generate once per real event, not per page view
- [ ] Fix any LLM calls that regenerate needlessly

## Usage Analytics
- [ ] DB schema: analytics_events table (guestId, event, page, metadata, timestamp)
- [ ] Server: logEvent tRPC mutation (public, fire-and-forget)
- [ ] Track: page views (all pages)
- [ ] Track: Voice Aid — typed vs tapped phrases, which phrases used most, Speak presses, Say Again presses
- [ ] Track: Chat — message count, time of day
- [ ] Track: Showdown — picks made, tournaments engaged
- [ ] Track: Morning Briefing — opened vs skipped
- [ ] Track: Family Drops — messages received, played
- [ ] Private /admin/analytics dashboard — ranked features most-to-least used, time-of-day patterns, usage trends
- [ ] Add transparent tracking note for Jamie in the app ("Amy added this so I can see what's helping you most")
