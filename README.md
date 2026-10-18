# Nearhood

**A little closer to your city.** Nearhood is a city app for friends, family and neighbours, starting with Ahmedabad: what your friends ate, did and recommend, places added and confirmed by people, clubs that meet up and buy things together, and a light city layer (weather, air, a traffic heat map, alerts, safety). It is not a booking, payments or deals app. See [docs/PLAN.md](docs/PLAN.md) for the Phase 1 scope and who creates what.

It started from the Nearhood design canvas and now follows the **Porcelain** design: every screen, from the splash to the last settings page, uses the new palette, type, photography and icons.

## What's inside

| Area | Screens |
| --- | --- |
| **Home** | Ask bar, friends' check-in stories, today card (weather and plans tonight, opens City pulse), For you / Friends / Nearby feed: posts with *Nearhood says* summaries, friends' check-ins, must-tries, meetups and group buys from your clubs, city updates, and city events labelled with where they came from |
| **Explore** | *Find your next favourite*: radius and mood chips, an illustrative map of west Ahmedabad, *Worth stepping out for* from friends' visits, tonight's events, *Spotted by locals* (new openings waiting for neighbours to confirm them), *Seen on reels this week* (labelled public picks, never reviews), categories, curated lists. Switch to another city to see what your friends did there |
| **Clubs** | Neighbours, founders, cricket lovers, parents, food lovers, book clubs: a map of clubs, your clubs, meetups with "I'm in", **buying together** (gather people for a better price; the deal and payment happen outside the app), club pages, and starting your own club |
| **Places & events** | Place pages added and confirmed by people, with who added them, how many locals confirmed them and whether an owner claimed the page. Events come from public sources and link out for details and tickets |
| **Ask** | On-device answer engine for events, cafés, food, places, traffic and trips, weather, air, water, power, civic issues, clubs and group buys, safety and friends; merges sources and shows how many agree |
| **City** | *City pulse*: weather, air, a traffic heat map with the best way to work, verified alerts, water and power, ward civic health. **Traffic**: heat map with a from–to route planner. Report civic issues, safety & SOS. No bill payments or public transport |
| **Friends & community reviews** | Follow friends; **Quick check-in** (place → what you had → Must try / Good / Skip); friends' reviews first; **Want to try** lists, curated lists, taste match, "you both want to try" plans; friends' trips in other cities |
| **Me & Settings** | Page-style profile with a photo grid, clubs, saved items, onboarding, and full settings: account, location & commute, notifications, city alerts, appearance, language (English, ગુજરાતી, हिन्दी), accessibility, privacy, sources & AI answers, data & storage, safety contacts, help, *How Nearhood stays human*, photo credits |

Settings change behaviour, not just switches: turning off a source removes its listings and chips from answers, alert preferences filter the alert feed, *Data saver* pauses the live city feed, theme, contrast, motion and text size apply app-wide, and language switches the interface.

## Human-curated by design

Nearhood is about people, not businesses. Nothing on it is imported, scraped, bought or listed by a business.

| Question | How it works |
| --- | --- |
| **Where do places come from?** | A person adds a place the first time they check in somewhere that isn't on Nearhood yet. Every place page says who added it and how many locals with verified visits have confirmed it (*Added by Riya S. · Jan 2024 · Confirmed by 39 locals*). |
| **How do new openings get in?** | Anyone can mark a new spot. It shows under **Spotted by locals** on Explore and goes live once **3 neighbours have verified visits** there, or a neighbourhood guide checks it. Nobody has to wait for us or for an AI to find it. |
| **What can a business do?** | Claim its page with a licence (FSSAI or GST) and a code sent to the venue's phone, then keep hours, menu and photos right and reply to people. Owners can't post verdicts, pay for placement or hide reviews. Parks, lakes, markets and streets are public places and can't be claimed. |
| **What does the AI do?** | Merges duplicate places, flags fake patterns (bursts of new accounts, copy-paste reviews) and summarises what neighbours said. It never adds places, writes reviews or ranks anyone for money. |
| **Who can post?** | Verified residents. Guides earn the role through a history of helpful answers. Free or invited visits are labelled and don't count. |
| **Trips outside the city?** | Friends' check-ins elsewhere (like Polo Forest) show in your friends' feed and in people's lists, with an *Outside Ahmedabad* label, but never in city browsing. Polo Forest is on Nearhood because Nikhil added it to his list *Day trips under 3 hours*. |

## Design

| | |
| --- | --- |
| **Colours** | Porcelain `#F7F7F2` (ground), Ink `#1D2330` (text), Violet `#6C52EE` (actions, active states), Lime `#DFFF8A` (highlights, *you are here*). Dark and high-contrast themes are derived from the same tokens in `src/styles/tokens.css` |
| **Type** | Plus Jakarta Sans (bold headlines) and Manrope (body), loaded from Google Fonts |
| **Photography** | Real photos of people, places, dishes and events (`src/assets/photos`, about 2 MB of WebP), with a tinted glyph fallback wherever a photo is missing |
| **Icons** | The Nearhood glyph family below: outline icons with a soft tint, a lime dot and live states |
| **Presentation** | On a laptop or desktop the app runs inside a phone frame with a live status bar, next to the brand palette; on a phone it is full screen. A brand splash (the arch draws itself and faces and places drift in) plays once per visit |

## Reviews you can trust

Community verdicts replace star ratings. A verdict is one tap (Must try, Good or Skip), which is quicker to give and harder to inflate than five stars.

- Only **verified visits** (confirmed at the venue) count towards a place's score; unverified check-ins are shown but labelled.
- Free or **invited** visits are labelled and left out of the score.
- Reviews are ordered **friends first**, then people with similar taste, then other locals; every reviewer's history is public.
- What people **order** is counted per dish, so you see "Kimchi pancake · 88% must try" rather than a single number for the whole place.

## Nearhood glyphs

All icons are drawn for this app; no icon library is used. They share one anatomy (rounded 1.9 strokes, a soft tint layer and the logo's lime dot), and many are **driven by live data**:

- **Weather** glyph changes with conditions (rays turn, rain falls, haze drifts).
- **AQI dial** uses the Indian National AQI bands and moves to the current value.
- **Traffic** glyph streams lane markings at the speed the road is moving.
- **Water** drop fills to the supply level; **power** bolt flickers during outages.
- **Trust ring** fills one segment per agreeing source; single-source items show as unconfirmed.
- **Countdown** and **step** rings for departures and civic report progress.
- Tab icons animate when selected; the bell swings and the chat bubble types while something is unread.

Open **Settings › About › Glyph gallery** (`#/about/glyphs`) to play with every glyph.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-checks, then builds to dist/
npm run preview      # serves dist/ on http://localhost:4173
npm test             # unit tests (answer engine, storage)
npm run e2e          # smoke test every screen in light + dark (needs `npm run preview` running)
npm run build:single # one self-contained HTML file in dist-single/ for sharing
```

The app is a PWA: open it on a phone and use *Add to Home Screen* to install it. It works offline after the first visit.

## Project layout

```
src/
  assets/photos Photos (WebP) and sources.json with credits and licences
  icons/        Nearhood glyph family (nav, categories, live data, UI) + animations
  data/         Sample Ahmedabad data: places, events, clubs, posts, alerts, city pulse, reel picks
  state/        Persisted settings, user activity, toasts, simulated live city feed
  lib/          Answer engine, selectors, formatting
  components/   Shared UI and cards
  pages/        Screens (settings/ holds the settings area)
  i18n/         English, Gujarati and Hindi strings
  styles/       Design tokens (light/dark/high contrast), base, components, page styles
```

## Photo credits

Most photos are from [Unsplash](https://unsplash.com) under the [Unsplash License](https://unsplash.com/license). A few Ahmedabad places, dishes and events come from Flickr (via [Openverse](https://openverse.org)) and Wikimedia Commons under Creative Commons licences (CC BY 2.0, CC BY-SA 2.0 / 3.0). Every photo's author, source link and licence is listed in `src/assets/photos/sources.json` and shown in the app under **Settings › About › Photo credits**. People in the photos are not the people named in the sample content.

## About the data

Everything in `src/data` is **sample data** for demonstrating the app. Neighbourhood names and the national emergency numbers (112, 100, 101, 108, 181, 1098, 1930) are real; venues, people, clubs, prices and schedules are illustrative, and `[bracketed]` values are placeholders. The live city feed is simulated in `src/state/live.ts`.

To connect real services, replace the modules in `src/data` and `ask()` in `src/lib/askEngine.ts` with API calls. The answer engine returns the same shape a hosted model would (`answer`, `sources`, `results`, `followUps`), so the screens do not need to change.
