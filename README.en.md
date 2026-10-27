<p align="center">
  <img src="assets/readme/banner.png" alt="Setlist — pixel stage with stacks, fire and crowd" width="768">
</p>

<p align="center">
  <a href="https://cyphomat.github.io/setlist/"><img alt="Open app" src="https://img.shields.io/badge/App-open-e8a23d?style=for-the-badge&labelColor=17161b"></a>
  <img alt="Tests" src="https://img.shields.io/badge/Tests-2572%20green-7fa65c?style=for-the-badge&labelColor=17161b">
  <img alt="Build" src="https://img.shields.io/badge/Build-none-6f93ad?style=for-the-badge&labelColor=17161b">
  <img alt="Dependencies" src="https://img.shields.io/badge/Dependencies-0-a7a3ab?style=for-the-badge&labelColor=17161b">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-c98a4b?style=for-the-badge&labelColor=17161b"></a>
</p>

<p align="center">
  <b>A training planner for one person.</b><br>
  Twice strength, twice bike per week. The week is a setlist.
</p>

<p align="center">
  <sub>100% vibe coded. Use at your own risk. Feature requests welcome.</sub>
</p>

<p align="center">
  <b>English</b> · <a href="README.md">Deutsch</a> · <a href="CHANGELOG.md">Changelog</a>
</p>

<h3 align="center">Get started → <a href="https://cyphomat.github.io/setlist/">cyphomat.github.io/setlist</a></h3>

<p align="center">
  <b>1</b> · <a href="https://cyphomat.github.io/setlist/">Open the app</a> and tap <b>Start locally</b>. No account, no sign-up; your programme is set up in a minute.<br>
  <b>2</b> · Add it to your home screen (iPhone: Safari → Share → <i>Add to Home Screen</i>). Then it runs offline and Safari will not clear your data.<br>
  <b>3</b> · Now and then, download a backup under <i>Backstage → App → Data</i>. That is also how you move to your next device.
</p>

<p align="center">
  <sub>Your training data stays in this browser (<a href="#data">more</a>). Prefer your own private GitHub repo, several devices, or the code in your own hands? <a href="#-setting-it-up-yourself">Set it up yourself</a>.</sub>
</p>

> **Note on language.** The app comes in German and English — switch it under **Tour → ⚙ Backstage → App**. Bilingual are the whole interface, the daily call including its one word, milestones, small wins, patches and error messages. Only the *exercise content* stays German — explanations, cues, common mistakes, movement standards — along with the built-in sayings, the jam movements and the bike rationales. That is technical text that needs a proper translation rather than a word-for-word one. In your data the day's word is always stored in German, so “call vs. feel” counts the same in both languages.

---

## <img src="assets/readme/i-ansehen.png" width="22" height="22" alt=""> What it looks like

<table>
<tr>
<td width="33%"><img src="assets/screens/home-dunkel.png" alt="Home screen"></td>
<td width="33%"><img src="assets/screens/session-dunkel.png" alt="Session in the gym"></td>
<td width="33%"><img src="assets/screens/geschafft-dunkel.png" alt="After the session"></td>
</tr>
<tr>
<td align="center"><b>The poster</b><br><sub>One word for the day, only exceptions below</sub></td>
<td align="center"><b>In the gym</b><br><sub>Plates, cadence, sets above target</sub></td>
<td align="center"><b>Afterwards</b><br><sub>The win first, the report second</sub></td>
</tr>
</table>

**On a Mac it becomes an overview** — calendar, weekly load, personal bests and trend curves side by side instead of stacked:

<img src="assets/screens/tour-desktop.png" alt="Tour on the Mac, wide layout">

**And this is how you set it up** — the app asks, instead of making you write a JSON file:

<table>
<tr>
<td width="33%"><img src="assets/screens/einrichten-dunkel.png" alt="Guided first-time setup"></td>
<td width="33%"><img src="assets/screens/stimme-dunkel.png" alt="Your voice in the backstage"></td>
<td width="33%"><img src="assets/screens/orte-dunkel.png" alt="Places and equipment"></td>
</tr>
<tr>
<td align="center"><b>First-time setup</b><br><sub>Bar, lifts, training days</sub></td>
<td align="center"><b>Your voice</b><br><sub>Reason, own lines, old bests</sub></td>
<td align="center"><b>Places and equipment</b><br><sub>What is where</sub></td>
</tr>
</table>

**And this is what it tells you about your strength** — not just how much, but where it is out of balance:

<table>
<tr>
<td width="25%"><img src="assets/screens/analyse-dunkel.png" alt="Strength ratios with a diagnosis"></td>
<td width="25%"><img src="assets/screens/fortschritt-dunkel.png" alt="Projection, strength per kilo, plateaus"></td>
<td width="25%"><img src="assets/screens/pruefwerte-dunkel.png" alt="Measuring test values in a max-out"></td>
<td width="25%"><img src="assets/screens/standard-dunkel.png" alt="Movement standard in the library"></td>
</tr>
<tr>
<td align="center"><b>Where you are out of balance</b><br><sub>The same lift in several pairs = the cause</sub></td>
<td align="center"><b>When you are back</b><br><sub>Projection, strength per kilo, plateaus</sub></td>
<td align="center"><b>Test values</b><br><sub>Measured in a max-out, not typed</sub></td>
<td align="center"><b>Counts when</b><br><sub>When the rep is valid</sub></td>
</tr>
</table>

**And a bit of stage** — rank, monthly tour with final boss, patches, records, guitar rack and tour shirts, all from your sessions:

<p align="center">
  <img src="assets/screens/merch-dunkel.png" alt="The merch stand: rank, monthly tour with final boss and battle vest with patches" width="330">
  <img src="assets/screens/rack-dunkel.png" alt="The guitar rack in the merch stand: two guitars hang, the next waits as a dark silhouette for the Opening Act rank" width="330">
</p>

<sub>Real screens with sample data, captured via <code>tools/shot.html</code> and <code>tools/shots.mjs</code>. Not mockups.</sub>

<p align="center">
  <img src="assets/readme/raenge.png" alt="The seven ranks as pixel scenes: garage band, rehearsal room, opening act, support act, headliner, festival headliner, Hall of Fame" width="792">
  <br><sub>Seven ranks, from the garage to the Hall of Fame.</sub>
</p>

<p align="center">
  <img src="assets/readme/merch.png" alt="Merch shelf: four tour shirts, gold and platinum, a row of patches" width="792">
  <br><sub>Tour shirts, gold and platinum, patches. All original pixel art from <code>tools/pixel.mjs</code>, no third-party graphics.</sub>
</p>

---

## What it tells you

The difference from a logbook: it has an opinion about today — from data, not from a gut feeling.

- **The call** reads training layoff, outstanding failed attempts, current streak and form from the bike, and decides between `TECHNIK`, `SOLIDE`, `HART` and `SCHWER` — then asks after the session how it actually felt. That keeps the call verifiable instead of merely asserted.
- **HRV, resting heart rate, how you feel and sleep take priority.** If HRV drops well below your own average of recent days, your resting heart rate is 7 beats above it, you logged heavy soreness or real fatigue, or the night was too short, the app calls TECHNIK — even when the plan or outstanding failures would suggest otherwise. Both see something raw training load does not capture.
- **Interference warning** when a hard ride was less than four hours ago — the last sets get sluggish, maximal strength itself is untouched.
- **Milestones** know your old bests including the date:

  > **From your history** — Yesterday five years ago: 140 kg back squat. Today you are at 65 kg — not because you can do less, but because you are starting again.

- **Small wins** come first after every session. Not the report, but what you achieved.
- **The voice** mixes your own lines with 52 built-in ones, roughly half and half. Editable under **Tour → ⚙ Backstage → Personal** — that is also where *your reason* lives, which only shows up on the hard days.

## How it fits together

```
Zwift ──▶ Strava ──▶ intervals.icu ◀──▶ Setlist ◀──▶ setlist-data (private)
                            │                              │
                       rides, form                 strength progression
```

Setlist owns the **strength** progression — two systems computing the same working weight inevitably drift apart. The **bike** runs the other way: it arrives automatically via Zwift → Strava → intervals.icu, Setlist only shows it as a hint and in return writes every strength session back, so fitness and fatigue live in one curve instead of two separate worlds.

That way back deliberately waits until the next app start: the Apple Watch often detects strength training by heart rate itself and forwards it via Strava with a delay. An immediate push would usually beat it there and the same session would count twice in fitness and fatigue.

## Twice and twice

5×5 was originally built for three sessions a week. At two at most the same mechanics apply, just slower — the 60% rule for coming back would have meant six to nine weeks below the stimulus threshold at this frequency, so it is 80% instead.

|  | Lift 1 | Lift 2 | Lift 3 |
|---|---|---|---|
| **Workout A** | Back Squat 5×5 | Bench Press 5×5 | Barbell Row 5×5 |
| **Workout B** | Back Squat 5×5 | Strict Press 5×5 | Deadlift 1×5 |

Back squat is in both workouts and therefore climbs twice as fast.

---

## <img src="assets/readme/i-funktionen.png" width="22" height="22" alt=""> Features

### Strength

| | |
|---|---|
| **5×5 automation** | Progression, failure counter, deload to 90% after three failed attempts. |
| **Deload after a break** | After 14 days without a strength session, starting suggests a step back: −10 %, from 21 days −20 %, from 42 days −30 %. One tap applies it, one keeps the old weights — nothing changes without you. After that every successful session climbs **twice as fast** until you are back at the pre-break weight; a failed attempt ends the shortcut. Rules of thumb, not measurements. |
| **Plate calculator** | Plates per side. Weights that cannot be loaded exactly are named rather than rounded. Below it a second line with the same load **from 20/10/5/2.5/1.25 only** — the run of plates every gym has in full. Where there are no 25s and 15s, you load `2×20` instead of `25 + 15`. It only shows when it says something different. |
| **Soundcheck** | Warm-up sets derived from the working weight: empty bar, then 55 / 70 / 85%. Every line tickable — tapped means struck through. The cardio line at the top can be replaced with your own opener under Backstage → Personal, e.g. 15 min rowing. |
| **Weight mid-set** | Adjustable during the session — the log reflects what actually happened. |
| **Rest timer** | 90 s, 180 s after a failed attempt, adjustable by ±30 s while running. Ends with vibration and a tone, stops itself after the session's last set. |
| **Aftershow** | Accessory work after the main lifts: pull-ups, chin-ups, dips, push-ups, face pulls, curls, hanging leg raises. Reps per set, next to what you managed last time. No progression, no effect on weights or tonnage. The tour shows your best set for each. |
| **Personal bests** | `Max` (only from a max-out) versus `At least` (from working sets, systematically too low). |
| **Max-out** | Strength test with e1RM. Does not advance the A/B rotation. |
| **Knowledge at the bar** | Expandable: rationale, cue, typical mistake, bridge to olympic lifting. |
| **Mobility** | Five exercises, due once per calendar week — at the first session (strength or jam), whichever comes first. Own button, usable independently at any time. In a session you can tick “Mobility done”; in the library, **Done today** logs a small entry of its own. Mobility counts as mobility, not as training: no streak, no tonnage, nothing sent to intervals.icu. Three times in one week earns the **Limber** patch. |
| **Feel after the session** | Four levels (easy/normal/hard/brutal) on the done screen — makes the call verifiable in hindsight. |
| **Injury report** | What is nagging, with your own treatment. Two kinds: *recurring* (comes and goes, briefly asked about after a session, can heal) and *structural* (stays, not asked about, blocks permanently). Exercises you block are not rolled by the jam, not picked by Unplugged, and left out of technique and mobility. Main lifts are only flagged, never dropped — the 5×5 mechanics hang on them. The app makes no diagnosis and suggests no treatment. |
| **Merch stand** | A little play to match the stage: a **battle vest** with patches (plate club, 1000 lb club, bodyweight marks, comeback, streaks, Road crew and Hangar 18 for the aftershow, Duet, Fist bump, Tour partner and Standing date for training together, course debut, phases, checks, heavier bell, pit streaks, bell rank and course for two for the kettlebell … and for the bike: tour bus kilometres, Stairway to Heaven, Highway Star, Doom for disciplined base rides, Open Air, crossover weeks with strength and bike), **gold and platinum** records for the weight you have moved (up to Adamant at 1000 t, plus a row of bell records from course and Mosh Pit), a **course boss** for the three checks, a **guitar rack** with ten pixel guitars that unlock with rank and records (there is nothing to buy), framed on the studio wall, a **rank** from garage band to Hall of Fame, and every quarter a **tour shirt** as a pixel band shirt: fabric colour and emblem come from the tour name, screen print on the front, your training days on the back — flip it over. After a session the setlist shows up as a taped paper sheet, and the home screen has a weekly dial that only goes to eleven when the plan is done **and** every set was clean. Consistency earns it, never volume: the rank counts weeks, not sessions (bike weeks included), and a logged injury **freezes your streak** instead of breaking it. All calculated from the logs, nothing stored. |
| **Pixel stage** | Every patch has its own pixel image, every step of a ladder included: gigs grow from the setlist sheet through ticket, poster and amp to the raised lighter, kilometres from a bike to the globe, and in the plate club each lift is its own figure with 1–4 plates on the bar. The shape shows the category: stage round, strength octagon, bike square, comeback shield, streak star. Every rank has its scene, from the garage to the Hall of Fame, with the whole tour underneath; unlocked stops can be tapped to see them large again, with the day they were unlocked. On **HEAVY** days a small pixel fire burns behind the word. After a session an **announcer** calls out the big moments: new rank, new patch, back to your pre-break level, a round number like “100 KG”, the weekly dial on eleven, “FLAWLESS”. There is at most one call per session, and you can switch it off under *Backstage → App*. With “reduce motion” on your system there is no fire and no jump. Own pixel art, no third-party graphics. |
| **Monthly tour** | Every month three goals from your own weekly plan: the planned strength sessions, the planned rides (without a bike: four days of jam, unplugged or mobility) and half as many clean sessions. At the end waits the month's **final boss**, from the Frost Giant in January to Krampus in December, with a health bar that loses a third for every goal you meet. Days before your first session and during an injury break do not count towards the target. When the boss falls, the announcer calls **TOUR COMPLETE**; there are patches for 1, 3, 6 and 12 defeated months. The card sits in the merch stand, the line in the week header. |
| **Weekly soundcheck** | On Sunday for the current week, on Monday and Tuesday still for the week just gone: the week's numbers (sessions, jams, mobility, rides, tonnes, clean sets), as a mixing desk with one fader per number (measured against your own best of the eight weeks before), plus “Went well”, “Snags” and three resolutions on a paper setlist. It is stored as its own file in the data repo (`soundcheck/YYYY-Www.json`) and queued when offline. The resolutions then show in the week header, earlier soundchecks in the tour. Patches for 4 and 12 weeks in a row. |
| **Train together** | In the session you check in who you are training with today; in the rest the bar then reads “Max is up” and the button says “Done” (I go, you go). Both people make the **handshake** with two links they send each other, or by pasting in the app — there is no server in between, and the link carries only an id, a step and a name. Each side keeps only its own file under `zusammen/` in the data repo. “Confirmed” means both phones took part, nothing more. Plus eight patches (Duet, Fist bump, Tour partner 5/15/30, Standing date 2/4/8 weeks) that only show up once you have a date. Days and weeks are counted; there is no comparison between people. |
| **Flightcase look** | Cards with metal corner protectors like a road case, headings as strips of gaffer tape in marker lettering, the word of the day in Anton. Both fonts live in the repo (`assets/fonts/`, licences alongside); nothing is loaded from outside. |
| **Call vs. feel** | In the Tour: every session with both values plus the hit rate — the call and the perceived effort side by side instead of merely asserted. |
| **Where you are out of balance** | Twelve strength ratios against guidance values *and* against your own level before the layoff. When the same lift stands out in several pairs, the app names it as the cause and suggests extra work — a single skewed pair does not tell you which side causes it. Only values of equal quality are compared. |
| **Test values** | Pull-up, dip, front squat, single-arm press, step-up, single-leg deadlift and farmer’s carry — what 5×5 does not produce on its own. Enter them in the backstage or **measure them in a max-out**; a measured test beats a typed one and is recorded with its date. They add eight more ratios, including whether your pulling matches your pressing. |
| **When you are back** | A projection per lift from your actual rate of increase up to your pre-layoff weight. “Reached” means lifted, not assigned. |
| **Strength per kilo** | Working weight divided by body weight, with a trend line. In a deficit this is the honest number — holding steady is already progress. |
| **Where it is stuck** | Plateaus before the deload counter reports them: how long a weight has stood, failed attempts, and how many individual sets landed on target. |
| **Beyond 5×5** | When a lift has to deload twice without a new high in between, it is stuck. On start the app then suggests the classic next step: **5×5 → 3×5 → 3×3** (deadlift 1×5 → 1×3), same weight, keep climbing. Only with your consent, logged as an adjustment, and reversible any time under *Tour → Strength*. |

### Bike and conditioning

| | |
|---|---|
| **Bike rides** | Rides, hours, kilometres, load, energy, average power with its share of FTP and the weekly load over twelve weeks — from intervals.icu. Plus **cadence** per ride against your target (under *Backstage → Personal*, 80 rpm if empty; 2 rpm below still counts), **avg watts vs NP** as bar pairs (how steadily you ride) and for each ride avg watts, NP, IF, load, heart rate, cadence, RPE, feel and the zone with the most time. New power bests reported by intervals.icu are collected above; *plan vs actual* shows how hard rides on and off target felt (avg RPE). |
| **Training calendar** | 26 weeks as a grid: strength amber, jam green, bike steel blue. |
| **Stacked weekly load** | Strength and bike in one bar — the single curve that makes both belong together. |
| **Fitness vs. fatigue** | Two lines from intervals.icu — the area between them *is* your form. |
| **Recovery (HRV/resting HR/wellbeing/sleep)** | From intervals.icu, usually via HealthFit out of Apple Health. HRV and resting heart rate are judged only relative to your own baseline of recent days, never absolutely. Soreness and fatigue as you log them in intervals.icu (1–4), plus the sleep score. Feeds into the call. |
| **Power targets** | From eFTP instead of percentages. |
| **Unplugged** | Fifteen minutes, bodyweight only, quiet if needed. Fixed intervals with a guided clock instead of rep counts — for the morning when someone is still asleep. Quiet mode drops everything that jumps and makes no sound, only vibration. |
| **Kettlebell Mosh Pit** | The follow-up after the course: swing, goblet squat and one-arm press, three sets each. More reps first (10 · 12 · 15 · 17 · 20), then a bell 4 kg heavier and back to the bottom — like the 5x5, just with a bell. Miss twice: one rung back. The next target follows from the logs. |
| **Kettlebell course** | Twelve weeks, three sessions a week: hips, swing and get-up first, then one-armed and by the clock, finally density and a test in week 12. Every fourth week is a deload. The session guides you: you tick off sets, tempo and rests run on their own. Before a session you enter which bell you work with (in kg, the last one is prefilled); a total clock, stopwatch and countdowns run along. Weeks 4 and 8 hold checks, week 12 the final test. Afterwards you say how the bell felt — twice too light or too tough, and the app suggests the other bell. History and checks live in the tour under “Bell”. Where you stand follows from the logs. |
| **Jam** | Five formats, 31 movements, loads from your current state. Never two barbell parts. Optionally **together**, taking turns (I go, you go) on one device, no check-in: the display says whose turn it is, “Switch” in the clock bar swaps you, and the log keeps the tally. |
| **Scaling** | Every movement names alternatives. “Can't do this” removes it for good. |

### App

| | |
|---|---|
| **Offline** | Sessions are buffered. Tour and bike view show the last known state. |
| **Screen stays on** | During a session, jam, Unplugged and max-out the display does not go dark, so you can tick off a set without unlocking. Afterwards the app lets the screen sleep again. |
| **CSV export** | *Backstage → App*: every session as a table for Excel, Numbers or Sheets. Built in the browser, sent to no service; text from your data never arrives as a formula. |
| **Self-updating** | Checks the version at start and reloads itself exactly once. |
| **Sound and vibration** | Tone at the end of a rest and on finishing a session, on top of the vibration — the tone respects the mute switch, the vibration does not. |
| **Light and dark** | Switch between system / light / dark. Two real designs, not an inversion. |
| **Text size** | Normal / Large / Extra large under *Backstage → App*. Scales the whole interface evenly, on this device only. |
| **Home as a poster** | One word for the day at the top (TECHNIK, SOLIDE, HART, SCHWER), and below it only what changes today — a break, an injury, low form, a ride too close. Form, sleep, weight and bike sit underneath as small instruments that open on tap. On the right, a week card with the dial and your streak, and a weights list headed by the reunion tour until you have made it. |
| **Tour with tabs** | Overview, Strength, Body, Bike, Sessions. Settings live separately in the **backstage** (⚙ in the Tour): Personal, Places, Connections, App. |
| **Phone and Mac** | Two columns from 900 px, wider grids in the Tour — same order, no rebuild. |
| **German and English** | Switch under Backstage: interface, daily call, milestones, small wins and messages. Exercise content and sayings stay German. |

### Library

| | |
|---|---|
| **Every exercise in one place** | Main lifts, technique, mobility, finishers and all jam movements, searchable and filterable by category. |
| **When the rep counts** | 60 exercises carry a movement standard written as a test, not a hint: not “squat deep” but “hip crease below the kneecap, hips and knees fully extended at the top”. Shown in the jam, in Unplugged and during a live session too. Stretches and time-based machines deliberately have none — there is no valid rep to judge. |
| **Grouped by category** | Each category with its own colour and count; per exercise name, dose and cue, and when opened the explanation, standard, mistakes and “when it stalls”. |
| **Exercise of the day** | The same one all day, compact at the top; “Open” expands it in the list, ↻ rerolls. Steps aside while you search or filter. |
| **YouTube search link instead of a guessed video** | A single hard-wired video could be offline or wrong. Overridable with your own link. |
| **Your own notes** | On request via “Add a note”; once saved they show as text with the exercise. They land in `bibliothek.json` in `setlist-data` and grow with you — the same knowledge layer as `config.json`, but for what you learned yourself. |

---

### Setting up and adjusting

| | |
|---|---|
| **First-time setup** | No programme in the repo? Then the app asks: bar, the five lifts with a starting weight, strength days, optionally bike days — and writes a valid `config.json` from that. No JSON by hand. |
| **Your voice** | Your reason, your own lines and old personal bests, right in the app. The reason shows up on hard days, the bests on their anniversaries. |
| **Places and equipment** | Several gyms (home gym, box, studio …) each with their own kit. The jam only draws from what is there. With no places set up everything stays allowed. |
| **Place picker in the header** | A button shows where you are and switches places — on the home screen and in the jam. The picker lists how many jam movements are possible at each place. |
| **Update hint for forks** | A fork stays where it branched off. The app compares its version against the original's and says so once, with the way to update. |
| **Language** | Interface in German or English, switchable in the backstage. |

<p align="center">
  <img src="assets/screens/ortwahl-dunkel.png" alt="Place picker from the header" width="300">
</p>

<p align="center"><sub>The place picker from the header — with the number of jam movements possible there.</sub></p>

## Two decisions that carry the whole thing

**`state.json` is derived, not maintained.** It is a projection from `config.json` and every file in `einheiten/`. A mistyped entry never becomes a problem: fix the file, hit “rebuild state.json”, done. Working weights are never set directly — that is what the `anpassung` log type is for.

**“At least” is not “max”.** e1RM formulas assume proximity to failure; a 5×5 working set is submaximal, so the formula systematically underestimates there. That is why the trend curve does not mix the sources: a dashed line for lower bounds, max-outs as separate points.

---

## <img src="assets/readme/i-einrichten.png" width="22" height="22" alt=""> Setting it up yourself

**Just want to try it or simply use it?** Then you need none of this: open the app, *Start
locally* (see *Get started* at the top and [Data](#data)). Your own data repo (steps 2, 4 and 5
with the hosted app at [cyphomat.github.io/setlist](https://cyphomat.github.io/setlist/)) is
worth it if you want the same state on several devices. Fork and Pages (steps 1, 3 and 6)
are only for your own, independent version whose code you control.

Setlist is built for exactly one person — you. There is no multi-account login; whoever uses the app is whoever's `setlist-data` repo is configured. To get your own independent instance you need a GitHub account and about ten minutes.

**1 · Fork the app code**

Fork this repo (`cyphomat/setlist`) into your own GitHub account. That is the public part — code, nothing personal.

**2 · Create your own data repo**

Create a **private** repo called `setlist-data`. That is all — **no file by hand**. On
first open the app notices there is no programme yet and walks you through it: bar weight,
the five lifts with a starting weight (or one click on “start with the empty bar”),
strength days, optionally bike days. From that it writes a valid `config.json` into your
repo.

<p align="center">
  <img src="assets/screens/einrichten-dunkel.png" alt="The setup screen" width="330">
</p>

If you would rather write it yourself, you still can — the file looks like this:

```json
{
  "bar": 20,
  "rounding": 2.5,
  "deload": { "afterFails": 3, "factor": 0.9 },
  "lifts": {
    "squat":    { "name": "Back Squat",   "increment": 2.5, "start": 40 },
    "bench":    { "name": "Bench Press",  "increment": 2.5, "start": 30 },
    "row":      { "name": "Barbell Row",  "increment": 2.5, "start": 30 },
    "ohp":      { "name": "Strict Press", "increment": 2.5, "start": 20 },
    "deadlift": { "name": "Deadlift",     "increment": 5.0, "start": 50 }
  },
  "workouts": {
    "A": [{ "lift": "squat", "sets": 5, "reps": 5 }, { "lift": "bench", "sets": 5, "reps": 5 }, { "lift": "row", "sets": 5, "reps": 5 }],
    "B": [{ "lift": "squat", "sets": 5, "reps": 5 }, { "lift": "ohp", "sets": 5, "reps": 5 }, { "lift": "deadlift", "sets": 1, "reps": 5 }]
  },
  "firstWorkout": "A",
  "rest": { "normal": 90, "afterFail": 180 },
  "plates": [25, 20, 15, 10, 5, 2.5, 1.25],
  "week": { "slots": [{ "day": 1, "type": "strength" }, { "day": 4, "type": "strength" }] }
}
```

`start` is your entry weight per lift, `increment` the step up after a successful session.
`week.slots` defines which weekdays have something scheduled (`day`: 1 = Monday …
7 = Sunday); bike slots (`"type": "ride"`) additionally need a `rides` array. If any of
that is missing the week overview simply stays empty — the rest of the app carries on.

Do **not** create `state.json` — the app derives the initial state from `config.json`
itself the first time and only writes it back after your first completed session. An empty
`einheiten/` folder is enough. Optional are `stimme.json` (your own lines, see
`js/content.js` for the structure) as well as `records` and `ziele` in `config.json`, if
you want milestones or old personal bests. The `soundcheck/` and `zusammen/` folders are
created by the app itself, by your first weekly soundcheck and your first check-in.

**3 · Publish**

In your fork under **Settings → Pages**: set the source to the `main` branch. After a minute or two the app runs at `https://<you>.github.io/setlist/`.

**4 · Create a GitHub token**

Click your **profile picture in the top right → Settings** — your personal account settings, **not** the repo's settings — then **Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.** Access to your data repo only, permission **Contents → Read and write**, nothing else. Set an **expiration** (about a year) and create a new token before it runs out — enter it under *Tour → ⚙ Backstage → Connections*. If the app reports “token invalid, expired …”, that is usually it.

On first open you land on the setup screen automatically. There you enter your **GitHub username**, the **name of your data repo** (pre-filled with `setlist-data`) and the token — no code editing needed, the repo target is configurable right in the app. All three stay exclusively in your browser's `localStorage`.

**5 · intervals.icu — optional**

Only needed if you also want bike sessions, form, HRV and sleep. The key lives under **Settings → Developer** in your intervals.icu account.

**6 · Getting updates**

Your fork stays where you branched off — the original keeps moving, but your fork never
finds out on its own. So the app tells you: if your fork is on an older version, a hint
appears once at start, and under *Backstage → App* you see which version is upstream and
which one you are running.

<p align="center">
  <img src="assets/screens/fork-dunkel.png" alt="Hint about a newer version upstream" width="330">
</p>

Updating then takes two clicks on GitHub:

1. Your fork → the **This branch is N commits behind** notice at the top → **Sync fork**
2. **Update branch**

GitHub Pages rebuilds, and the app reloads itself once the next time you open it. Your
data is untouched — it lives in your own `setlist-data`, which has nothing to do with the
app code.

If you have made your own changes to the code, use the command line:

```sh
git remote add upstream https://github.com/cyphomat/setlist.git   # once
git fetch upstream && git merge upstream/main
git push
```

Done. The first session creates `state.json` automatically; everything after that is derivation, not manual upkeep.

---

## Data

**Without an account, everything stays on the device.** If you begin with *Start locally*,
your programme, sessions, soundchecks, dates and notes live in this browser (IndexedDB). There is
no account and no server, and nothing leaves the device unless you connect intervals.icu. The
app asks the browser to keep the storage persistent. On iPhone this only holds for the
installed app, though: Safari clears the storage of ordinary websites after seven days
without a visit. So: *Add to Home Screen*.

**Backup and restore.** Under *Backstage → App → Data* you download a backup as a JSON file
(`setlist-sicherung-YYYY-MM-DD.json`) and restore it on another device or after deleting.
Restoring **adds instead of replacing**: sessions are immutable, so the union of both sides
is the right answer. The same session never arrives twice, and the app shows how much is new
first. A different programme in the file is only taken over after asking. The state (working
weights, A/B) is then recomputed from all sessions. If sessions have piled up since the last
backup and it is two weeks old, the week header reminds you.

**Or with your own GitHub data repo.** If you want Setlist on several devices with the same
state, connect a private repo in setup (see [Setting it up yourself](#-setting-it-up-yourself)).
Every session then lives as a file in the repo. If you started that way and would rather
continue without an account: *Data → Move to this device* brings everything from the repo
onto this device and disconnects GitHub. Everything stays in the repo. A two-way sync like
Riffforge's comes later.

**Delete means delete.** In local mode the button is called *Delete everything*. It names
the number of sessions, and without a backup nothing is left afterwards.

---

## <img src="assets/readme/i-sicherheit.png" width="22" height="22" alt=""> Security and privacy

The app is built for one person and should only be visible to that person. Concretely:

**Your data lives on your device or in your private repo.** Locally, everything stays in this
browser's IndexedDB. It is tied to the address; under `cyphomat.github.io`, however, all pages
of that account share the same storage area. With a data repo the app only ever reads and writes
`setlist-data` — sessions, body weight, notes, the injury report (that is, health information) and the names of your gyms. The app code itself (this repo) is public
but holds no data. On start the app checks your data repo's visibility and **warns loudly
if it is public** — otherwise you would never notice, because the app works just the same.

**Credentials leave the browser only for their own service.** The GitHub token and the
intervals.icu key live in `localStorage` and are only ever sent as an `Authorization`
header — never in a URL, never in a commit, never in an error message.

**Three external destinations, no others.** `api.github.com` for your data (only with a data repo),
`intervals.icu` for bike and form, a YouTube *search link* in the library (no referrer).
No analytics, no CDN, no fonts from third-party servers.

**Signing out clears the device.** Locally the button is called *Delete everything* (see [Data](#data)). With a data repo, *Backstage → App → Remove credentials* deletes the token, the key **and** all cached data from the browser — sessions, injury report, weight, sleep, rides. Only settings such as theme and text size remain. If unsent sessions are still queued, the confirmation says so first.

**Not inside other pages.** If another site loads the app in a frame, it shows a notice and does not start — so nobody can slip clicks under you. GitHub Pages cannot do this with a header, so `js/boot.js` handles it before the first paint.

**Foreign text is escaped.** Activity names from intervals.icu are not written by you but
by Strava, Zwift or a group ride. That text — just as much as names from invitation links and everything from your `config.json` — is escaped before display (`js/sicher.js`),
and a strict Content Security Policy (`script-src 'self'`) catches anything that might
slip through. Video links you enter yourself are restricted to `http`/`https`.

**Invitations stay with you.** An invitation to train together is a link you send yourself. Behind the `#` there is only an id, a step and a name; that part never goes to a server, and the app accepts nothing unasked.

**What deliberately goes out:** with the intervals.icu sync on, it receives the date,
duration, estimated training load and one line per lift with weight and reps. Switch it
off under *Backstage → Connections*.

---

## <img src="assets/readme/i-aufbau.png" width="22" height="22" alt=""> Layout

| File | Role |
|---|---|
| `js/program.js` | 5×5 automation, plate calculator, e1RM. Pure functions. |
| `js/coach.js` | The call, tone, milestones, small wins. Pure as well. |
| `js/wod.js` | Jam generator, deterministic via a seed. |
| `js/stats.js` | Tonnage, personal bests, sparklines, bike statistics. |
| `js/content.js` | Knowledge layer: cues, soundcheck, technique, encore, voice. |
| `js/bibliothek.js` | Bundles all exercises into one searchable list. |
| `js/i18n.js` | Interface texts in German and English. |
| `js/geraete.js` | Places, equipment, whether a movement is doable. |
| `js/sicher.js` | Escapes foreign text, validates URLs. |
| `js/aktualisierung.js` | Compares your version against the original; author, issues and source link (your fork, when forked). |
| `js/einrichten.js` | Builds a valid `config.json` from a few answers. |
| `js/persoenlich.js` | Your reason, your own lines and old personal bests. |
| `js/unplugged.js` | Bodyweight intervals, pool and run order. |
| `js/moshpit.js` | Mosh Pit: ladder, target from the logs, stats. |
| `js/kurs.js` | Kettlebell course: plan, week logic, run order, bell suggestion. |
| `js/verletzung.js` | Injury report: blocks, history, pause windows for the streak. |
| `js/merch.js` | Merch stand: patches, records, rank, tour shirts, weekly dial — all from the logs. |
| `js/gitarren.js` | Guitar rack: which guitar hangs on which rank or record, what is new, what is missing next. |
| `js/hilfs.js` | Aftershow: clean up accessory sets, last time, summary. |
| `js/wach.js` | Keeps the screen on while you train. |
| `js/export.js` | Sessions as CSV, safe against formulas. |
| `js/feuer.js` | Pixel fire (the Doom algorithm, own implementation). |
| `js/ansager.js` | Decides what gets called out after a session. |
| `js/soundcheck.js` | Weekly soundcheck: calendar weeks, when it is due, streak, fader level, cleaning up the input. |
| `js/zusammen.js` | Training together: dates, reading and building invitation links, the handshake, joint days for the patches. |
| `js/boot.js` | Theme, storage migration and the frame block before first paint. |
| `js/store.js` | Storage: locally in the browser or in the GitHub repo, same paths; offline buffer. |
| `js/lokal.js` | Local storage: files in IndexedDB. |
| `js/sicherung.js` | Backup and restore as a JSON file, union instead of replace. |
| `js/intervals.js` | Reads rides and form; writes strength sessions back. |
| `js/app.js` | Interface and flow. |
| `sw.js` | Caches the app shell. Deliberately **not** the training data. |
| `tools/tests.mjs` | Runs every test with Node; the GitHub Action does the same on every push. |
| `tools/proben.mjs` | Browser probes: the real app in Chromium against a mocked GitHub API (optional, Playwright). |
| `tools/pixel.mjs` | Builds every pixel graphic: the sheets in `assets/pixel/` (from the sources in `tools/pixel/`), the wordmark and app icons (`icons/`) and the README images (`assets/readme/`); `--pruefe` runs in the Action. |
| `tools/pixel-gitarren.mjs` | Draws the ten guitars for the rack (body masks, headstocks, colours); `pixel.mjs` assembles them into the sheet. |

---

## <img src="assets/readme/i-tests.png" width="22" height="22" alt=""> Tests

```sh
node tools/tests.mjs
```

Node 22 or newer (current LTS recommended), nothing to install. The same runs as a GitHub
Action on every push and pull request (`.github/workflows/tests.yml`); the actions are
pinned to commits, and Dependabot opens a pull request when they have a new version. Without Node, the JS engine that ships with
macOS works too:

```sh
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
for t in tests/*.test.js; do $JSC --module-file=$t; done
```

2572 tests in 31 files. No build, no dependencies.

### Browser probes (optional)

The tests check the maths; the probes check what you see. They open the real app in
Chromium against a mocked GitHub API, a mocked intervals.icu and a frozen date:

```sh
node tools/proben.mjs                 # all: start, einheit, tour, merch, buehne, bibliothek, rueckschau, lokal, sicherheit, englisch, ueber
node tools/proben.mjs start merch     # just these
node tools/proben.mjs -v              # also list every passing check
```

They run in both themes, at „Sehr groß“, from 360 to 1280 px, in German and English.
Each run checks that what should be on screen is there, that nothing overflows the edge,
and that there are no page errors. Security cases come on top: your own text never runs
as code, logging out cleans up, and the app refuses to load inside someone else's page.

The probes bring their own server; all they need is Playwright with Chromium
(`npx playwright install chromium`, or point `CHROMIUM=/path` at your own browser).
Screenshots go to the temp folder (override with `PROBEN_BILDER`). They deliberately
don't run in the GitHub Action, so Setlist stays dependency-free.

---

## Releasing

```sh
sh tools/release.sh 2026-09-14.1
git add -A && git commit -m "…" && git push
```

Sets `version.json` and the cache name in `sw.js` together — both have to change or the app notices nothing new.

Re-capture the screenshots — two tools, because there are two kinds of screen:

```sh
python3 -m http.server 8765 &

sh tools/screens.sh        # training: home, session, tour, jam, max-out
node tools/shots.mjs       # setup, voice, places, fork hint
```

`screens.sh` drives `tools/shot.html` with Chrome — the app runs off the cache there. That
is not enough for screens that depend on what the API *answers*: the setup screen only
appears on a missing `config.json`, the fork hint only with a newer version upstream. So
`shots.mjs` answers itself (Playwright, cross-platform, `npx playwright install chromium`).

---

## On the Mac

A web app, the URL is enough. For a window of its own: **Safari** → File → *Add to Dock*, or **Chrome** → address bar → *Install*.

Token and key live in `localStorage`, so per device — enter them once more on the Mac. The training data comes from the repo and is the same everywhere. You should not finish a session on two devices at once; one after another is fine.

## Credentials

Nowhere in the code, nowhere in the repo, in no commit. The GitHub token and the intervals.icu key are entered in the app and live exclusively in the `localStorage` of that browser.

---

## <img src="assets/readme/i-mitmachen.png" width="22" height="22" alt=""> Contributing

Setlist is by [@cyphomat](https://github.com/cyphomat).

- **Found a bug or missing something?** Please open an [issue](https://github.com/cyphomat/setlist/issues) here in the original repo.
- **Forking and adapting is explicitly welcome.** The source code is under the [MIT License](LICENSE): use it, change it, pass it on, including as your own version. How to run your own instance is described under [Setting it up yourself](#-setting-it-up-yourself).
- **In a fork** the app's source link (*Backstage → App → About Setlist*) points to your fork. Feedback still goes here, to the original.
- **No warranty:** Setlist works out weights, breaks and calls from rules of thumb. It replaces neither a coach nor a doctor. What you load onto the bar is your call.
