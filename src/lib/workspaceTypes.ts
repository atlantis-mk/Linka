export const WORKSPACE_STORAGE_VERSION = 1;

export type WorkspaceId = string;
export type PinnedLinkId = string;
export type SnapshotId = string;

export interface PinnedLink {
  id: PinnedLinkId;
  title: string;
  url: string;
  createdAt: string;
}

export interface BookmarkSummary {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  folderTitle?: string;
  parentId?: string;
  rootTitle?: string;
  children?: BookmarkSummary[];
  isFolder?: boolean;
  index: number;
}

export interface BookmarkFolderSummary {
  id: string;
  title: string;
  parentId?: string;
  depth: number;
  rootTitle?: string;
}

export interface SnapshotTabEntry {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  windowId?: number;
  groupId?: number;
  groupTitle?: string;
  index: number;
}

export interface WorkspaceSnapshot {
  id: SnapshotId;
  workspaceId: WorkspaceId;
  title: string;
  savedAt: string;
  tabs: SnapshotTabEntry[];
}

export interface Workspace {
  id: WorkspaceId;
  name: string;
  icon: string;
  color: string;
  keywords: string[];
  pinnedLinks: PinnedLink[];
  createdAt: string;
  updatedAt: string;
}

export interface SuggestionChoice {
  key: string;
  workspaceId: WorkspaceId;
  tabUrls: string[];
  action: 'accepted' | 'dismissed';
  createdAt: string;
}

export interface WorkspaceSuggestion {
  id: string;
  workspaceId: WorkspaceId;
  tabIds: number[];
  tabUrls: string[];
  score: number;
  reasons: string[];
}

export interface UserPreferences {
  activeWorkspaceId?: WorkspaceId;
  dismissedSuggestionKeys: string[];
  acceptedSuggestionKeys: string[];
}

export interface WorkspaceState {
  version: number;
  workspaces: Workspace[];
  snapshots: WorkspaceSnapshot[];
  suggestionChoices: SuggestionChoice[];
  preferences: UserPreferences;
}

export interface TabSummary {
  id?: number;
  windowId?: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active?: boolean;
  groupId?: number;
  groupTitle?: string;
  index: number;
}

export interface WindowSummary {
  id?: number;
  focused?: boolean;
  tabs: TabSummary[];
}
