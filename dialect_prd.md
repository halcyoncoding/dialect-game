# PRODUCT REQUIREMENTS DOCUMENT: DIALECT DIGITAL TABLEAU (AGENTS-READY)

**Version:** 1.0  
**Status:** Ready for Implementation  
**Project Objective:** Build a lightweight, local-first, P2P-capable digital adaptation of the tabletop game *Dialect*. This system is designed for high-stakes collaborative storytelling, prioritizing state resilience and low-friction linguistic creation over complex animations or global networking.

---

## 1. EXECUTIVE SUMMARY & SYSTEM ARCHITECTURE
This application is a "Host-Master / Client-Mirror" system. Unlike traditional web apps, the **Host computer is the singular Source of Truth**. All game logic, card assets, and session state live on the Host's machine. Players connect directly via Local IP or a P2P handshake.

### The "Ironclad" Recovery Model
If the network fails, the Host transitions to "Recovery Mode"—a local-only interface that allows the game to continue via screen-sharing or physical proximity play. The state is backed up every action (up to 30 steps of undo) to the Host's `localStorage` and a persistent `state.json`.

---

## 2. STAKEHOLDER JOBS-TO-BE-DONE (JTBD)
- **As a Host (The Facilitator),** I want to manage the deck and flow of the game without technical overhead, so that I can focus on guiding my friends through the story.
- **As a Scribe (The Linguist),** I want a specialized interface to capture new words and pronunciations quickly, so that the group doesn't lose narrative momentum during "Word Building."
- **As a Player (The Storyteller),** I want to see my private hand and interact with the table in real-time without "silent de-syncs" ruining the mood.

---

## 3. USER STORIES (AGENTIC CODING SPEC)
```json
{
    "category": "Networking & Security",
    "description": "As a Host, I want the application to run in a sandboxed local server so that I can share my IP address with friends without exposing my personal files.",
    "steps": [
      "Launch the application executable/script on the Host machine",
      "Observe the terminal/UI output the local IP address and Port (e.g., 192.168.1.15:3000)",
      "Send this address to friends via external chat",
      "Friends enter address in browser and join the 'Lobby'"
    ],
    "acceptance_criteria": [
      "The server uses a strict whitelist for file serving (only /public directory).",
      "Path traversal attempts (e.g., ../../) are blocked at the middleware level.",
      "The application generates a unique session token for the current group to prevent random local network prying."
    ],
    "passes": false
  },

  {
    "category": "Asset Preparation",
    "description": "As a Developer/Agent, I want to automatically extract and rotate card assets from the Dialect.pdf so that they are ready for digital display.",
    "steps": [
      "Target PDF pages 162 through 185",
      "Identify the 3x3 or 4x2 grid layouts for card fronts and backs",
      "Rotate card images 90 degrees clockwise (Fronts) and 90 degrees counter-clockwise (Backs) to achieve vertical alignment",
      "Save assets into folders: /assets/age1, /assets/age2, /assets/age3, /assets/archetypes"
    ],
    "acceptance_criteria": [
      "Output files are high-resolution .png or .webp.",
      "Card fronts are matched to their corresponding backs based on the PDF's alternating page structure.",
      "The agent identifies the 'Top' of the card based on the text orientation on pages 162-185."
    ],
    "passes": false
  },

  {
    "category": "State Management",
    "description": "As a Host, I want a 30-step 'Global Undo' button so that I can revert accidental card plays or typos without breaking the player sync.",
    "steps": [
      "Perform an action (e.g., Draw Card, Add Word)",
      "Notice a mistake or player change of mind",
      "Click the 'Undo' button in the Host Dashboard",
      "Observe all connected clients' screens reverting to the previous state"
    ],
    "acceptance_criteria": [
      "The state stack maintains 30 deep snapshots of the entire 'Master State' object.",
      "Undoing a card draw returns that specific Card ID to its previous index in the deck array.",
      "The UI displays an 'Action Log' showing what was just undone."
    ],
    "passes": false
  },

  {
    "category": "Linguistic UI",
    "description": "As a Scribe, I want a Two-Tier Phonetic Keyboard so that I can input non-standard symbols without searching through system menus.",
    "steps": [
      "Select the 'Add Word' action",
      "View 'Tier 1' (The Inventory) containing the 5-10 sounds chosen for this specific Isolation",
      "Click the 'Expand' button to view 'Tier 2' (The IPA Library) for rare symbols",
      "Click a symbol to insert it into the word string"
    ],
    "acceptance_criteria": [
      "Hovering over a Tier 1 symbol shows a pronunciation tooltip (e.g., 'sh like shoe').",
      "Tier 2 contains at least 40 standard IPA symbols used in the Dialect PDF.",
      "Input field supports combining characters without layout breaking."
    ],
    "passes": false
  },

  {
    "category": "Card Interaction",
    "description": "As a Player, I want to play a card face-up to an Aspect so that the group can see the concept I am using for the turn.",
    "steps": [
      "Select a card from my 'Private Hand'",
      "Drag the card to an 'Aspect' slot on the table",
      "The card becomes visible to all players simultaneously"
    ],
    "acceptance_criteria": [
      "Card play triggers a 'Reveal' event across all Sockets.",
      "Once played, the card is removed from the player's 'hand' array in the Master State.",
      "The card animates to its position on the Tableau."
    ],
    "passes": false
  },

  {
    "category": "Recovery Logic",
    "description": "As a Host, I want a 'Panic Export' button that saves the current game state to a local JSON file.",
    "steps": [
      "The network connection becomes unstable",
      "Click 'Export Session Backup' in the Host Admin panel",
      "Save the file to the local disk",
      "Restart the app in 'Offline Mode' and upload the JSON to resume"
    ],
    "acceptance_criteria": [
      "The JSON file includes the Deck order, Discard pile, Player Hands, Dictionary, and Aspect states.",
      "The 'Offline Mode' UI disables networking logic but enables a 'Local Multi-View' for screensharing."
    ],
    "passes": false
  },

  {
    "category": "Game Flow",
    "description": "As a Host, I want a manual 'Advance Age' gate so that the app doesn't skip important narrative moments.",
    "steps": [
      "Play the final card of Age 1",
      "See the 'Ready for Age 2?' button appear",
      "Complete the 'Evolve an Aspect' narrative discussion",
      "Click 'Advance Age' to swap the active deck and update the UI theme"
    ],
    "acceptance_criteria": [
      "The button only appears once the rules-defined card limit is reached.",
      "Advancing Age triggers a state save and archives the previous Age's cards.",
      "A visible 'Reminder' stays on screen until the Scribe updates the evolved Aspect name."
    ],
    "passes": false
  },

  {
    "category": "Role Assignment",
    "description": "As a Host, I want to assign the 'Scribe' role to a specific player so they can manage the dictionary.",
    "steps": [
      "Open the 'Player Management' tab",
      "Select 'Player 2'",
      "Toggle the 'Scribe' permission",
      "Player 2's UI updates to include the Word Building keyboard"
    ],
    "acceptance_criteria": [
      "Only one Scribe can be active at a time.",
      "The Host retains 'Super-Admin' rights (can edit anything the Scribe can).",
      "Permissions are synchronized via the Master State."
    ],
    "passes": false
  },

  {
    "category": "Narrative Tools",
    "description": "As a Player, I want to see a tooltip reminder of our 'Isolation' and 'Aspects' at all times.",
    "steps": [
      "Hover over the 'Tableau' header",
      "Read the summary of the Backdrop and the current state of our three Aspects"
    ],
    "acceptance_criteria": [
      "The summary is editable by the Host/Scribe.",
      "Text updates in real-time for all observers.",
      "Supports markdown-style emphasis for key narrative terms."
    ],
    "passes": false
  },

  {
    "category": "Dictionary Management",
    "description": "As a group, we want an automated 'Dialect Dictionary' that grows as we play.",
    "steps": [
      "Scribe saves a new word",
      "The 'Dictionary' sidebar updates with the Word, Meaning, and the Aspect it originated from"
    ],
    "acceptance_criteria": [
      "The dictionary is searchable by all players.",
      "The list is sorted chronologically by default (Age 1 -> Age 2 -> Age 3).",
      "Exporting the dictionary to a text file is available at the end of the game."
    ],
    "passes": false
  },

  {
    "category": "Turn Lifecycle",
    "description": "As a Host, I want the system to track whose turn it is and highlight their UI.",
    "steps": [
      "Start the game",
      "Observe 'Player 1''s name glowing on the shared view",
      "Player 1 completes their word building",
      "Click 'Next Turn' to rotate the focus to 'Player 2'"
    ],
    "acceptance_criteria": [
      "Turn order is configurable (Drag and drop player names to reorder).",
      "The 'Active' player receives a visual cue on their device.",
      "Host can manually override the turn focus at any time."
    ],
    "passes": false
  },

  {
    "category": "Setup Phase",
    "description": "As a Host, I want to select a Backdrop from the PDF assets to initialize the game state.",
    "steps": [
      "Navigate to 'New Game'",
      "Select 'Martian Colony' from the Backdrop gallery",
      "The app automatically loads the specific cards/flavors associated with that Backdrop"
    ],
    "acceptance_criteria": [
      "Backdrops are pulled from the folder generated during the asset extraction phase.",
      "Loading a Backdrop sets the initial 'Atmosphere' text in the sidebar."
    ],
    "passes": false
  },

  {
    "category": "Archetype Distribution",
    "description": "As a Host, I want to 'Deal' Archetype cards to players during character creation.",
    "steps": [
      "Open the 'Archetype' deck",
      "Click 'Deal to All'",
      "Each player receives one private Archetype card"
    ],
    "acceptance_criteria": [
      "Archetypes are removed from the central pool once dealt.",
      "Players can 'Reveal' their Archetype to the table if they choose.",
      "Host can see all dealt Archetypes in the Admin view."
    ],
    "passes": false
  },

  {
    "category": "Linguistic Evolution",
    "description": "As a Scribe, I want to create a 'Variant' of an existing word to show how the language is changing.",
    "steps": [
      "Select a word in the Dictionary",
      "Click 'Create Variant'",
      "Input new spelling and modified meaning",
      "The UI displays the words as a 'Tree' or 'Evolutionary Path'"
    ],
    "acceptance_criteria": [
      "Variants remain linked to their 'Parent' word.",
      "The Dictionary clearly marks which Age the variant appeared in.",
      "Variants don't replace the original word; they add to it."
    ],
    "passes": false
  },

  {
    "category": "Offline Mode UI",
    "description": "As a Host, I want a single-screen 'Tabletop Mode' for when we are playing in person.",
    "steps": [
      "Toggle 'Tabletop Mode' in settings",
      "All private information is hidden behind 'Click to Reveal' overlays",
      "The UI maximizes the Tableau and Dictionary for a single large monitor"
    ],
    "acceptance_criteria": [
      "Private hands are replaced by a 'Player Area' with hidden card counts.",
      "Cards are larger and optimized for 1080p/4K TV viewing.",
      "All 'Admin' controls are moved to a collapsible sidebar."
    ],
    "passes": false
  },
  {
  "category": "Linguistic Evolution",
  "description": "As a Scribe, I want to create a 'Variant' of an existing word to show how the language is changing over the Ages.",
  "steps": [
    "Open the 'Dialect Dictionary' sidebar",
    "Select an existing word from Age 1",
    "Click the 'Evolve Word' button",
    "Input the new phonetic spelling and shifted meaning",
    "Save the variant"
  ],
  "acceptance_criteria": [
    "The new word entry stores the ID of the 'Parent' word.",
    "The Dictionary UI displays a visual line or indent connecting the original to the variant.",
    "The variant is automatically tagged with the current Age (Age 2 or 3)."
  ],
  "passes": false
},

{
  "category": "Recovery Logic",
  "description": "As a Host, I want the system to automatically generate a 'Snapshot' after every Undo so I can 'Redo' if I go too far back.",
  "steps": [
    "Click 'Undo' to revert a mistake",
    "Realize the mistake was actually correct",
    "Click 'Redo' to move forward one step in the history stack"
  ],
  "acceptance_criteria": [
    "The history stack maintains a pointer to the current version.",
    "Performing a new action after an Undo clears the 'Redo' path to prevent timeline divergence.",
    "The 'Redo' button is disabled if the user is at the most recent version."
  ],
  "passes": false
},

{
  "category": "Offline Mode UI",
  "description": "As a Host, I want a single-screen 'Tabletop Mode' for when we are playing in person around a single monitor.",
  "steps": [
    "Navigate to the 'Settings' menu",
    "Toggle 'Tabletop/Screenshare Mode'",
    "Observe the UI hiding player-specific 'Private Hands' and maximizing the Tableau"
  ],
  "acceptance_criteria": [
    "Private information is hidden behind 'Click to Reveal' buttons.",
    "The font sizes for the Dictionary and Aspects increase by 20% for readability at a distance.",
    "Host controls (Undo/Next Age) remain accessible in a floating action button."
  ],
  "passes": false
},

{
  "category": "Game Flow",
  "description": "As a Host, I want to 'Lock' the session so no new players can join once the game has started.",
  "steps": [
    "Confirm all friends are in the Lobby",
    "Toggle 'Lock Session' in the Admin panel",
    "Any new connection attempts to the IP address receive a 'Session in Progress' message"
  ],
  "acceptance_criteria": [
    "The server rejects new Socket connections when `isLocked` is true.",
    "The Host can unlock the session if a player needs to swap devices."
  ],
  "passes": false
},
{
    "category": "Game Flow",
    "description": "As a Player, I want to formally 'Connect' my played card to an Aspect so that the linguistic evolution is visually documented on the Tableau.",
    "steps": [
      "Drag a card from my hand onto the Tableau",
      "The UI prompts: 'Which Aspect does this connect to?'",
      "Select an Aspect (e.g., 'The Martian Dust')",
      "The card snaps to a position under that Aspect, and a visual 'Connection' line or border color is applied"
    ],
    "acceptance_criteria": [
      "The `globalState` updates the `card.connectionId` to match the `aspect.id`.",
      "The Tableau UI groups cards by Aspect automatically.",
      "The Undo history can revert a connection without deleting the card."
    ],
    "passes": false
  },

  {
    "category": "Game Flow",
    "description": "As a Host, I want to trigger the 'Legacy Phase' after Age 3 so that we can conclude our story according to the rules.",
    "steps": [
      "Finish the final turn of Age 1",
      "Click the 'Begin the Legacy' button",
      "View the final prompts for the society's end/transformation",
      "Scribe records the final 'Legacy' note for each Aspect"
    ],
    "acceptance_criteria": [
      "The UI transitions to a high-contrast 'Memorial' theme.",
      "The 'Add Word' functionality is disabled, replaced by 'Final Narrative' inputs.",
      "The final state is locked from further edits once 'End Game' is clicked."
    ],
    "passes": false
  },

  {
    "category": "Networking",
    "description": "As a Player, I want to join the game using a 'Display Name' so that my private hand is correctly associated with my identity.",
    "steps": [
      "Enter the Host's IP address in the browser",
      "View a 'Join Game' splash screen",
      "Enter my name and choose a color avatar",
      "Wait for Host approval to join the session"
    ],
    "acceptance_criteria": [
      "The system prevents two players from having the same name.",
      "Player names are persisted in the `globalState.players` array.",
      "If a player refreshes, the system uses a browser 'sessionID' to reconnect them to their specific hand."
    ],
    "passes": false
  }
```


---

## 4. FUNCTIONAL REQUIREMENTS (MOSCOW)

### MUST HAVE (P0)
- **Asset Slicer:** Script to convert `Dialect.pdf` (Pgs 162-185) into upright, normalized card assets.
- **P2P Sync Engine:** Real-time state synchronization via Socket.io/WebSockets.
- **Master State History:** 30-step deep-cloned state snapshots for Undo.
- **Host Admin Panel:** Ability to force state, deal cards, and manage roles.
- **Deck Engine:** Randomized shuffling for Age 1, 2, and 3 decks with "Draw/Discard" logic.

### SHOULD HAVE (P1)
- **Two-Tier Keyboard:** tier 1 (Inventory) and tier 2 (Full IPA).
- **Phonetic Tooltips:** Hoverable pronunciation guides for chosen symbols.
- **Dictionary Evolution:** Branching word paths for variants.
- **Local JSON Backup:** One-click session export/import.

### COULD HAVE (P2)
- **Visual Themes:** CSS transitions that shift from "Hopeful" (Age 1) to "Decaying" (Age 3).
- **Markdown Support:** For the "Conversation" notes and Aspect descriptions.
- **Mobile Hand View:** Responsive layout for players using phones as their "Private Hand."

### WON’T HAVE (FOR NOW)
- **Integrated Voice/Video:** This is handled by Zoom/Discord.
- **AI Word Suggestions:** The players generate all linguistic content.
- **Global Matchmaking:** This is strictly for private groups of friends.

---

## 5. TECHNICAL SPECIFICATIONS

### Data Model: The Master State
The state is a singular JSON object.
```json
{
  "session": {
    "id": "uuid",
    "age": 1,
    "turnIndex": 0,
    "backdrop": "ID",
    "isolationSummary": "Text"
  },
  "roles": {
    "host": "PlayerID",
    "scribe": "PlayerID"
  },
  "decks": {
    "age1": ["CardID", "..."],
    "discard": []
  },
  "players": [
    {
      "id": "PlayerID",
      "name": "Name",
      "hand": ["CardID", "..."],
      "archetype": "CardID"
    }
  ],
  "dictionary": [
    {
      "word": "String",
      "ipa": "String",
      "meaning": "String",
      "age": 1,
      "parentWord": "null"
    }
  ],
  "history": [], // Stack of previous 30 state objects
"aspects": [
    {
      "id": "aspect_1",
      "name": "The Original Aspect",
      "evolution": "The Evolved Aspect Name",
      "age_evolved": 2,
      "status": "active" // or 'faded' in Age 3
    }
  ],
  "connections": [
    {
      "cardId": "card_01",
      "aspectId": "aspect_1",
      "playerId": "player_uuid",
      "notes": "Narrative justification"
    }
  ]
}
```

### 5. TECHNICAL SPECIFICATIONS (CONTINUED)

#### Networking Logic (Socket.io Implementation)
- **The Push Model:** To ensure the Host remains the Source of Truth, all state-altering actions (e.g., `DRAG_CARD`, `SAVE_WORD`) must be sent to the Host first. The Host validates the action, updates the Master State, and then broadcasts the *entire* updated state object to all connected clients.
- **Failover Protocol:** If a client (Player) disconnects, the frontend will attempt a silent reconnect for 30 seconds. Upon a successful socket handshake, the client emits a `REQUEST_LATEST_STATE` event, and the Host responds with the current `session_state` object.
- **Latency Handling:** Since *Dialect* is a turn-based, narrative-heavy game, "Optimistic UI" updates are disabled to prevent state flickering. We prioritize "Strong Consistency" over "Low Latency."

#### Asset Extraction Logic (Instruction for the Agent)
The Agent must create a standalone script `scripts/extract_assets.js` that performs the following:
- **Library:** Use `pdf-lib` for page parsing and `sharp` or `canvas` for image processing.
- **Coordinates Mapping:**
  - **Archetypes (Page 162):** 3 columns x 3 rows grid. Fronts on P162, Backs on P163.
  - **Age 1 (Pages 164-167):** 4 columns x 2 rows per page.
  - **Normalization:** Every extracted image must be cropped to exactly 750px x 1050px (300 DPI equivalent) and auto-rotated so the text is horizontal.
- **Pairing:** Fronts and Backs must be paired into a metadata manifest (`assets.json`) so the UI can handle "Flip" animations.

---

### 6. AGENTIC CODING INSTRUCTIONS (CURSOR/PROMPT)

> "Act as a Senior Full Stack Engineer. Build the Dialect Digital Tableau according to the provided PRD. 
> 1. **Core Stack:** Node.js (Express) + Socket.io for the backend; React + Tailwind CSS for the frontend.
> 2. **Master State:** Implement a singular `globalState` object on the server. Use `structuredClone()` to create history snapshots before every mutation.
> 3. **The 'Local' Sandbox:** Configure the Express server to only serve files from the `/public` and `/assets` directories. Block all path traversal attempts.
> 4. **P2P Hosting:** Add a 'Copy Join Link' button in the Host UI that automatically uses the Host's local IP address (detected via `os.networkInterfaces()`).
> 5. **Recovery Logic:** Implement an `useEffect` hook that saves the `globalState` to `localStorage` on the Host's browser every time the version index changes. Create a 'Restore from LocalStorage' button in the Admin view."

---

### 8. SUCCESS METRICS & KPIS
- **Zero Data Loss:** 100% of sessions must be recoverable from the Host's `localStorage` after a browser crash.
- **Asset Integrity:** The extraction script must successfully identify and rotate 100% of the cards in the provided PDF without manual cropping.
- **User Latency:** Role assignments (Scribe/Host) must propagate to all clients in under 200ms on a local network.
- **Zero Silent De-Syncs:** 100% of state changes must be confirmed by the Host's Master State.
- **Recovery Speed:** Re-hosting from a backup JSON must take less than 10 seconds.
- **Linguistic Flow:** Average time to input a word with non-standard characters should be under 15 seconds for a trained Scribe.

---

### 9. RISK MITIGATION
- **Asset Resolution:** If the PDF render quality is low, the Agent should implement a `upscale: true` flag using a library like `sharp` to ensure text is legible.
- **State Bloat:** With a 30-step history, the state object could grow. The Agent must ensure the history stack only stores the *diffs* or compact JSON objects to keep memory usage under 50MB.
- **Host internet drops:** The "Tabletop Mode" allows the Host to continue locally, and the state is always saved in localStorage.
- **Conflict in word editing:** Only the 'Scribe' or 'Host' has write-access to the Word Building modal.
- **Asset Pairing Failure:** Because the PDF alternates Fronts and Backs, the extraction script must use a 'Zig-Zag' mapping. On Page 162 (Fronts), Card 1 is top-left. On Page 163 (Backs), the corresponding back for Card 1 is top-right (due to the way double-sided printing works). The agent must implement a `map_front_to_back()` function that accounts for this horizontal mirroring.
---
**END OF PRD PART**