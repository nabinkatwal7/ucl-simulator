# TODO — FIFA 19–Style Career Mode Web App (SQLite)

> Goal: build a **FIFA 19–inspired Career Mode simulator web app** that recreates the **management, calendar, transfers, scouting, youth academy, contracts, competitions, board objectives, player growth, and save-state loop** — while **excluding the actual match engine**.
>
> This checklist is written to be followed step by step. Work top to bottom. Do not skip acceptance criteria.

---

## 0) Product definition

### Core product

- [ ] Build a single-player web app that simulates a football career mode
- [ ] Support **Manager Career** first
- [ ] Keep **Player Career** as a phase-2 module
- [ ] Simulate time through a **daily calendar**
- [ ] Allow the user to:
  - [ ] choose a club
  - [ ] manage squad
  - [ ] handle transfers and contracts
  - [ ] scout players
  - [ ] run youth academy
  - [ ] progress fixtures
  - [ ] track objectives
  - [ ] complete seasons
  - [ ] save/load careers

### Scope rules

- [ ] Recreate the **feel and flow** of FIFA 19 Career Mode
- [ ] Do **not** use EA assets, logos, audio, or copyrighted art
- [ ] Use original but stylistically similar UI
- [ ] Exclude gameplay engine / live football match simulation
- [ ] Use **simulated match results** only

### Non-goals for v1

- [ ] No online multiplayer
- [ ] No real-time networking
- [ ] No 3D scenes
- [ ] No live commentary system
- [ ] No microtransactions
- [ ] No editor for every obscure FIFA table in v1

### Definition of done for v1

- [ ] Start a new career
- [ ] Advance calendar day by day
- [ ] Play/sim seasons
- [ ] Manage transfers, loans, contracts, scouting, youth, board objectives
- [ ] Save and reload progress
- [ ] Finish one full season without crashes
- [ ] Successfully carry over into next season

---

## 1) Recommended stack

### App stack

- [ ] Frontend: **Next.js**
- [ ] Backend: **Next.js server routes**
- [ ] ORM/query layer: **Drizzle ORM** or **Prisma**
- [ ] Database: **SQLite**
- [ ] State management: **Zustand**
- [ ] UI components: custom components + lightweight headless primitives
- [ ] Styling: **Tailwind CSS**
- [ ] Validation: **Zod**
- [ ] Background logic: run all sim logic synchronously through backend service functions

### Suggested folder structure

- [ ] Create this structure:

```txt
/apps
  /web
    /src
      /app or /pages
      /components
      /features
      /lib
      /styles
      /server
        /db
        /services
        /sim
        /seed
        /repositories
      /types
```

### Architecture rule

- [ ] Keep sim logic out of UI
- [ ] UI calls backend services
- [ ] Backend services update SQLite
- [ ] Every calendar advance should be deterministic for a given save + RNG seed

Acceptance criteria:

- [ ] Project boots locally
- [ ] SQLite connects
- [ ] Migrations run
- [ ] Seed script works

---

## 2) High-level system design

### Main modules

- [ ] Save/Career system
- [ ] Calendar system
- [ ] Clubs/teams
- [ ] Players
- [ ] Squad management
- [ ] Transfers
- [ ] Contracts
- [ ] Scouting
- [ ] Youth academy
- [ ] Training
- [ ] Player growth/aging/retirement/regens
- [ ] Competitions and fixtures
- [ ] Match simulation
- [ ] Board objectives / manager rating
- [ ] News/inbox
- [ ] Finance/budget
- [ ] UI shell
- [ ] Settings/save manager

### Main simulation loop

- [ ] Load save
- [ ] Read current date
- [ ] Trigger all events for the date
- [ ] Process fixture days
- [ ] Process scouting/training/injuries/contracts/objectives
- [ ] Persist changes
- [ ] Show updated UI state

Acceptance criteria:

- [ ] One backend function exists: `advanceCareerByOneDay(careerId)`
- [ ] Function is idempotent-safe per date
- [ ] Function logs triggered events

---

## 3) Database design (SQLite)

## 3.1 Database principles

- [ ] Use integer primary keys unless UUID is strongly needed
- [ ] Add `created_at` and `updated_at` columns to most mutable tables
- [ ] Keep base/reference data separate from save-state data
- [ ] Separate:
  - [ ] reference football data
  - [ ] career save data
  - [ ] event history

### 3.2 Table groups

- [ ] Reference tables
- [ ] Career root tables
- [ ] Roster/state tables
- [ ] Transfers/contracts
- [ ] Competitions/fixtures/results
- [ ] Youth/scouting
- [ ] Board/finance
- [ ] Inbox/news
- [ ] Save snapshots/logs

---

## 3.3 Core reference tables

### `nations`

- [ ] id
- [ ] name
- [ ] iso_code

### `leagues`

- [ ] id
- [ ] name
- [ ] nation_id
- [ ] tier
- [ ] is_playable
- [ ] prestige
- [ ] default_competition_color

### `clubs`

- [ ] id
- [ ] name
- [ ] short_name
- [ ] nation_id
- [ ] league_id
- [ ] rival_club_id nullable
- [ ] prestige
- [ ] attack_rating
- [ ] midfield_rating
- [ ] defense_rating
- [ ] transfer_budget_default
- [ ] wage_budget_default
- [ ] stadium_name
- [ ] primary_color
- [ ] secondary_color

### `positions`

- [ ] code (`GK`, `RB`, `CB`, `CM`, etc.)
- [ ] name
- [ ] sort_order

### `player_archetypes`

- [ ] id
- [ ] name
- [ ] position_group
- [ ] description

### `competition_templates`

- [ ] id
- [ ] name
- [ ] type (`league`, `cup`, `continental`)
- [ ] nation_id nullable
- [ ] league_id nullable
- [ ] fixture_rules_json
- [ ] prize_rules_json

Acceptance criteria:

- [ ] You can seed leagues, clubs, positions, nations

---

## 3.4 Player reference + mutable state split

### Option A: single table per career copy

Use when simplicity matters.

### `players`

- [ ] id
- [ ] first_name
- [ ] last_name
- [ ] common_name nullable
- [ ] nationality_id
- [ ] birth_date
- [ ] preferred_foot
- [ ] height_cm
- [ ] weight_kg
- [ ] work_rate_attacking
- [ ] work_rate_defensive
- [ ] weak_foot
- [ ] skill_moves
- [ ] potential
- [ ] overall
- [ ] primary_position
- [ ] secondary_positions_json
- [ ] value_amount
- [ ] wage_amount
- [ ] face_asset_key nullable
- [ ] body_type
- [ ] is_real_player
- [ ] created_from (`seed`, `youth`, `regen`, `generated`)

### `player_attributes`

- [ ] player_id
- [ ] acceleration
- [ ] sprint_speed
- [ ] finishing
- [ ] shot_power
- [ ] long_shots
- [ ] positioning
- [ ] volleys
- [ ] penalties
- [ ] vision
- [ ] crossing
- [ ] short_passing
- [ ] long_passing
- [ ] curve
- [ ] dribbling
- [ ] ball_control
- [ ] agility
- [ ] reactions
- [ ] balance
- [ ] composure
- [ ] interceptions
- [ ] heading_accuracy
- [ ] defensive_awareness
- [ ] standing_tackle
- [ ] sliding_tackle
- [ ] jumping
- [ ] stamina
- [ ] strength
- [ ] aggression
- [ ] gk_diving
- [ ] gk_handling
- [ ] gk_kicking
- [ ] gk_reflexes
- [ ] gk_positioning

### `player_traits`

- [ ] id
- [ ] player_id
- [ ] trait_code
- [ ] trait_name

Acceptance criteria:

- [ ] Player card can be rendered from DB
- [ ] Overall can be stored or recalculated
- [ ] Attributes are editable by sim services

---

## 3.5 Career save root tables

### `careers`

- [ ] id
- [ ] name
- [ ] mode (`manager`, `player`)
- [ ] manager_profile_name
- [ ] controlled_club_id
- [ ] current_date
- [ ] current_season_number
- [ ] status (`active`, `archived`, `completed`)
- [ ] rng_seed
- [ ] created_at
- [ ] updated_at

### `career_settings`

- [ ] career_id
- [ ] currency_symbol
- [ ] board_strictness
- [ ] transfer_difficulty
- [ ] scouting_difficulty
- [ ] enable_first_window
- [ ] enable_international_management
- [ ] injury_frequency
- [ ] player_growth_speed
- [ ] autosave_enabled

### `career_club_state`

- [ ] career_id
- [ ] club_id
- [ ] transfer_budget
- [ ] wage_budget
- [ ] weekly_wage_spend
- [ ] youth_scout_slots
- [ ] transfer_scout_slots
- [ ] manager_rating
- [ ] morale_team_avg
- [ ] current_league_position nullable

Acceptance criteria:

- [ ] Can create a new career and initialize all clubs into career state

---

## 3.6 Roster link tables

### `career_rosters`

- [ ] id
- [ ] career_id
- [ ] player_id
- [ ] club_id nullable
- [ ] squad_role (`crucial`, `important`, `rotation`, `sporadic`, `prospect`)
- [ ] squad_status (`senior`, `reserve`, `youth`, `loaned_out`, `free_agent`, `retired`)
- [ ] shirt_number nullable
- [ ] joined_on
- [ ] contract_end_date nullable
- [ ] release_clause nullable
- [ ] is_listed_for_loan
- [ ] is_listed_for_transfer
- [ ] morale
- [ ] form
- [ ] sharpness_placeholder nullable
- [ ] fitness
- [ ] stamina_modifier
- [ ] injury_status (`healthy`, `injured`, `suspended`)
- [ ] injury_type nullable
- [ ] injury_end_date nullable

### `career_player_growth`

- [ ] id
- [ ] career_id
- [ ] player_id
- [ ] last_growth_tick_date
- [ ] development_points_bank
- [ ] season_minutes
- [ ] season_goals
- [ ] season_assists
- [ ] training_focus_json
- [ ] growth_status

Acceptance criteria:

- [ ] A player can move clubs without duplicating player entity
- [ ] Contract and morale live in career-specific state, not reference player row

---

## 3.7 Contracts and transfer tables

### `transfer_windows`

- [ ] id
- [ ] career_id
- [ ] league_id nullable
- [ ] name
- [ ] opens_on
- [ ] closes_on
- [ ] is_active

### `transfer_targets`

- [ ] id
- [ ] career_id
- [ ] club_id
- [ ] player_id
- [ ] priority
- [ ] scout_status (`unscouted`, `in_progress`, `complete`)
- [ ] scout_due_date nullable
- [ ] scouted_overall_min nullable
- [ ] scouted_overall_max nullable
- [ ] scouted_potential_min nullable
- [ ] scouted_potential_max nullable
- [ ] notes nullable

### `transfer_offers`

- [ ] id
- [ ] career_id
- [ ] from_club_id
- [ ] to_club_id
- [ ] player_id
- [ ] type (`transfer`, `loan`, `loan_to_buy`)
- [ ] status (`draft`, `submitted`, `accepted`, `rejected`, `withdrawn`, `expired`)
- [ ] fee_amount nullable
- [ ] loan_length_months nullable
- [ ] wage_split_percent nullable
- [ ] sell_on_percent nullable
- [ ] exchange_player_id nullable
- [ ] submitted_on
- [ ] responded_on nullable
- [ ] expires_on nullable

### `contract_negotiations`

- [ ] id
- [ ] career_id
- [ ] player_id
- [ ] club_id
- [ ] status (`open`, `agreed`, `failed`, `expired`)
- [ ] squad_role
- [ ] contract_years
- [ ] weekly_wage
- [ ] signing_bonus
- [ ] clean_sheet_bonus nullable
- [ ] goal_bonus nullable
- [ ] release_clause nullable
- [ ] negotiated_on
- [ ] completed_on nullable

### `transfer_history`

- [ ] id
- [ ] career_id
- [ ] player_id
- [ ] from_club_id nullable
- [ ] to_club_id nullable
- [ ] transfer_type
- [ ] fee_amount nullable
- [ ] completed_on

Acceptance criteria:

- [ ] Permanent transfer works end-to-end
- [ ] Loan works end-to-end
- [ ] Contract renewal works end-to-end

---

## 3.8 Scouting and youth academy tables

### `scouts`

- [ ] id
- [ ] career_id
- [ ] club_id
- [ ] type (`transfer`, `youth`)
- [ ] name
- [ ] nationality_id
- [ ] experience_rating
- [ ] judgment_rating
- [ ] monthly_cost
- [ ] status (`idle`, `assigned`, `returning`)

### `scout_assignments`

- [ ] id
- [ ] scout_id
- [ ] career_id
- [ ] assignment_type (`player_search`, `youth_search`)
- [ ] nation_id nullable
- [ ] league_id nullable
- [ ] club_id nullable
- [ ] player_type_filter nullable
- [ ] duration_months
- [ ] started_on
- [ ] next_report_on
- [ ] ends_on
- [ ] status (`active`, `completed`, `cancelled`)

### `scout_reports`

- [ ] id
- [ ] assignment_id
- [ ] generated_on
- [ ] report_type (`transfer`, `youth`)

### `scout_report_items`

- [ ] id
- [ ] report_id
- [ ] player_id
- [ ] overall_min
- [ ] overall_max
- [ ] potential_min
- [ ] potential_max
- [ ] market_value nullable
- [ ] wage_estimate nullable
- [ ] recommendation_score

### `youth_academy_players`

- [ ] id
- [ ] career_id
- [ ] player_id
- [ ] club_id
- [ ] overall_min
- [ ] overall_max
- [ ] potential_min
- [ ] potential_max
- [ ] youth_status (`academy`, `promoted`, `released`)
- [ ] signed_on
- [ ] promoted_on nullable
- [ ] released_on nullable

Acceptance criteria:

- [ ] Youth scout assignment produces monthly reports
- [ ] Player can be signed into academy
- [ ] Academy player can be promoted to senior squad

---

## 3.9 Competition tables

### `career_competitions`

- [ ] id
- [ ] career_id
- [ ] template_id
- [ ] season_number
- [ ] name
- [ ] stage
- [ ] status

### `fixtures`

- [ ] id
- [ ] career_id
- [ ] competition_id
- [ ] season_number
- [ ] matchday_number nullable
- [ ] round_name nullable
- [ ] home_club_id
- [ ] away_club_id
- [ ] scheduled_date
- [ ] kickoff_label nullable
- [ ] result_status (`pending`, `simulated`, `played`)
- [ ] home_goals nullable
- [ ] away_goals nullable
- [ ] extra_time_used
- [ ] penalties_used
- [ ] winner_club_id nullable

### `fixture_events`

- [ ] id
- [ ] fixture_id
- [ ] minute
- [ ] event_type (`goal`, `assist`, `yellow`, `red`, `injury`)
- [ ] player_id nullable
- [ ] secondary_player_id nullable
- [ ] club_id

### `league_tables`

- [ ] id
- [ ] competition_id
- [ ] club_id
- [ ] played
- [ ] wins
- [ ] draws
- [ ] losses
- [ ] goals_for
- [ ] goals_against
- [ ] goal_difference
- [ ] points
- [ ] rank

Acceptance criteria:

- [ ] League standings update after each fixture
- [ ] Cup winners progress correctly
- [ ] Season transition can generate new competitions

---

## 3.10 Board, finance, and inbox

### `board_objectives`

- [ ] id
- [ ] career_id
- [ ] club_id
- [ ] category (`domestic`, `continental`, `brand`, `financial`, `youth`)
- [ ] priority (`low`, `medium`, `high`, `critical`)
- [ ] description
- [ ] target_json
- [ ] progress_json
- [ ] is_completed
- [ ] is_failed

### `manager_reviews`

- [ ] id
- [ ] career_id
- [ ] review_date
- [ ] manager_rating
- [ ] summary
- [ ] risk_status (`safe`, `warning`, `danger`)

### `finance_ledger`

- [ ] id
- [ ] career_id
- [ ] club_id
- [ ] entry_date
- [ ] type (`transfer_in`, `transfer_out`, `wages`, `prize_money`, `bonus`, `misc`)
- [ ] amount
- [ ] notes

### `inbox_messages`

- [ ] id
- [ ] career_id
- [ ] sent_on
- [ ] category (`board`, `transfer`, `scouting`, `competition`, `news`, `youth`)
- [ ] subject
- [ ] body
- [ ] is_read
- [ ] action_payload_json nullable

Acceptance criteria:

- [ ] Inbox fills with useful events
- [ ] Manager rating changes over time
- [ ] Finance ledger matches transfers and wages

---

## 3.11 Lifecycle/history tables

### `season_summaries`

- [ ] id
- [ ] career_id
- [ ] season_number
- [ ] controlled_club_id
- [ ] final_league_position nullable
- [ ] trophies_json
- [ ] manager_rating_end
- [ ] budget_end

### `retirements`

- [ ] id
- [ ] career_id
- [ ] player_id
- [ ] retired_on
- [ ] age_at_retirement

### `regens`

- [ ] id
- [ ] career_id
- [ ] original_player_id
- [ ] new_player_id
- [ ] generated_on

### `sim_logs`

- [ ] id
- [ ] career_id
- [ ] sim_date
- [ ] event_type
- [ ] message

Acceptance criteria:

- [ ] You can audit key changes in the save

---

## 4) Seeding the database

### Must-have seed data

- [ ] Nations
- [ ] 3–5 leagues minimum for prototype
- [ ] 40–100 clubs minimum for prototype
- [ ] 1,000+ players minimum for believable transfer market
- [ ] Competition templates
- [ ] Starting fixtures for at least one season
- [ ] Board objective templates
- [ ] Scout names / manager names / youth name pools

### Recommended strategy

- [ ] Start with fictional but realistic data
- [ ] Add importer pipeline later
- [ ] Build seed scripts that can:
  - [ ] reset DB
  - [ ] load reference data
  - [ ] create demo careers

Acceptance criteria:

- [ ] Fresh seed produces a playable prototype career

---

## 5) Simulation systems

## 5.1 Calendar system

- [ ] Implement `advanceDay`
- [ ] Implement `advanceToNextFixture`
- [ ] Implement `advanceToDate`
- [ ] Trigger order for each day:

```txt
1. open/close transfer windows
2. process scouting reports
3. process training
4. process injuries/suspensions recovery
5. process contract reminders
6. process fixture simulation
7. update tables/objectives/finances
8. create inbox messages
9. autosave
```

Acceptance criteria:

- [ ] Daily progression is stable
- [ ] No duplicate event firing on refresh

---

## 5.2 Match simulation

- [ ] Build a lightweight result simulator
- [ ] Use club strength + squad quality + morale + fitness + home advantage
- [ ] Generate:
  - [ ] scoreline
  - [ ] scorers
  - [ ] cards
  - [ ] injuries (rare)
- [ ] Make knockout fixtures handle:
  - [ ] draw rules
  - [ ] extra time
  - [ ] penalties

### Suggested formula inputs

- [ ] team attack rating
- [ ] team defense rating
- [ ] starting XI average overall
- [ ] morale modifier
- [ ] fitness modifier
- [ ] form modifier
- [ ] home advantage modifier

Acceptance criteria:

- [ ] Better teams win more often but not always
- [ ] Results distribution feels plausible

---

## 5.3 Transfers

- [ ] Build AI transfer target generation
- [ ] Build club interest logic
- [ ] Build valuation function
- [ ] Build negotiation ranges
- [ ] Build refusal reasons
- [ ] Build deadline-day urgency modifier

### Transfer AI rules

- [ ] Clubs replace weak positions
- [ ] Rich clubs bid higher
- [ ] Old players more likely sold if wages are high
- [ ] Prospects more likely loaned
- [ ] Squad depth matters

Acceptance criteria:

- [ ] AI clubs buy and sell without user involvement
- [ ] User can negotiate transfer fee and contract separately

---

## 5.4 Contracts

- [ ] Detect expiring contracts
- [ ] Allow renewals
- [ ] Support role, years, wage, bonus, release clause
- [ ] Trigger pre-contract/free-agent logic later if needed

Acceptance criteria:

- [ ] Contract expiry can lead to free agency
- [ ] Wage budget changes correctly

---

## 5.5 Scouting

- [ ] Implement transfer scouting duration
- [ ] Implement report uncertainty ranges
- [ ] Implement youth scouting quality weights from scout ratings
- [ ] Implement nation/player-type filters

Acceptance criteria:

- [ ] Scouting is useful but not omniscient
- [ ] Better scouts produce better report quality

---

## 5.6 Youth academy

- [ ] Monthly generation of prospects
- [ ] Randomly generate names, nationality, position, attribute bias
- [ ] Store OVR/POT ranges until fully known
- [ ] Allow release/promotion
- [ ] Add youth objective support

Acceptance criteria:

- [ ] Academy can hold multiple prospects
- [ ] Promotion creates senior squad availability immediately

---

## 5.7 Training

- [ ] Weekly training cycle
- [ ] Up to 5 players per week
- [ ] Define drill templates
- [ ] Grant development points / attribute deltas
- [ ] Add training fatigue cost if desired

Acceptance criteria:

- [ ] Training improves players over time
- [ ] Young players grow faster than veterans

---

## 5.8 Growth, aging, retirement, regens

- [ ] Annual age increment
- [ ] Age curve model
- [ ] Retirement probability by age + overall + role
- [ ] Regen creation for retired notable players
- [ ] Preserve nationality/position profile in regens

Acceptance criteria:

- [ ] Long saves remain populated
- [ ] Aging is visible over multiple seasons

---

## 5.9 Board objectives and manager rating

- [ ] Generate club-specific objectives at season start
- [ ] Weight by club prestige
- [ ] Track:
  - [ ] league finish
  - [ ] cup progress
  - [ ] financial balance
  - [ ] youth promotions
  - [ ] wins in key matches
- [ ] Recalculate manager rating weekly or after major events

Acceptance criteria:

- [ ] User can succeed or get sacked
- [ ] Different clubs feel different in expectations

---

## 6) UI/UX guide — FIFA 19 style without copying assets

## 6.1 UI principles

- [ ] Dark, glossy, sports-broadcast-inspired interface
- [ ] High contrast
- [ ] Strong use of cards, tabs, horizontal nav, accent gradients
- [ ] Large hero panel in center
- [ ] Side panels for quick summary
- [ ] White text, muted gray secondary text
- [ ] Accent colors by competition/club context

### Visual language to aim for

- [ ] Top-level dashboard
- [ ] left/right card rails
- [ ] news tile + next fixture tile
- [ ] clean stat rows
- [ ] bold headers
- [ ] compact table-like squad screens
- [ ] modal negotiation scenes

### Avoid

- [ ] exact FIFA logos
- [ ] exact EA typography
- [ ] exact UEFA branding
- [ ] copied art/layout pixel-for-pixel

---

## 6.2 Design tokens

### Colors

- [ ] Background: near-black / deep navy
- [ ] Surface: charcoal
- [ ] Elevated cards: slightly lighter slate
- [ ] Primary accent: bright blue/cyan
- [ ] Secondary accent: magenta/purple
- [ ] Success: green
- [ ] Warning: amber
- [ ] Danger: red

### Typography

- [ ] Headings: bold geometric sans
- [ ] Body: clean sans
- [ ] Numbers: tabular style if possible

### Spacing

- [ ] Tight, console-like density
- [ ] 8px base spacing system
- [ ] Larger 16/24/32 for panels

### Shape

- [ ] Mostly rectangular panels
- [ ] Slight rounding only
- [ ] Sharp divider lines
- [ ] subtle glow/gradient borders

Acceptance criteria:

- [ ] A screenshot of your app feels “FIFA-adjacent” even with original assets

---

## 6.3 App shell layout

### Global layout

- [ ] Top bar
  - [ ] current date
  - [ ] manager name
  - [ ] club crest placeholder
  - [ ] funds summary
- [ ] Primary nav tabs
  - [ ] Central
  - [ ] Squad
  - [ ] Transfers
  - [ ] Office
  - [ ] Season
- [ ] Main content area
- [ ] Right-side quick panel
- [ ] Footer controls/hints

### Core interaction model

- [ ] Keyboard-friendly navigation
- [ ] Controller-style focus states optional
- [ ] Fast tab switching
- [ ] Minimal page reloads

Acceptance criteria:

- [ ] User can navigate all main areas within 2 clicks from dashboard

---

## 6.4 Screen-by-screen UI checklist

### A. Career start screen

- [ ] New Career button
- [ ] Choose Manager Career
- [ ] Club select grid/list
- [ ] Club summary pane
- [ ] Career settings modal

### B. Central hub

- [ ] Next fixture card
- [ ] Calendar strip
- [ ] News tile
- [ ] Board summary tile
- [ ] Standings snapshot
- [ ] Inbox preview
- [ ] Advance day / advance to next match button

### C. Squad hub

- [ ] Formation pitch view
- [ ] Squad list table
- [ ] Player card side panel
- [ ] Reserves and youth tabs
- [ ] Role, morale, fitness indicators

### D. Player details page

- [ ] Overview
- [ ] Attributes
- [ ] Contract
- [ ] Development
- [ ] Stats
- [ ] History

### E. Transfers hub

- [ ] Search filters
- [ ] Scout reports
- [ ] Shortlist
- [ ] Incoming offers
- [ ] Negotiation modal
- [ ] Transfer hub deadline summary

### F. Scouting page

- [ ] Active scouts
- [ ] assignments
- [ ] report inbox
- [ ] scout hire/release modal

### G. Youth academy page

- [ ] academy player table
- [ ] overall/potential ranges
- [ ] status tags
- [ ] promote/release actions

### H. Office page

- [ ] Inbox
- [ ] Board objectives
- [ ] finances
- [ ] career settings
- [ ] save game

### I. Season page

- [ ] full calendar
- [ ] standings
- [ ] stats leaders
- [ ] fixtures/results
- [ ] competition brackets

Acceptance criteria:

- [ ] All these screens exist in wireframe form before polish

---

## 6.5 UI component list

- [ ] App shell
- [ ] Top nav tabs
- [ ] Panel card
- [ ] Table grid
- [ ] Stat row
- [ ] Progress bar
- [ ] Circular rating badge
- [ ] Club badge placeholder
- [ ] Player avatar placeholder
- [ ] Negotiation modal
- [ ] Calendar strip
- [ ] Inbox list
- [ ] Transfer item row
- [ ] Scout report card
- [ ] Youth prospect card
- [ ] Standings table
- [ ] Fixture tile
- [ ] Button variants
- [ ] Badge/chip variants
- [ ] Toast/notification system

Acceptance criteria:

- [ ] Reusable components exist before advanced screen polish

---

## 7) Backend service layer

### Required services

- [ ] `careerService`
- [ ] `calendarService`
- [ ] `fixtureSimService`
- [ ] `transferService`
- [ ] `contractService`
- [ ] `scoutService`
- [ ] `youthService`
- [ ] `growthService`
- [ ] `boardService`
- [ ] `financeService`
- [ ] `inboxService`
- [ ] `saveService`

### Required service methods

- [ ] `createCareer`
- [ ] `advanceDay`
- [ ] `advanceToNextFixture`
- [ ] `simulateFixture`
- [ ] `submitTransferOffer`
- [ ] `respondToTransferOffer`
- [ ] `renewContract`
- [ ] `assignScout`
- [ ] `generateScoutReport`
- [ ] `promoteYouthPlayer`
- [ ] `processWeeklyTraining`
- [ ] `processSeasonTransition`
- [ ] `recalculateBoardRating`

Acceptance criteria:

- [ ] Every major UI action maps cleanly to one service method

---

## 8) API routes

### Suggested route groups

- [ ] `/api/careers`
- [ ] `/api/careers/:id/dashboard`
- [ ] `/api/careers/:id/advance-day`
- [ ] `/api/careers/:id/squad`
- [ ] `/api/careers/:id/player/:playerId`
- [ ] `/api/careers/:id/transfers`
- [ ] `/api/careers/:id/scouting`
- [ ] `/api/careers/:id/youth`
- [ ] `/api/careers/:id/office`
- [ ] `/api/careers/:id/season`

### API rules

- [ ] Keep endpoints coarse-grained
- [ ] Return DTOs shaped for screens
- [ ] Do not make frontend compute core sim logic

Acceptance criteria:

- [ ] Dashboard loads from one endpoint
- [ ] Advancing a day is one POST call

---

## 9) Screen implementation order

### Phase A — foundation

- [ ] App shell
- [ ] career creation flow
- [ ] dashboard
- [ ] advance day
- [ ] basic squad page

### Phase B — playable loop

- [ ] fixtures
- [ ] standings
- [ ] match simulation
- [ ] inbox
- [ ] season progression

### Phase C — management depth

- [ ] transfers
- [ ] contracts
- [ ] scouting
- [ ] youth academy
- [ ] board objectives
- [ ] finances

### Phase D — long-term systems

- [ ] training
- [ ] growth
- [ ] aging
- [ ] retirements
- [ ] regens
- [ ] season rollover

### Phase E — polish

- [ ] animation
- [ ] sound placeholders
- [ ] visual theming
- [ ] keyboard nav
- [ ] loading states
- [ ] autosave UI

Acceptance criteria:

- [ ] Do not start polish before Phase C is functional

---

## 10) Match-sim data model and formulas

### Team strength calculation

- [ ] Calculate per club per fixture:
  - [ ] XI average OVR
  - [ ] attack unit score
  - [ ] midfield unit score
  - [ ] defense unit score
  - [ ] morale multiplier
  - [ ] fitness multiplier
  - [ ] home advantage

### Simple scoring chance approach

- [ ] expected home goals = formula
- [ ] expected away goals = formula
- [ ] randomize around expectation
- [ ] choose scorers weighted by position + finishing + role

### Example to-do

- [ ] Implement Poisson-like or weighted random score generation
- [ ] Add upset probability
- [ ] Add derby/rivalry tension small modifier

Acceptance criteria:

- [ ] Sim results look believable across 500+ test matches

---

## 11) AI club behavior

### Club profile system

- [ ] Define club recruitment style:
  - [ ] elite spender
  - [ ] youth-focused
  - [ ] selling club
  - [ ] balanced
  - [ ] survival/cheap
- [ ] Define wage discipline
- [ ] Define average age preference

### AI weekly tasks

- [ ] assess weak positions
- [ ] assess expiring contracts
- [ ] shortlist targets
- [ ] bid if transfer window open
- [ ] loan out prospects
- [ ] renew key players

Acceptance criteria:

- [ ] The world changes even if the user does nothing

---

## 12) Save/load and reliability

### Save system

- [ ] Manual save
- [ ] Autosave on advance day
- [ ] Save slots
- [ ] Career metadata list

### Reliability

- [ ] Wrap major sim operations in DB transaction
- [ ] Log failures
- [ ] Validate career ownership and IDs
- [ ] Add migration strategy

Acceptance criteria:

- [ ] Corrupted partial day advances are prevented by transactions

---

## 13) Testing plan

### Unit tests

- [ ] player valuation
- [ ] transfer acceptance logic
- [ ] growth calculations
- [ ] retirement logic
- [ ] board rating updates
- [ ] fixture sim distributions

### Integration tests

- [ ] create career
- [ ] advance 30 days
- [ ] complete one transfer
- [ ] generate scout report
- [ ] complete one season

### Simulation soak tests

- [ ] simulate 10 seasons headless
- [ ] detect DB inconsistencies
- [ ] ensure no duplicate roster assignments
- [ ] ensure league tables remain valid

Acceptance criteria:

- [ ] Headless 3-season test passes before public release

---

## 14) Performance checklist

- [ ] Add indexes on:
  - [ ] `career_rosters(career_id, club_id)`
  - [ ] `fixtures(career_id, scheduled_date)`
  - [ ] `inbox_messages(career_id, sent_on)`
  - [ ] `transfer_offers(career_id, status)`
  - [ ] `board_objectives(career_id, club_id)`
- [ ] Batch updates during day advance
- [ ] Cache dashboard DTOs if needed
- [ ] Paginate big lists

Acceptance criteria:

- [ ] Advance-day action stays responsive with multi-season saves

---

## 15) Art and UI production checklist

### Need custom assets

- [ ] generic club crest placeholders
- [ ] competition icons
- [ ] player silhouette avatars
- [ ] flag icons
- [ ] tab icons
- [ ] background textures
- [ ] card gloss overlays

### Style board

- [ ] Make a moodboard inspired by 2018–2019 sports game menus
- [ ] Define card states: default, focused, active, disabled
- [ ] Define animation timing

Acceptance criteria:

- [ ] UI remains cohesive without copied branding

---

## 16) Milestone plan

## Milestone 1 — Database + career creation

- [ ] SQLite schema complete
- [ ] seed data loaded
- [ ] create career flow working

## Milestone 2 — Calendar + dashboard

- [ ] advance day works
- [ ] dashboard loads current state
- [ ] inbox messages appear

## Milestone 3 — Fixtures + standings

- [ ] simulated matches
- [ ] standings update
- [ ] season calendar works

## Milestone 4 — Squad management

- [ ] player details
- [ ] formation/squad view
- [ ] morale/fitness display

## Milestone 5 — Transfers + contracts

- [ ] scouting for targets
- [ ] transfer bids
- [ ] renewals
- [ ] AI transfer activity

## Milestone 6 — Youth + training

- [ ] youth reports
- [ ] academy
- [ ] promotion
- [ ] weekly training

## Milestone 7 — Board + finance

- [ ] objectives
- [ ] rating
- [ ] budget logic
- [ ] sack flow

## Milestone 8 — Season rollover

- [ ] retirements
- [ ] regens
- [ ] new fixtures
- [ ] new objectives

## Milestone 9 — Polish

- [ ] FIFA-19-like visual rhythm
- [ ] keyboard polish
- [ ] loading/transition states
- [ ] QA pass

---

## 17) Nice-to-have after v1

- [ ] Player Career mode
- [ ] International management
- [ ] Press/news generation
- [ ] Team of the week / awards
- [ ] More detailed player histories
- [ ] Tactical presets
- [ ] Export/import save
- [ ] Difficulty sliders
- [ ] Modding tools/admin panel

---

## 18) First 14 days execution plan

### Day 1

- [ ] initialize project
- [ ] add Tailwind
- [ ] add SQLite + ORM
- [ ] create migration setup

### Day 2

- [ ] create reference schema
- [ ] seed nations, leagues, clubs, positions

### Day 3

- [ ] create players + attributes schema
- [ ] seed player data

### Day 4

- [ ] create careers + career state tables
- [ ] implement create career flow

### Day 5

- [ ] build dashboard wireframe
- [ ] load top bar, next fixture, funds, inbox preview

### Day 6

- [ ] implement fixtures + standings tables
- [ ] seed one season schedule

### Day 7

- [ ] implement `advanceDay`
- [ ] generate inbox and standings changes

### Day 8

- [ ] implement match sim
- [ ] test 100 fixtures

### Day 9

- [ ] build squad page
- [ ] player detail page

### Day 10

- [ ] implement transfer tables and service skeleton

### Day 11

- [ ] build transfer hub UI
- [ ] shortlist + offers list

### Day 12

- [ ] implement scouting + scout reports

### Day 13

- [ ] implement youth academy

### Day 14

- [ ] implement board objectives and manager rating basics

Acceptance criteria:

- [ ] At end of day 14, prototype is actually playable

---

## 19) Risk list

- [ ] Risk: overbuilding before playable loop
  - [ ] fix by shipping dashboard + advance day first
- [ ] Risk: UI too pretty, no simulation depth
  - [ ] fix by prioritizing services and schema
- [ ] Risk: transfer AI becomes chaotic
  - [ ] fix by adding strict club logic and budget checks
- [ ] Risk: season rollover bugs
  - [ ] fix by writing integration tests early
- [ ] Risk: copying FIFA too literally
  - [ ] fix by using original art and naming

---

## 20) Final implementation rulebook

- [ ] Build **playable > perfect**
- [ ] Keep all core sim logic on backend
- [ ] Use SQLite transactions for major actions
- [ ] Finish one vertical slice before adding side systems
- [ ] Test multi-season stability early
- [ ] Match FIFA 19’s **structure and feel**, not its copyrighted assets
- [ ] Always ask: “does this help the daily career loop feel real?”

---

## 21) Minimum vertical slice checklist

Before doing “full version,” make sure this smaller version works:

- [ ] Create career with one club
- [ ] View dashboard
- [ ] Advance day
- [ ] Sim next fixture
- [ ] Update standings
- [ ] View squad
- [ ] Receive inbox messages
- [ ] Make one transfer
- [ ] Promote one youth player
- [ ] End season

If all 10 work, continue. If not, stop and fix before adding more.

---

## 22) Suggested next file list

Create these files next:

```txt
/server/db/schema.ts
/server/db/seed.ts
/server/services/careerService.ts
/server/services/calendarService.ts
/server/services/fixtureSimService.ts
/server/services/transferService.ts
/server/services/scoutService.ts
/server/services/youthService.ts
/server/services/boardService.ts
/features/dashboard/DashboardPage.tsx
/features/squad/SquadPage.tsx
/features/transfers/TransfersPage.tsx
/features/office/OfficePage.tsx
/features/season/SeasonPage.tsx
```

---

## 23) My recommendation on build order

Build in this exact order:

1. [ ] schema + seed
2. [ ] create career
3. [ ] dashboard
4. [ ] advance day
5. [ ] fixtures + standings
6. [ ] squad
7. [ ] transfers
8. [ ] scouting
9. [ ] youth
10. [ ] board + finance
11. [ ] training + growth
12. [ ] retirement + regens
13. [ ] polish

Do not reverse this order.

---

## 24) Success benchmark

Your app is successful when:

- [ ] it feels fun to click through a season
- [ ] club identity matters
- [ ] squad building matters
- [ ] the transfer market feels alive
- [ ] youth development feels rewarding
- [ ] you can lose your job if you mismanage the club
- [ ] multiple seasons remain stable
