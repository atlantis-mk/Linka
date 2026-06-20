## ADDED Requirements

### Requirement: New tab workspace dashboard
The system SHALL replace the browser new tab page with a workspace dashboard.

#### Scenario: Opening a new tab
- **WHEN** the user opens a new browser tab
- **THEN** the system displays the Linka workspace dashboard instead of the default browser new tab page

#### Scenario: Dashboard shows primary areas
- **WHEN** the workspace dashboard loads
- **THEN** the system displays workspace navigation, current tabs, workspace resources, and search access

### Requirement: Workspace creation and editing
The system SHALL allow users to create and edit workspaces with identity and matching metadata.

#### Scenario: Creating a workspace
- **WHEN** the user creates a workspace with a name
- **THEN** the system stores the workspace and displays it in the workspace list

#### Scenario: Editing workspace metadata
- **WHEN** the user updates a workspace's name, color, icon, keywords, or pinned links
- **THEN** the system persists the updated workspace data locally

### Requirement: Workspace pinned links
The system SHALL allow users to attach pinned links to a workspace as durable resources.

#### Scenario: Adding a pinned link
- **WHEN** the user adds a URL and title as a pinned link to a workspace
- **THEN** the system displays that link in the workspace's resource area

#### Scenario: Opening a pinned link
- **WHEN** the user activates a pinned link
- **THEN** the system opens the pinned link in a browser tab

### Requirement: Current tab overview
The system SHALL display current browser tabs in the new tab dashboard.

#### Scenario: Viewing open tabs
- **WHEN** the dashboard loads with browser tabs open
- **THEN** the system displays open tabs with title, URL or domain, and window grouping where available

#### Scenario: Switching to an open tab
- **WHEN** the user activates an open tab from the dashboard
- **THEN** the system focuses the existing browser tab instead of opening a duplicate tab

### Requirement: Workspace snapshots
The system SHALL allow users to save selected open tabs or the current window as a workspace snapshot.

#### Scenario: Saving current window
- **WHEN** the user saves the current window to a workspace
- **THEN** the system creates a snapshot containing the window's tab URLs, titles, order, and saved time

#### Scenario: Viewing saved snapshots
- **WHEN** the user opens a workspace with saved snapshots
- **THEN** the system displays the snapshots with enough information to identify and restore them

### Requirement: Snapshot restoration
The system SHALL allow users to restore a saved workspace snapshot.

#### Scenario: Restoring a snapshot
- **WHEN** the user restores a saved snapshot
- **THEN** the system opens the snapshot's tab URLs in browser tabs

#### Scenario: Existing matching tab
- **WHEN** a snapshot entry already matches an open tab URL
- **THEN** the system provides a way to switch to the existing tab or avoid opening an unnecessary duplicate

### Requirement: Hybrid workspace suggestions
The system SHALL suggest likely workspace associations for current tabs using local, explainable signals.

#### Scenario: Suggesting tabs for a workspace
- **WHEN** current tabs match a workspace by keyword, domain, pinned link, or prior user choice
- **THEN** the system displays a suggestion that names the target workspace and the matching tabs

#### Scenario: Explaining a suggestion
- **WHEN** the system displays a workspace suggestion
- **THEN** the system includes a human-readable reason for the suggestion

### Requirement: User-controlled suggestions
The system MUST NOT automatically move, close, save, or assign tabs based on suggestions.

#### Scenario: Accepting a suggestion
- **WHEN** the user accepts a suggestion
- **THEN** the system performs the accepted action and records the user's choice for future suggestions

#### Scenario: Dismissing a suggestion
- **WHEN** the user dismisses a suggestion
- **THEN** the system hides that suggestion and uses the dismissal to reduce similar future suggestions

#### Scenario: Ignoring a suggestion
- **WHEN** the system has a suggestion but the user takes no action
- **THEN** the system leaves browser tabs and workspace data unchanged

### Requirement: Unified workspace search
The system SHALL provide search across open tabs, workspace pinned links, and saved snapshot entries.

#### Scenario: Searching across workspace data
- **WHEN** the user enters a search query
- **THEN** the system returns matching open tabs, pinned links, and snapshot entries

#### Scenario: Activating a search result
- **WHEN** the user activates a search result
- **THEN** the system performs the appropriate action for that result type

### Requirement: Local persistence
The system SHALL persist workspace data, snapshots, suggestions, and preferences locally in extension storage.

#### Scenario: Reloading the dashboard
- **WHEN** the user reloads the new tab dashboard after creating workspace data
- **THEN** the system restores the saved workspace data from local extension storage

#### Scenario: Offline use
- **WHEN** the user opens the dashboard without network access
- **THEN** the system displays locally stored workspaces, pinned links, and snapshots
