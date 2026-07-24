**English** | [简体中文](README.zh-CN.md)

# cnotely

> Flash Note Workbench — Capture is Creation

cnotely is a fully front-end knowledge management tool that seamlessly combines fragmented notes with spaced-repetition flashcards. It adopts a macOS desktop-metaphor interaction design with an Apple-style frosted-glass UI: manage cards, categories, and links in a desktop-like environment, reinforce memory through the built-in review mode, and stay focused with a Pomodoro timer. All data is stored locally in the browser — no backend required.

## Screenshots

<p align="center">
  <img src="./docs/screenshots/zh-light.png" alt="cnotely Light Theme (zh)" width="45%" />
  <img src="./docs/screenshots/zh-dark.png" alt="cnotely Dark Theme (zh)" width="45%" />
</p>

<p align="center">
  <img src="./docs/screenshots/en-light.png" alt="cnotely Light Theme" width="45%" />
  <img src="./docs/screenshots/en-dark.png" alt="cnotely Dark Theme" width="45%" />
</p>

## Features

### macOS-Style Desktop Workbench

- **Desktop Icons**: Cards / links arranged as macOS-style icons, supporting both "Auto Arrange" and "Free Arrange" layouts
- **Dock**: Bottom Dock includes a create button, category shortcuts, clear-desktop, and trash bin
- **Window System**: Cards open as macOS windows, supporting drag-to-move, resize, minimize, close, pin, and maximize
- **Context Menu**: Desktop icons and categories support right-click actions (open, edit name / icon / color, move to trash)
- **Trash Bin**: Deleted cards go to the trash bin, supporting restore and permanent deletion; drag to the Dock trash area to delete
- **Top Menu Bar**: Real-time clock, date, and integrated entries for create, layout switch, and settings

### Card System

- **Memory Card (qa)**: Q&A-style flashcard with question on the front and answer on the back, supporting 3D flip
- **Article Card (article)**: Long-form reading notes with Markdown rendering + PrismJS code highlighting
- **Category Management**: Cards can be grouped into categories, each with its own color and icon, editable via right-click
- **Markdown Editor**: Split-pane editing + live preview, toolbar supports common Markdown syntax and shortcuts; front (light) / back (dark) dual-theme panels
- **Link Collection**: Link-type apps support automatic favicon fetching (web icon / text-icon dual modes)

### Review Mode

- **Flashcard Flip Review**: 3D flip animation, click or press Space to flip
- **Spaced Repetition Algorithm**: Based on the Ebbinghaus forgetting curve; marking "Forgot" or "Mastered" automatically schedules the next review time
- **Tunable Algorithm Parameters**: Initial interval, ease factor, and minimum interval multiplier can be adjusted in Settings
- **Keyboard Shortcuts**: `Space` to flip, `1` for Forgot, `2` for Mastered
- **Progress Statistics**: Reviewed count, remaining due, grouped by category
- **Reset All**: One-click reset of all card learning progress (confirmation required)
- **Session Snapshot Mechanism**: Uses immutable snapshots during review to prevent iteration errors caused by dynamic card-list changes

### Pomodoro Timer

- **Focus Cycle**: Focus → Short Break → Focus → … → Long Break; long-break interval is configurable (default 4 rounds)
- **Completion Stats**: Today's completed count, total completed count, total focused minutes; auto-resets across days
- **Notifications**: Completion sound (WebAudio synthesized) + desktop notifications (Notification API)
- **Auto-continue**: Optionally auto-start the next phase

### Settings System

- **Appearance**: Light / Dark theme, wallpaper selection, custom wallpaper, frosted-blur intensity, menu-bar opacity, reduced motion
- **Desktop**: Layout mode, icon spacing, show/hide icon labels, trash-direct-delete
- **Cards**: Default card type, flip speed, 3D flip toggle, perspective distance, card size
- **Review**: Review theme, language, spaced-repetition parameters, auto-next, show Ebbinghaus curve, shuffle
- **Pomodoro**: Focus duration, short-break duration, long-break interval, long-break duration, sound, notifications, auto-start

### Internationalization

- Built-in Simplified Chinese (zh-CN) and English (en) bilingual support
- Automatically syncs with extension language in the Chrome extension environment

### Dual Runtime Environments

The same codebase runs as both a standalone Web app and a Chrome extension. The storage adapter auto-detects the environment:

- **Extension environment** (`chrome-extension://`) → `chrome.storage.local`
- **Web environment** (`http://` / `https://` / `file://`) → IndexedDB (Dexie)

### UI Design System

- **Apple-Style Frosted Glass**: A unified global design language
  - Modal body `rgba(255,255,255,0.75)` + `backdrop-filter: blur(40px) saturate(180%)`
  - Header / Footer with semi-transparent frosted background, blending into the content area
  - All child elements are border-free, using semi-transparent backgrounds to distinguish hierarchy
  - 16px corner radius, 0.5px hairline dividers, lightweight shadows
- **Light / Dark Dual Versions**: Editor front is light frosted, back is dark frosted
- **Teleport Dropdown**: Category selector renders to the body layer via Vue Teleport, unaffected by modal overflow

## Tech Stack

| Category | Tech | Version | Notes |
|----------|------|---------|-------|
| Framework | Vue 3 | ^3.5.13 | Composition API + `<script setup>` |
| Build Tool | Vite | ^6.3.5 | Dev server + HMR |
| Router | Vue Router | ^4.5.0 | SPA routing, Hash mode (compatible with extension and file://) |
| CSS | Tailwind CSS | ^4.1.7 | Atomic CSS, integrated via `@tailwindcss/vite` plugin |
| Local DB | Dexie.js | ^4.4.2 | IndexedDB wrapper, supports version migrations (currently v9) |
| Markdown | Marked | ^18.0.3 | GFM syntax parsing |
| Code Highlight | PrismJS | ^1.30.0 | Multi-language syntax highlighting, tomorrow theme |
| Icons | Lucide Vue Next | ^0.469.0 | Vue 3 native icon components |

## Project Structure

```
card-app/
├── src/
│   ├── components/
│   │   ├── AppLauncher.vue        # Create panel (link/category/qa/article) — frosted glass modal
│   │   ├── CardEditor.vue         # Markdown split-pane editor — light/dark dual frosted glass
│   │   ├── CardWindowContent.vue  # Card window content (flip/Markdown render)
│   │   ├── ContextMenu.vue        # Right-click context menu
│   │   ├── DesktopIcon.vue        # Desktop icon (drag-to-sort)
│   │   ├── Settings.vue           # Settings panel (appearance/desktop/cards/review/pomodoro)
│   │   └── WindowFrame.vue        # macOS-style window frame
│   ├── composables/
│   │   ├── useCardStore.js        # Core state management + Ebbinghaus spaced-repetition algorithm
│   │   ├── usePomodoro.js         # Pomodoro (focus/break cycle + stats)
│   │   ├── useSettings.js         # Global settings (persistence + theme application)
│   │   ├── useSheetWindow.js      # Modal window management (drag/z-index/maximize)
│   │   └── useZIndex.js           # Window z-index management
│   ├── db/
│   │   └── index.js               # Dexie DB definition + seed data (v1 → v9 migrations)
│   ├── locales/
│   │   ├── i18n.js                # Lightweight i18n ($t interpolation + language persistence)
│   │   ├── zh-CN/                 # Simplified Chinese strings
│   │   └── en/                    # English strings
│   ├── router/
│   │   └── index.js               # Hash route config (desktop / review)
│   ├── storage/
│   │   ├── adapter.js             # Storage adapter (auto-detects extension/Web environment)
│   │   └── providers/
│   │       ├── chrome-storage.js  # chrome.storage.local provider
│   │       └── indexeddb.js       # IndexedDB (Dexie) provider
│   ├── utils/
│   │   └── analytics-sdk.js       # Anonymous event analytics SDK
│   ├── views/
│   │   ├── DesktopView.vue        # Desktop main view (incl. trash/category-edit modals)
│   │   └── ReviewView.vue         # Review view
│   ├── App.vue
│   ├── main.js
│   └── style.css                  # Global styles (Tailwind + custom CSS)
├── docs/
│   └── screenshots/               # README screenshots
├── public/                        # Static assets (logo / manifest)
├── index.html
├── package.json
├── vite.config.js
└── wrangler.jsonc                 # Cloudflare Pages deployment config
```

## Quick Start

```bash
cd card-app
npm install
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Production build, output to `dist/` |
| `npm run preview` | Preview the production build |

## Deployment

The project ships with a Cloudflare Pages deployment config (`wrangler.jsonc`, SPA mode):

```bash
npm run build
npx wrangler pages deploy dist --name cnotely-card
```

You can also upload `dist/` to any static hosting service (Vercel / Netlify / GitHub Pages, etc.). Thanks to Hash routing, no SPA fallback rules are required.

## Architecture Notes

- **State Management**: Uses custom composables (`useCardStore` / `usePomodoro` / `useSettings`) for global singleton state — no Pinia / Vuex
- **Data Persistence**: All data is stored locally in the browser, managed by Dexie.js, supporting 9 automatic migrations (v1 → v9)
- **Storage Adaptation**: `storage/adapter.js` probes the runtime environment at startup — extension mode routes to `chrome.storage.local`, Web mode routes to IndexedDB; both interfaces are fully compatible with Dexie `db.settings`
- **Routing**: Hash mode is used to ensure correct behavior under `file://`, Chrome extension, and static hosting environments
- **Front-end Only**: No backend dependency, data is fully local; the analytics SDK is optional and anonymous
- **UI Components**: Core modal components use custom semantic CSS classes (scoped) rather than Tailwind inline utilities, ensuring consistent frosted-glass effects

## License

This project is open-sourced under the [MIT License](LICENSE).
