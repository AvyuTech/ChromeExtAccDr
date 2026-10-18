# Nearhood

**Your city, answered.** Nearhood is a smart, city-level companion app, starting with Ahmedabad. Ask anything about the city and get one answer merged from ticketing sites, social posts, maps, local news, official feeds and your neighbours, with a clear signal of how many sources agree.

It is built from the Nearhood design canvas (Home feed, Search and Explore artboards) and extends it into a complete app.

## What's inside

| Area | Screens |
| --- | --- |
| **Home** | Ask bar, feed filters, *Today in your city* band (weather, alerts, tonight, deals), For you / Near me / Trending / Questions feed with AI-summarised threads, city alerts, weekend events and deals interleaved |
| **Ask** | On-device answer engine: detects intent (events, cafés, food, traffic, metro, weather, air, water, power, civic, deals, groups, safety, services), merges sources, shows how many agree, filters and follow-ups |
| **Explore** | Category grid, category pages (food, events, movies, getaways, places), deals and deal details, place and event pages with source trust panel, groups |
| **City** | Live *City pulse* dashboard (weather, AQI dial, roads, next metro/BRTS/bus, water and power, ward civic health, parking), alerts and alert details, transit and commute, **report a civic issue** with duplicate detection and a tracker, city services, safety & SOS |
| **Social** | Post details with replies, composer (question, recommendation, alert, lost & found, event, give away) with similar-question detection, updates, messages and chat |
| **Me & Settings** | Profile, saved items, onboarding, and full settings: account, location & commute, notifications, city alerts, appearance (light/dark/system, text size), language (English, ગુજરાતી, हिन्दी), accessibility, privacy, sources & AI answers, data & storage, safety contacts, help, about |

Settings change behaviour, not just switches: turning off a source removes its listings and chips from answers, alert preferences filter the alert feed and tab badge, *Data saver* pauses the live city feed, theme, contrast, motion and text size apply app-wide, and language switches the interface.

## Nearhood glyphs

All icons are drawn for this app; no icon library is used. They share one anatomy (rounded 1.9 strokes, a soft tint layer and the logo's mint dot), and many are **driven by live data**:

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
  icons/        Nearhood glyph family (nav, categories, live data, UI) + animations
  data/         Sample Ahmedabad data: places, events, deals, posts, alerts, city pulse, services
  state/        Persisted settings, user activity, toasts, simulated live city feed
  lib/          Answer engine, selectors, formatting
  components/   Shared UI and cards
  pages/        Screens (settings/ holds the settings area)
  i18n/         English, Gujarati and Hindi strings
  styles/       Design tokens (light/dark/high contrast), base, components, page styles
```

## About the data

Everything in `src/data` is **sample data** for demonstrating the app. Neighbourhood names, metro lines and the national emergency numbers (112, 100, 101, 108, 181, 1098, 1930) are real; venues, people, prices, schedules and ticket numbers are illustrative, and `[bracketed]` values are placeholders. The live city feed is simulated in `src/state/live.ts`.

To connect real services, replace the modules in `src/data` and `ask()` in `src/lib/askEngine.ts` with API calls. The answer engine returns the same shape a hosted model would (`answer`, `sources`, `results`, `followUps`), so the screens do not need to change.
