## Context

The project is currently a WXT + React browser extension starter with a background script, content script, and popup entrypoint. The proposed change adds a full-page new tab experience that becomes the main product surface.

The product direction is a hybrid workspace manager. Users define workspaces explicitly, while the extension observes current tabs and offers explainable suggestions about which tabs appear related to a workspace. The extension must preserve user control: it can suggest and assist, but it must not automatically move, close, save, or restore tabs without user action.

## Goals / Non-Goals

**Goals:**

- Replace the browser new tab page with a React workspace dashboard.
- Model workspaces as durable browser contexts containing identity, keywords, pinned links, and snapshots.
- Show live tabs and saved workspace resources together.
- Let users save current context into snapshots and restore saved context later.
- Provide lightweight local suggestions that connect current tabs to likely workspaces.
- Support search across open tabs, pinned links, and snapshot entries.
- Keep all workspace data local for the initial version.

**Non-Goals:**

- Cross-device account sync.
- AI-based semantic classification.
- Automatic tab cleanup or automatic workspace assignment.
- Full bookmark manager replacement.
- Deep native Chrome tab group management in the first implementation.
- Browser homepage override beyond the new tab page.

## Decisions

### Use a WXT new tab entrypoint as the primary UI

The extension will add a dedicated new tab entrypoint and configure the manifest to override the browser new tab page.

Rationale: The new tab page is the natural point where users choose what context to enter next. It is also less invasive than changing search engine or homepage settings.

Alternatives considered:

- Popup-first UI: too constrained for workspace management and tab overviews.
- Content script UI: unrelated to the user's browsing start point and harder to keep consistent.
- Homepage override: more browser-specific and more invasive than the new tab override.

### Store workspace state locally in extension storage

Workspace definitions, pinned links, snapshots, dismissed suggestions, and user preferences will be stored in local extension storage.

Rationale: Local storage keeps the first version simple, private, and offline-capable. Browser bookmarks and tabs already exist in browser state; Linka only needs to store the workspace layer.

Alternatives considered:

- Remote account sync: valuable later, but adds authentication, conflict resolution, privacy, and reliability complexity.
- Encoding all state in native bookmarks: makes workspace behavior harder to evolve and risks polluting the user's bookmark hierarchy.

### Separate explicit workspace data from inferred suggestions

The data model will distinguish user-owned workspace data from computed suggestions:

- Workspace: durable user-created object.
- Snapshot: saved set of tab entries associated with a workspace.
- Suggestion: transient or dismissible recommendation derived from current tabs and workspace signals.

Rationale: This separation prevents suggestions from being mistaken for committed user organization. It also makes it easier to explain, accept, dismiss, and expire suggestions.

Alternatives considered:

- Auto-assigning tabs to workspaces: faster in theory, but violates user control and can damage trust when wrong.
- Treating every suggestion as a saved snapshot: creates clutter and weakens the meaning of saved context.

### Start with transparent heuristic matching

Suggestions will use simple local signals such as URL domain, title keywords, workspace keywords, pinned link domains, and previous user accept/dismiss choices.

Rationale: Heuristics are explainable, testable, and sufficient for the first version. The UI can show why a suggestion exists, such as "matched keyword WXT" or "same domain as pinned link."

Alternatives considered:

- AI classification: potentially powerful, but not needed for MVP and introduces privacy and latency concerns.
- No suggestions: simpler, but loses the product's hybrid character.

### Treat snapshots as restorable tab sets, not live synchronization

Snapshots will record URLs, titles, favicons when available, order, window grouping metadata, and saved time. Restoring a snapshot opens its entries; it does not attempt to keep future browser state synchronized with the snapshot.

Rationale: Snapshot semantics are understandable and reversible. Live sync between workspace and browser windows creates complex edge cases around tab closure, duplicate tabs, and multi-window behavior.

Alternatives considered:

- Live workspace windows: stronger model, but too heavy for the first version.
- Bookmark-only workspaces: misses the main value of recovering temporary browser context.

## Risks / Trade-offs

- Permission sensitivity around tabs and bookmarks -> Request only required permissions, explain value in UI copy where relevant, and avoid invasive homepage/search overrides.
- Suggestion quality may feel noisy -> Use conservative thresholds, show reasons, and allow dismissals to affect future suggestions.
- Snapshot restore may create duplicate tabs -> Detect existing open URLs and offer switch/open choices when feasible.
- Large tab counts may affect performance -> Cache computed tab summaries, debounce search, and avoid expensive processing on every render.
- Browser API differences across Chromium and Firefox -> Keep first implementation focused on WXT-supported APIs and avoid optional native tab group behavior until validated.
- Users may confuse pinned links with browser bookmarks -> Use clear labels and preserve browser bookmark data rather than mutating it unless explicitly requested.
