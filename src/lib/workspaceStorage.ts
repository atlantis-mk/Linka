import { browser } from 'wxt/browser';
import {
  WORKSPACE_STORAGE_VERSION,
  type Workspace,
  type WorkspaceState,
} from './workspaceTypes';

export const WORKSPACE_STATE_KEY = 'linka.workspaceState';

export function createDefaultWorkspaceState(): WorkspaceState {
  return {
    version: WORKSPACE_STORAGE_VERSION,
    workspaces: [],
    snapshots: [],
    suggestionChoices: [],
    preferences: {
      dismissedSuggestionKeys: [],
      acceptedSuggestionKeys: [],
    },
  };
}

export function migrateWorkspaceState(value: unknown): WorkspaceState {
  if (!value || typeof value !== 'object') {
    return createDefaultWorkspaceState();
  }

  const partial = value as Partial<WorkspaceState>;
  const defaults = createDefaultWorkspaceState();
  const workspaces = Array.isArray(partial.workspaces) ? partial.workspaces : [];

  return {
    version: WORKSPACE_STORAGE_VERSION,
    workspaces,
    snapshots: Array.isArray(partial.snapshots) ? partial.snapshots : [],
    suggestionChoices: Array.isArray(partial.suggestionChoices)
      ? partial.suggestionChoices
      : [],
    preferences: {
      ...defaults.preferences,
      ...(partial.preferences ?? {}),
      dismissedSuggestionKeys: Array.isArray(
        partial.preferences?.dismissedSuggestionKeys,
      )
        ? partial.preferences.dismissedSuggestionKeys
        : [],
      acceptedSuggestionKeys: Array.isArray(
        partial.preferences?.acceptedSuggestionKeys,
      )
        ? partial.preferences.acceptedSuggestionKeys
        : [],
      activeWorkspaceId:
        partial.preferences?.activeWorkspaceId ??
        (workspaces[0] as Workspace | undefined)?.id,
    },
  };
}

export async function readWorkspaceState(): Promise<WorkspaceState> {
  const result = await browser.storage.local.get(WORKSPACE_STATE_KEY);
  return migrateWorkspaceState(result[WORKSPACE_STATE_KEY]);
}

export async function writeWorkspaceState(state: WorkspaceState) {
  await browser.storage.local.set({
    [WORKSPACE_STATE_KEY]: migrateWorkspaceState(state),
  });
}

export async function updateWorkspaceState(
  updater: (state: WorkspaceState) => WorkspaceState,
) {
  const current = await readWorkspaceState();
  const next = migrateWorkspaceState(updater(current));
  await writeWorkspaceState(next);
  return next;
}

export function createWorkspace(
  input: Pick<Workspace, 'name' | 'icon' | 'color' | 'keywords' | 'pinnedLinks'>,
): Workspace {
  const now = new Date().toISOString();

  return {
    id: createId('workspace'),
    name: input.name.trim(),
    icon: input.icon.trim() || 'L',
    color: input.color,
    keywords: input.keywords,
    pinnedLinks: input.pinnedLinks,
    createdAt: now,
    updatedAt: now,
  };
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}
