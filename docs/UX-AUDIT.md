# UX Audit — mobile + desktop (2026-07-05)

Full-app UX pass across four dimensions (mobile, desktop, accessibility/interaction,
onboarding/IA), run as parallel read-only audits over `apps/web/src`. This is the
prioritized synthesis; findings are grouped by **impact tier**, not by dimension, so
the highest-leverage work is at the top. File:line references point at the code to
change.

The through-line: **the app is built mobile-first but styled desktop-only.**
`index.css` contains just two `min-width: 1100px` blocks plus a reduced-motion query —
there is no phone breakpoint anywhere, and on desktop everything except the Routes map
lives in a single centered 1060px column. So most layout wins are "add the breakpoint /
grid that was never written," and the biggest correctness issue is a genuine crash, not
a cosmetic one.

---

## P0 — correctness & data-loss (do first; some of these are bugs, not polish)

### 0.1 A broken run white-screens the whole app (no dataset guard / ErrorBoundary)
`screens/RunView.tsx:99-103` builds `ctx = { dataset: DATASETS[run.gameId], ... }` and
calls `deriveState(events, ctx)` **unconditionally**. The header already defends with
`ctx.dataset?.name ?? run.gameId` (line 116), proving the author knows `dataset` can be
undefined — but `deriveState` and every area/roster lookup still run against it and
throw with no catch. There is no `ErrorBoundary` anywhere in the app. This is exactly
the known-broken-run risk (pre-split PLA runs referencing dead zone ids, or a run under
a since-removed gameId). `CrossRunStatsScreen.tsx:23` and `SpectatorView.tsx:62` both
guard `if (!dataset) skip` — RunView is the one owner path that doesn't.
**Fix:** add a top-level `ErrorBoundary` with a "this run couldn't be loaded → Back to
runs / Export" fallback, and an early `if (!ctx.dataset) return <UnsupportedRun/>` in
RunView. **This is a crash bug — promote to its own PR.**

### 0.2 Destructive actions fire on one unguarded click, no confirm, no undo
Marking a mon **Fainted** — the most consequential act in a nuzlocke — is a single
click on a `.secondary` button sitting right next to "Box" (`TeamBoxTab.tsx:26-30`,
buttons at `:52`/`:72`). `Reset route` deletes caught Pokémon (`AreaList.tsx:59-60`),
as does special `Reset` (`SpecialsSection.tsx:96-115`); `UnevolveButton`
(`MonCard.tsx:224-240`) likewise. The code comment "one seamless click — no prompts"
is deliberate, but there is no compensating safety net. The app already has the right
pattern: `EndRunControl` (`RunView.tsx:45-66`) uses inline expand-to-confirm.
**Fix:** reuse that expand-to-confirm (or a toast-with-undo) for Fainted and the two
Resets; at minimum style them `.danger` not `.secondary` and add descriptive
`aria-label`s.

### 0.3 No way to delete or export a run
`ContinueScreen` (`RunPicker.tsx:20-41`) has no per-run actions. A run can be created
but never removed or exported from the UI, so a single corrupt/legacy run is a
permanent row (today, a permanent crash via 0.1).
**Fix:** per-run overflow menu (Delete, Export JSON); for unsupported-gameId runs,
offer export/delete only.

---

## P1 — high-leverage layout & comprehension

### Mobile (there is no mobile stylesheet yet)
- **Sticky bottom tab bar.** `.tabs` (`index.css:679`) is a static in-flow pill that
  scrolls off the top; after a long Routes/Team list, switching tabs means scrolling
  all the way back up. On ≤~500px make it `position: fixed; bottom: 0` with equal-width
  items + `env(safe-area-inset-bottom)`, and pad `#root` bottom. (This is the
  long-noted "sticky mobile tab bar" nice-to-have.)
- **Touch targets ≥44px.** Map zoom controls are ~38.5px (`index.css:2099`
  `.route-map-controls button { width:2.2rem }`); box slots (`index.css:2028`) and
  several chips are borderline. Bump on touch.
- **Touch-first map/encounter preview.** The species/catch-rate tip is hover/focus-only
  (`RouteMap.tsx:317-320`); on touch a tap immediately resolves (`:321`), so mobile
  users never see the preview desktop users get. Make first tap preview, second tap
  resolve — or always render the preview in the resolve panel.
- **`.route-tip` clamps.** `max-width:220px` + `translate(-50%)` at a region's center
  (`index.css:2277`) overflows the viewport for edge regions on ~360px. Clamp to the
  map container.
- **Grids that assume width.** `.milestone-card-detail`/`.trainer-row-detail` use
  `minmax(300px,1fr)` (`index.css:922`, `:561`) — overflows at 320px. Lower to ~240px.
  `.auth-bar` should `flex-wrap` (addressed in the OAuth PR).

### Desktop (break out of the single 1060px column)
- **Stats dashboard → grid.** Seven chart sections stack vertically, each a small SVG +
  legend leaving ~60% width empty (`StatsTab.tsx:33-58`, `.chart-block` `index.css:1166`).
  Wrap in `repeat(auto-fit, minmax(340px,1fr))`; keep timeline/graveyard full-width.
- **Team / Box / Graveyard side-by-side.** Three stacked full-width sections force
  scroll and break the "see team + box together" PC mental model (`TeamBoxTab.tsx:37-96`).
  Use a 2-column region on ≥1024px.
- **Expanded-card full-row reflow.** `.mon-card.expanded`/`.milestone-card.expanded`
  use `grid-column: 1 / -1` (`index.css:1944`, `:819`), so expanding one card on a
  5–6-wide grid shoves the whole row down — jarring. Cap to `span 2` at wide widths or
  use a side panel.
- **Rules & cross-run charts → 2 columns** (`RulesTab.tsx:61-96`;
  `CrossRunStatsScreen.tsx:68-104`) — both are thin single columns with a dead right half.
- **Tablet dead zone.** `#root` is 720px until the `min-width:1100px` flip, so 900–1099px
  windows (split-screen, small laptops) render the whole app in a 720px column with wide
  empty margins and the map capped at 720px. Add an intermediate breakpoint (~820px → 960px).
- **Tab bar treatment.** Active tab is fill-color-only, left-hugging via `width:fit-content`
  (`index.css:688`). Add a stronger active indicator and per-tab counts
  (e.g. "Team & Box · 6"); consider `role="tablist"`/`aria-selected`.

### Onboarding / IA
- **Explain the nuzlocke.** Nothing in the app states the two core rules
  (first-encounter-only; a faint is permanent). Add a collapsible "New to nuzlockes?"
  on the title/new-game screen.
- **Friendly run list.** ContinueScreen shows raw `gameId`/`version` slugs
  (`RunPicker.tsx:33-35`) while `ProfileScreen` already has `gameName()`/`prettyVersion()`.
  Reuse them; add mascot, status chip, progress ("3/8 bosses").
- **Login value-prop.** Share/spectator/profiles/feed render literally nothing when
  signed out (`RunView.tsx:123`, `ProfileSetup.tsx:34`, `FollowFeed.tsx:40`); the only
  cue is "○ Sign in to sync" with no statement of what sync unlocks. Add one line:
  "Sign in to sync across devices, share runs, and follow friends." (The new OAuth
  buttons in PR #139 make signing in easier — pair with this copy.)
- **Rules copy.** `RulesTab.tsx:57-58,99-101` renders literal backticks and internal
  event-type names (`rule_changed`, `house_rules_changed`, "the event log"). Rewrite in
  plain English and add an enforced-vs-honor legend at the top of the tab.
- **Gloss the jargon:** "honor/enforced", "set mode", "level-cap headroom", "frontier",
  "dupes clause" all appear undefined (`RunPicker.tsx:11-15`, `StatsTab.tsx:46`,
  `AllFilteredOut.tsx:18`).

### Keyboard operability (blocks whole tasks, not just polish)
- **Clickable `<div>`s must be buttons.** `AreaList.tsx:43-51` (expand a route to resolve
  its encounter — the core task in map-less games) and `RunPicker.tsx:32-38` (continue a
  run) are `<div onClick>` with no role/tabIndex/keydown → unreachable by keyboard. The
  codebase does this right in `MilestoneCard`/`TrainersHere`, so these are inconsistent
  misses. Make them real `<button>`s.
- **Restore focus-visible.** `index.css:318-357` sets `outline:none` and replaces it with
  a low-alpha ring that several custom buttons (`.secondary`, `.tabs button`, chips,
  tiles, expand-toggles) don't define at all, and `.route-region-g { outline:none }`
  (`:2120`) suppresses map focus with `:focus` styling only for the `available` state.
  Add one robust `:focus-visible` token applied everywhere, including resolved map regions.

---

## P2 — polish (worthwhile, lower urgency)

- **Combobox ARIA:** input lacks `role="combobox"`/`aria-expanded`/`aria-controls`/
  `aria-activedescendant` (`Combobox.tsx:74-94`); screen readers can't hear move/item
  suggestions. Also `position:fixed` from a one-time `getBoundingClientRect` drifts when
  the mobile keyboard opens (`:98-124`) — use `visualViewport` events.
- **Status not color-only:** run status (`index.css:671`), summary tones
  (`RunSummaryStrip.tsx:71`), and map region tints lean on color; pair with a glyph/text
  token (milestones already do "✓ cleared").
- **Muted-text contrast:** `--muted #8b949e` at 0.7–0.88rem is borderline AA on lighter
  per-theme panels (`.picker-tile-desc`, `.encounter-slot-method`); lighten or bump size.
- **Form validation:** level fields silently coerce bad input to 1
  (`EncounterForm.tsx:68`, `CatchFields.tsx:31`, `MonCard.tsx:49-50`) with no message —
  looks like lost input. Validate on blur, show `role="alert"`, set `aria-invalid`.
- **Live regions:** AuthBar sent/error and the sync badge aren't announced
  (`AuthBar.tsx`, `App.tsx:150-156`); wrap in `role="status"`/`aria-live` (OAuth PR adds
  `role="alert"` to the auth error).
- **Share popover focus management:** `SharePopover.tsx:72-99` handles Escape/outside-click
  but doesn't move focus in, trap it, add `aria-modal`, or restore focus on close.
- **First-run empty states:** "Empty.", "None.", "No deaths yet." sit alone in a wide
  section reading as unfinished; turn the primary one (empty Team) into a CTA pointing at
  Routes.
- **Reduced-motion:** the blanket duration-zero query leaves looping decorative keyframes
  (`selectedPulse`, `ballBob`, `frontierBreathe`) in a mid-keyframe state; set
  `animation: none` for those under the query.
- **Graveyard duplicated** across Team&Box and Stats tabs with different presentation —
  pick one interactive home.
- **Next-boss pin discoverability:** buried in an expanded milestone card; for open-order
  games (SV) surface a hint that order sets the level cap (`MilestoneCard.tsx:131-141`).

---

## Suggested sequencing

1. **P0 as one "run robustness" PR** — ErrorBoundary + dataset guard + delete/export +
   confirm-on-destructive. Correctness first; this prevents real data loss and crashes.
2. **Mobile stylesheet PR** — bottom tab bar, touch targets, touch-first map preview,
   grid `minmax` fixes. Highest user-visible payoff (the app is used on phones per #112).
3. **Desktop layout PR** — Stats/Team-Box/Rules/cross-run grids, expanded-card span cap,
   tablet breakpoint.
4. **Onboarding & copy PR** — nuzlocke explainer, friendly run list, login value-prop,
   Rules plain-English + legend, jargon glosses.
5. **Keyboard/a11y PR** — button-ify clickable divs, global focus-visible, combobox ARIA,
   live regions.

Full per-dimension finding lists (with every low-severity item) were produced by the
four audit agents in the 2026-07-05 session and are summarized above; nothing material
was dropped, but the long tail of sub-12px-font and micro-contrast nits lives in P2.

---

# Follow-up assessment — in-flight PR changes (2026-07-05, post-deploy)

After the initial audit, changes shipped that touch UX surfaces: **OAuth-only sign-in**
(#142 — magic-link email removed) and **profile discovery + fixes** (#143 — trainer
search moved to the landing page, self-service profile delete, a back button on the
profile/spectator route, and the get_profile not-found fix). This section evaluates those
against the audit above and adds findings for the new surfaces (independent assessment).

## What the changes did to existing findings

- **P1 Onboarding "Login value-prop" — partially addressed.** OAuth buttons make signing
  in one click instead of typing an email — the mechanical half the audit anticipated. But
  the *copy* half is still missing: signed-out users still see only `○ Sign in to sync`
  with no statement of what sync unlocks, and TrainerSearch/FollowFeed/ProfileSetup still
  render nothing when signed out. Reduced, not resolved.
- **P2 "Live regions" — partially addressed.** The auth *error* is now wrapped in
  `role="alert"` (`AuthBar.tsx`), as the audit predicted. The sync badge still isn't in a
  live region. Half done.
- **P1 Mobile ".auth-bar flex-wrap" — addressed.** The signed-out bar now stacks providers
  full-width in a 340px column (`.auth-bar-stack`).
- **P1 Keyboard "clickable `<div>`s must be buttons" — now MORE relevant.** The public
  profile page renders each shared-run row as `<div onClick>` (`ProfileScreen.tsx:81`) —
  the same anti-pattern the audit flags for AreaList/RunPicker. Trainer search now routes
  users straight into ProfileScreen, so this keyboard trap is more reachable. Add
  ProfileScreen rows to that finding's list.
- **Two gaps the original audit did NOT list are now closed:** back-navigation from the
  profile/spectator route (a real dead end before), and trainer discovery (no way to find
  a profile without knowing its exact handle). Credit, not resolutions.

## New findings on the new surfaces

### High

- **NF-H1 — OAuth-only can dead-end sign-in with no recovery.** With email removed, if
  `VITE_OAUTH_PROVIDERS` is unset/misconfigured in a deploy, a signed-out user sees the
  `○ Sign in to sync` badge but the auth bar renders `null` — **no control to sign in at
  all** (`AuthBar.tsx`, the `OAUTH_PROVIDERS.length === 0` early return). Email used to be
  an always-available fallback; now one missing env var silently bricks auth with no
  on-screen diagnostic. Fix: when signed out with zero providers, render a visible
  "sign-in temporarily unavailable" fallback and/or stop presenting the sync badge as
  actionable; log a dev warning. (Flip side of the same env-gating that caused the earlier
  prod crash — treat providers-empty as a real UI state.)

### Medium

- **NF-M1 — TrainerSearch fires a Supabase RPC on every keystroke (no debounce)**
  (`TrainerSearch.tsx`). "pikachu" = 6 RPCs. The `latest` ref prevents out-of-order
  *rendering* but not the *requests* — metered cost + rate-limit exposure (COSTS.md). Fix:
  debounce ~250–300ms before `searchProfiles`, keep the `latest` guard for the response.
  (Also fixes NF-L3.)
- **NF-M2 — Search result rows are sub-44px touch targets and lack a live region.** Result
  `<a>` rows are ~30–32px tall (`.trainer-search-results`) — under the 44px mobile bar —
  and the results/"Searching…" region isn't `aria-live`. Fix: ≥44px touch height; wrap
  results in `aria-live="polite"`.
- **NF-M3 — Landing social section has weak hierarchy and sits below the fold.** The title
  hero fills most of a phone viewport, so TrainerSearch + FollowFeed land below it with no
  scroll cue, and both use the muted, recessive `route-offmap-title` heading (a borrowed
  class), so discovery reads as an afterthought. Fix: wrap the social area in a real
  section with a proper heading + top border/margin; don't reuse the muted route heading.

### Low

- **NF-L1 — "Delete profile" trigger has no danger cue and doesn't move focus on expand.**
  The expand-to-confirm is correct and the copy is clear, but the entry button is
  `.secondary` (only the second button is `.danger`) and focus isn't moved into the confirm
  row. Low because the destructive action is behind the second click.
- **NF-L2 — Back button on the read-only route doesn't reset focus after navigating home**
  (`App.tsx` goHome). Lands on the title screen correctly, but focus drops to `<body>`.
- **NF-L3 — "No trainers match" flickers for a keystroke before the next result resolves.**
  Symptom of NF-M1's missing debounce; fixed by adding it.

**Bottom line:** net-positive (two unlisted gaps closed, mechanical halves of two findings
delivered), but the copy/announcement halves remain open and there's one real regression
risk (NF-H1) plus a metered-cost issue (NF-M1). Suggested follow-up order: NF-H1 →
NF-M1/M2 → the remaining copy/live-region halves → NF-M3/L1/L2 polish.
