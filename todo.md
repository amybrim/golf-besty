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
