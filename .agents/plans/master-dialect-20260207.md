# Master Plan: Dialect Digital Tableau
**Created:** 2026-02-07
**Total Features:** 11

---

## Intake Summary

**Product:** Dialect Digital Tableau
**Purpose:** A lightweight, local-first, P2P-capable digital adaptation of the tabletop game *Dialect* for collaborative storytelling. Host-Master / Client-Mirror architecture where the Host computer is the singular Source of Truth.

**Users:**
- **Host (Facilitator):** Manages deck, flow, and roles without technical overhead
- **Scribe (Linguist):** Captures new words and pronunciations quickly during Word Building
- **Player (Storyteller):** Sees private hand, interacts with table in real-time

**Tech Stack:**
| Component | Technology | Version |
|-----------|------------|---------|
| Backend | Node.js + Express | 5.x |
| Real-time | Socket.io | 4.x |
| Frontend | React + Vite | 18.3.1 / 7.x |
| Styling | Tailwind CSS | 4.x |
| Language | TypeScript | 5.x |
| Asset Processing | pdf-lib + sharp | 1.17.x / 0.34.x |
| Database | None (in-memory + localStorage + JSON) | — |

**Architecture:** Host-Master / Client-Mirror. All state-altering actions are sent to the Host first. The Host validates, updates the Master State, then broadcasts the entire updated state to all clients. Strong consistency over low latency (no optimistic UI).

**MoSCoW Priority:**
- **P0 Must-Have:** Asset slicer, P2P sync engine, 30-step undo, host admin panel, deck engine
- **P1 Should-Have:** Two-tier keyboard (sound set selection), phonetic tooltips, dictionary evolution, JSON backup
- **P2 Could-Have:** Visual age themes, markdown support, mobile hand view
- **Won't Have:** Voice/video, AI suggestions, global matchmaking

**Constraints:**
- Host is single Source of Truth; no optimistic UI
- Sandboxed server (only `/public` and `/assets` served; path traversal blocked)
- Session tokens for local network security
- State history kept compact (under 50MB)
- All commands must be PowerShell-compatible

**Phonetic Keyboard Clarification:** During setup, the group selects one of ~4 predefined sound sets from the Dialect rules (presented in a modal). The chosen set becomes the primary tier (always visible). The remaining sets are available as secondary (accessible but tucked away).

---

## Feature Queue

| # | Feature | Status | Plan File | Depends On | Complexity | Priority |
|---|---------|--------|-----------|------------|------------|----------|
| 1 | Project Scaffolding & Dev Environment | **DONE** | `01-scaffolding-20260207.md` | -- | Low | P0 |
| 2 | Master State Engine & Socket.io Backbone | **DONE** | `02-state-engine-20260207.md` | #1 | High | P0 |
| 3 | Asset Extraction Script | **DONE** | `03-asset-extraction-20260207.md` | #1 | Medium | P0 |
| 4 | Player Lobby & Networking | **DONE** | `04-player-lobby-20260207.md` | #1, #2 | Medium | P0 |
| 5 | Deck Engine & Card System | **DONE** | `05-deck-engine-20260207.md` | #2, #3 | Medium | P0 |
| 6 | Host Admin Panel | **DONE** | `06-host-admin-20260207.md` | #4, #5 | Medium | P0 |
| 7 | Tableau & Card Interaction | pending | `07-tableau-cards-20260207.md` | #5, #6 | High | P0 |
| 8 | Game Flow & Turn Management | pending | `08-game-flow-20260207.md` | #7 | Medium | P0 |
| 9 | Phonetic Keyboard & Dialect Dictionary | pending | `09-keyboard-dictionary-20260207.md` | #7, #8 | High | P1 |
| 10 | Recovery & Offline Mode | pending | `10-recovery-offline-20260207.md` | #2 | Medium | P1 |
| 11 | Visual Polish & Theming | pending | `11-visual-polish-20260207.md` | #8, #9 | Low | P2 |

## Dependency Graph

```
Feature 1 (Scaffolding)
├── Feature 2 (State Engine) ─┬── Feature 4 (Lobby) ──┐
│                              │                        ├── Feature 6 (Admin) ──┐
│                              │                        │                       │
│                              ├── Feature 5 (Deck) ───┘                       │
│                              │                                                │
│                              └── Feature 10 (Recovery)                       │
│                                                                              │
├── Feature 3 (Assets) ────── Feature 5 (Deck)                                │
│                                                                              │
└───────────────────────────── Feature 7 (Tableau) ◄───────────────────────────┘
                                       │
                                Feature 8 (Game Flow)
                                       │
                                Feature 9 (Keyboard & Dictionary)
                                       │
                                Feature 11 (Visual Polish)
```

## Parallel Execution Opportunities

- Features 2 and 3 can execute in parallel after Feature 1 (no shared code)
- Feature 10 (Recovery) can execute any time after Feature 2 (only depends on state engine)

## Project Structure (Target)

```
dialect-game/
├── server/                     # Express + Socket.io backend
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── state.ts            # Master state engine (undo/redo)
│   │   ├── deck.ts             # Deck shuffle/draw/discard
│   │   ├── types.ts            # Shared TypeScript types
│   │   ├── middleware/
│   │   │   └── security.ts     # Path traversal, whitelist
│   │   └── handlers/
│   │       ├── lobby.ts        # Player join/leave/reconnect
│   │       ├── game.ts         # Game flow events
│   │       └── admin.ts        # Host admin events
│   ├── package.json
│   └── tsconfig.json
├── client/                     # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── main.tsx            # React entry
│   │   ├── App.tsx             # Root component with routing
│   │   ├── index.css           # Tailwind v4 import
│   │   ├── socket.ts           # Socket.io client
│   │   ├── components/         # UI components
│   │   ├── hooks/              # Custom React hooks
│   │   └── contexts/           # React contexts
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── scripts/                    # Utility scripts
│   └── extract-assets.ts       # PDF card extraction
├── assets/                     # Extracted card images
│   ├── age1/
│   ├── age2/
│   ├── age3/
│   ├── archetypes/
│   ├── backdrops/
│   └── assets.json             # Card manifest
├── public/                     # Static files served by Express
├── .agents/                    # Plan artifacts
├── .cursor/                    # Workflow infrastructure
├── package.json                # Root with dev scripts
├── tsconfig.base.json          # Shared TypeScript config
└── .gitignore
```

---
*Version: 1.0.0*
