# Feature: Project Scaffolding & Dev Environment

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Initialize the full project structure for the Dialect Digital Tableau: a monorepo-style setup with a Node.js/Express/Socket.io server and a React/Vite/Tailwind client. This feature creates all configuration files, dev scripts, and the minimal runnable skeleton that all subsequent features build on.

## User Story

As a Developer
I want a fully configured project with server and client skeletons
So that I can begin implementing game features on a solid, working foundation

## Problem Statement

The repo currently contains only agentic workflow infrastructure (`.cursor/`, `.claude/`, `.agents/`) and documentation. There is no application code, no package.json, no TypeScript config, and no dev tooling. Every subsequent feature depends on this foundation existing.

## Solution Statement

Create a root package.json with dev scripts that run server and client concurrently. The server is a minimal Express + Socket.io app serving static files. The client is a Vite-powered React + Tailwind CSS 4 app that proxies API/socket requests to the server in development. TypeScript is used throughout.

## Feature Metadata

| Attribute | Value |
|-----------|-------|
| **Feature Type** | New Capability |
| **Complexity** | Low |
| **Affected Systems** | Entire project (foundation) |
| **Dependencies** | Node.js 20+, npm |

---

## CONTEXT REFERENCES

### Relevant Codebase Files

**IMPORTANT: Read these files before implementing!**

- `.cursor/rules/universal/code-conventions.mdc` - Why: Naming conventions (kebab-case files, camelCase functions, PascalCase components)
- `.cursor/guides/brand_guide/user_interfaces/brand_guide_webapp.md` - Why: Feather Design System color tokens, typography (Poppins/Inter) for initial CSS setup
- `.gitignore` - Why: Needs updating with project-specific entries
- `.cursor/rules/project/project-context.mdc` - Why: Template that must be filled in with real values

### New Files to Create

- `package.json` - Root package with dev scripts
- `server/package.json` - Server dependencies
- `server/tsconfig.json` - Server TypeScript config
- `server/src/index.ts` - Express + Socket.io entry point
- `client/package.json` - Client dependencies
- `client/tsconfig.json` - Client TypeScript config
- `client/tsconfig.node.json` - Vite config TypeScript settings
- `client/vite.config.ts` - Vite + Tailwind plugin + dev proxy
- `client/index.html` - HTML entry point
- `client/src/main.tsx` - React DOM render
- `client/src/App.tsx` - Root component shell
- `client/src/index.css` - Tailwind v4 import
- `client/src/vite-env.d.ts` - Vite type declarations
- `tsconfig.base.json` - Shared TypeScript base config

### Relevant Documentation

- [Express 5.x docs](https://expressjs.com/) - Why: Express 5 API changes from 4.x
- [Socket.io v4 docs](https://socket.io/docs/v4/) - Why: Server/client setup
- [Vite 7.x docs](https://vitejs.dev/) - Why: Config and plugin system
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs) - Why: CSS-first config, @import syntax, @tailwindcss/vite plugin

### Patterns to Follow

**Naming Conventions:**
```
Files: kebab-case (e.g., game-state.ts, player-hand.tsx)
Functions: camelCase (e.g., handleCardDraw, createSession)
Components: PascalCase (e.g., PlayerHand, GameBoard)
Types/Interfaces: PascalCase (e.g., GameState, PlayerInfo)
Constants: SCREAMING_SNAKE (e.g., MAX_HISTORY_SIZE, DEFAULT_PORT)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Root Configuration

Create the root-level files that tie the project together: base TypeScript config and root package.json with workspace scripts.

**Tasks:**
- Create `tsconfig.base.json` with shared compiler options
- Create root `package.json` with concurrently scripts
- Update `.gitignore` with full project entries

### Phase 2: Server Skeleton

Create the Express + Socket.io server with minimal functionality: serve static files and accept socket connections.

**Tasks:**
- Create `server/package.json` with Express, Socket.io, TypeScript deps
- Create `server/tsconfig.json` extending base
- Create `server/src/index.ts` with Express + Socket.io + static file serving

### Phase 3: Client Skeleton

Create the React + Vite + Tailwind CSS 4 client with a minimal App component.

**Tasks:**
- Create `client/package.json` with React, Vite, Tailwind deps
- Create `client/tsconfig.json` and `client/tsconfig.node.json`
- Create `client/vite.config.ts` with Tailwind plugin and server proxy
- Create `client/index.html`, `client/src/main.tsx`, `client/src/App.tsx`, `client/src/index.css`

### Phase 4: Dev Scripts & Validation

Wire up the dev scripts so `npm run dev` from root starts both server and client.

**Tasks:**
- Verify `npm install` succeeds from root
- Verify `npm run dev` starts both server (port 3000) and client (port 5173)
- Verify client proxies to server correctly

---

## STEP-BY-STEP TASKS

**IMPORTANT:** Execute every task in order, top to bottom. Each task is atomic.

---

### CREATE `tsconfig.base.json` [parallel_group: 1]

- **IMPLEMENT**: Shared TypeScript compiler options — strict mode, ES2022 target, module resolution bundler, JSX react-jsx
- **VALIDATE**: File exists with valid JSON

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

---

### CREATE `package.json` (root) [parallel_group: 1]

- **IMPLEMENT**: Root package.json with:
  - `name`: `dialect-game`
  - `private`: true
  - `scripts`:
    - `dev`: uses concurrently to run server + client
    - `dev:server`: runs server in watch mode
    - `dev:client`: runs Vite dev server
    - `build`: builds client, then compiles server
    - `start`: runs compiled server (production)
    - `extract-assets`: runs the PDF extraction script
  - `devDependencies`: concurrently, typescript
- **VALIDATE**: `npm install` (root only, no workspaces yet)

```json
{
  "name": "dialect-game",
  "version": "0.1.0",
  "private": true,
  "description": "Digital tabletop adaptation of the Dialect storytelling game",
  "scripts": {
    "dev": "concurrently -n server,client -c blue,green \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build && cd ../server && npm run build",
    "start": "cd server && npm start",
    "extract-assets": "cd scripts && npx tsx extract-assets.ts",
    "install:all": "npm install && cd server && npm install && cd ../client && npm install"
  },
  "devDependencies": {
    "concurrently": "^9.2.1",
    "typescript": "^5.7.3"
  }
}
```

---

### UPDATE `.gitignore` [parallel_group: 1]

- **IMPLEMENT**: Add entries for:
  - `node_modules/` (already present but ensure full coverage)
  - `dist/` (server and client build output)
  - `*.env` and `.env.*`
  - `assets/*.png`, `assets/*.webp` (extracted images — large binary files)
  - `assets/assets.json` (generated manifest)
  - `state-backup*.json` (runtime state backups)
  - `.agents/temp/` contents (but keep directory)
- **GOTCHA**: Keep `.agents/plans/` and `.agents/reports/` tracked
- **VALIDATE**: `git status` shows expected files

---

### CREATE `server/package.json` [parallel_group: 2]

- **IMPLEMENT**: Server package with Express, Socket.io, TypeScript, and dev tooling
- **VALIDATE**: `cd server && npm install` succeeds

```json
{
  "name": "dialect-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^5.1.0",
    "socket.io": "^4.8.3",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.3"
  }
}
```

---

### CREATE `server/tsconfig.json` [parallel_group: 2]

- **IMPLEMENT**: Extends base config, targets Node.js, outputs to `dist/`
- **VALIDATE**: `cd server && npx tsc --noEmit` passes

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ES2022",
    "target": "ES2022",
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

---

### CREATE `server/src/index.ts` [parallel_group: 3]

- **IMPLEMENT**: Minimal Express + Socket.io server that:
  - Creates Express app and HTTP server
  - Attaches Socket.io to the HTTP server
  - Serves `/public` directory for static files
  - Serves `/assets` directory for card images
  - Blocks path traversal attempts in middleware
  - Listens on PORT env var or 3000
  - Logs local IP address for players to connect
  - Accepts socket connections and logs them
- **IMPORTS**: `express`, `http`, `socket.io`, `os`, `path`, `url`
- **GOTCHA**: Express 5 uses `req.path` not `req.url` for some checks. Use `path.resolve()` + `path.normalize()` to detect traversal.
- **GOTCHA**: With `"type": "module"`, use `import.meta.url` and `fileURLToPath` for `__dirname` equivalent.
- **VALIDATE**: `cd server && npx tsx src/index.ts` starts without errors, responds on http://localhost:3000

---

### CREATE `client/package.json` [parallel_group: 2]

- **IMPLEMENT**: Client package with React, Vite, Tailwind CSS v4, TypeScript
- **VALIDATE**: `cd client && npm install` succeeds

```json
{
  "name": "dialect-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.4.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.7.3",
    "vite": "^6.3.0"
  }
}
```

---

### CREATE `client/tsconfig.json` [parallel_group: 2]

- **IMPLEMENT**: Extends base, adds JSX support, references tsconfig.node.json

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "noEmit": true,
    "types": []
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### CREATE `client/tsconfig.node.json` [parallel_group: 2]

- **IMPLEMENT**: TypeScript config for Vite config file

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

---

### CREATE `client/vite.config.ts` [parallel_group: 3]

- **IMPLEMENT**: Vite config with:
  - `@vitejs/plugin-react` for React Fast Refresh
  - `@tailwindcss/vite` for Tailwind CSS v4
  - Dev server proxy: `/socket.io` and `/api` requests forward to `http://localhost:3000`
- **VALIDATE**: `cd client && npx vite --version` runs

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:3000',
      },
      '/assets': {
        target: 'http://localhost:3000',
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

---

### CREATE `client/index.html` [parallel_group: 3]

- **IMPLEMENT**: Minimal HTML entry point for Vite with root div and module script
- **GOTCHA**: Tailwind v4 loads via CSS import, not HTML link

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dialect — Digital Tableau</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### CREATE `client/src/index.css` [parallel_group: 3]

- **IMPLEMENT**: Tailwind CSS v4 import (CSS-first config, no tailwind.config.js needed)
- **GOTCHA**: Tailwind v4 uses `@import "tailwindcss"` instead of `@tailwind base/components/utilities`

```css
@import "tailwindcss";

/* Feather Design System - Base Theme Tokens */
@theme {
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;

  --color-orange: #FF9A0D;
  --color-storm-100: #F0F4F8;
  --color-storm-200: #D9E2EC;
  --color-storm-300: #BCCCDC;
  --color-storm-500: #627D98;
  --color-storm-700: #334E68;
  --color-storm-900: #102A43;
  --color-spruce: #0A6C5C;
  --color-iron: #9B6B6B;
  --color-oxide: #C0392B;
  --color-amber: #B8860B;
}
```

---

### CREATE `client/src/main.tsx` [parallel_group: 3]

- **IMPLEMENT**: React DOM render of App component into root div
- **IMPORTS**: React, ReactDOM, App, index.css

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

### CREATE `client/src/App.tsx` [parallel_group: 3]

- **IMPLEMENT**: Minimal root component that confirms the app is running. Shows project name and a "Connected" placeholder. Uses Tailwind classes and Feather brand fonts.
- **GUIDES**: `.cursor/guides/brand_guide/user_interfaces/brand_guide_webapp.md` for color tokens

```tsx
const App = () => {
  return (
    <div className="min-h-screen bg-storm-900 text-storm-100 font-body flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold text-orange mb-4">
          Dialect
        </h1>
        <p className="text-storm-300 text-lg">Digital Tableau — Loading...</p>
      </div>
    </div>
  );
};

export default App;
```

---

### CREATE `client/src/vite-env.d.ts` [parallel_group: 3]

- **IMPLEMENT**: Vite type declarations for TypeScript

```typescript
/// <reference types="vite/client" />
```

---

### VALIDATE Full Stack [parallel_group: 4]

- **VALIDATE**: `npm run install:all` — all dependencies install cleanly
- **VALIDATE**: `npm run dev` — server starts on :3000, client starts on :5173
- **VALIDATE**: Open http://localhost:5173 — see "Dialect" heading rendered with correct fonts
- **VALIDATE**: Socket.io proxy works (no CORS errors in console)

---

## TESTING STRATEGY

### Unit Tests

No unit tests for scaffolding — this is infrastructure.

### Integration Tests

- Server responds to HTTP requests on port 3000
- Client renders without errors on port 5173
- Vite proxy forwards `/socket.io` requests to server

### Edge Cases

- Port 3000 already in use (server should log helpful error)
- Missing node_modules (install:all script handles this)

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```powershell
cd server
npx tsc --noEmit
cd ../client
npx tsc -b
```

### Level 2: Server Starts
```powershell
cd server
npx tsx src/index.ts
# Should log: "Server listening on http://localhost:3000"
# Should log: "Local network: http://{local-ip}:3000"
```

### Level 3: Client Starts
```powershell
cd client
npx vite
# Should log: "Local: http://localhost:5173"
```

### Level 4: Manual Validation
- Open http://localhost:5173 in browser
- See "Dialect — Digital Tableau" heading
- No console errors
- Network tab shows no failed requests

---

## ACCEPTANCE CRITERIA

- [x] Root `package.json` exists with `dev`, `build`, `start`, `install:all` scripts
- [x] Server starts on port 3000 with Express + Socket.io
- [x] Server serves static files from `/public` and `/assets` directories
- [x] Server blocks path traversal attempts
- [x] Client starts on port 5173 with Vite + React + Tailwind
- [x] Client proxies `/socket.io` and `/api` to server in dev mode
- [x] TypeScript compiles without errors in both server and client
- [x] Tailwind CSS v4 loads and custom theme tokens are available
- [x] Google Fonts (Poppins + Inter) load correctly
- [x] `npm run dev` from root starts both server and client concurrently

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands successful
- [ ] No linting or type errors
- [ ] Manual testing confirms app renders
- [ ] Project structure matches master plan

---

## NOTES

- **Express 5.x:** Uses native promise support. No need for `express-async-errors`.
- **Tailwind v4:** CSS-first config means no `tailwind.config.js`. Theme tokens defined in CSS `@theme` block.
- **TypeScript:** Using `tsx` for dev server (watch mode with hot reload). Using `tsc` for production builds.
- **Concurrently:** Prefixes server/client output with color-coded labels for easy debugging.
- **Port Strategy:** Server on 3000 (production port), Vite dev server on 5173 (default). In production, Express serves the built React app directly.
