## 1. New Tab Entrypoint And Permissions

- [x] 1.1 Add a WXT React new tab entrypoint for the workspace dashboard.
- [x] 1.2 Configure the extension manifest to override the browser new tab page.
- [x] 1.3 Add required extension permissions for tabs and local storage.
- [x] 1.4 Add bookmark permission only if pinned links integrate with browser bookmarks in the implementation.
- [x] 1.5 Verify the new tab page loads during local extension development.

## 2. Workspace Data Model And Persistence

- [x] 2.1 Define TypeScript types for workspace, pinned link, snapshot, snapshot tab entry, suggestion, and user preferences.
- [x] 2.2 Implement local storage helpers for reading and writing workspace state.
- [x] 2.3 Add default empty state handling for first-time users.
- [x] 2.4 Add migration-safe storage versioning for future workspace schema changes.

## 3. Browser Tab Integration

- [x] 3.1 Implement a browser API adapter for listing current tabs and windows.
- [x] 3.2 Implement switching to an existing tab from dashboard actions.
- [x] 3.3 Implement opening pinned links and snapshot entries in browser tabs.
- [x] 3.4 Implement duplicate URL detection for snapshot restoration.
- [x] 3.5 Add graceful fallback behavior when tab metadata is unavailable.

## 4. Workspace Management

- [x] 4.1 Build workspace creation and editing flows for name, icon, color, keywords, and pinned links.
- [x] 4.2 Display workspace navigation and active workspace state on the dashboard.
- [x] 4.3 Display pinned links for the active workspace.
- [x] 4.4 Implement saving the current window as a workspace snapshot.
- [x] 4.5 Display saved snapshots with saved time and recognizable tab summaries.
- [x] 4.6 Implement snapshot restoration with duplicate handling.

## 5. Hybrid Suggestions

- [x] 5.1 Implement local matching signals for domain, title keyword, workspace keyword, pinned link domain, and prior user choice.
- [x] 5.2 Implement confidence scoring and conservative thresholds for showing suggestions.
- [x] 5.3 Display suggestion cards with target workspace, matched tabs, and human-readable reasons.
- [x] 5.4 Implement accepting suggestions without automatically acting before user confirmation.
- [x] 5.5 Implement dismissing suggestions and using dismissals to reduce similar future suggestions.
- [x] 5.6 Verify ignored suggestions do not change browser tabs or workspace data.

## 6. Unified Search

- [x] 6.1 Index open tabs, workspace pinned links, and snapshot entries for local search.
- [x] 6.2 Display grouped search results by result type.
- [x] 6.3 Implement result activation for switching tabs, opening links, and opening snapshot entries.
- [x] 6.4 Ensure search remains responsive with large tab and snapshot counts.

## 7. UI Polish And Validation

- [x] 7.1 Replace starter popup styling with a responsive full-page dashboard layout.
- [x] 7.2 Add loading, empty, and error states for browser API and storage access.
- [x] 7.3 Add focused tests for storage helpers, matching logic, and duplicate detection.
- [x] 7.4 Run TypeScript compilation and extension build.
- [ ] 7.5 Manually verify dashboard behavior in a browser extension development build.
