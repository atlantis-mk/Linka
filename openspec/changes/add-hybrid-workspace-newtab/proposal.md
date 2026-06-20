## Why

Browser tabs are temporary working context, while bookmarks are long-term memory. Users who work across projects need a new tab experience that helps them recover, save, and organize context without forcing manual cleanup every time.

This change turns the extension's new tab page into a hybrid workspace manager: users define workspaces, and the extension suggests relevant tabs or saved resources for those workspaces.

## What Changes

- Add a new tab replacement experience focused on browser workspaces.
- Let users create and manage workspaces with names, visual identity, keywords, and pinned links.
- Show current open tabs alongside workspace resources so users can see live context and saved context together.
- Let users save the current window or selected tabs as a workspace snapshot.
- Let users restore workspace snapshots and pinned links from the new tab page.
- Provide lightweight, explainable suggestions that identify tabs likely related to a workspace.
- Let users accept, dismiss, or ignore suggestions; suggestions must not automatically move, close, or save tabs.
- Add unified search across open tabs, workspace pinned links, and saved snapshots.

## Capabilities

### New Capabilities

- `workspace-newtab`: Defines the new tab workspace manager, including workspace creation, pinned links, snapshots, tab display, restore behavior, search, and hybrid suggestions.

### Modified Capabilities

- None.

## Impact

- Adds a new WXT new tab entrypoint and Chrome new tab override manifest configuration.
- Uses browser extension APIs for tabs, bookmarks or link resources, windows, and local extension storage.
- Introduces persistent workspace, snapshot, and suggestion data stored locally in the extension.
- Updates the React UI from the starter popup-focused scaffold toward a full-page new tab application.
- May require new extension permissions such as `tabs`, `bookmarks`, `storage`, and possibly `tabGroups` if native tab group integration is included later.
