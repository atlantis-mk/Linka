import type {
  TabSummary,
  Workspace,
  WorkspaceState,
  WorkspaceSuggestion,
} from './workspaceTypes';
import { getDomain } from './url';

const MIN_SCORE = 3;

export function createSuggestionKey(workspaceId: string, tabUrls: string[]) {
  return `${workspaceId}:${tabUrls.slice().sort().join('|')}`;
}

export function buildWorkspaceSuggestions(
  state: WorkspaceState,
  tabs: TabSummary[],
): WorkspaceSuggestion[] {
  return state.workspaces
    .map((workspace) => scoreWorkspace(workspace, tabs, state))
    .filter((suggestion): suggestion is WorkspaceSuggestion => Boolean(suggestion))
    .sort((a, b) => b.score - a.score);
}

function scoreWorkspace(
  workspace: Workspace,
  tabs: TabSummary[],
  state: WorkspaceState,
): WorkspaceSuggestion | undefined {
  const matched = new Map<string, TabSummary>();
  const reasons = new Set<string>();
  let score = 0;
  const workspaceKeywords = workspace.keywords.map(normalizeText).filter(Boolean);
  const pinnedDomains = workspace.pinnedLinks.map((link) => getDomain(link.url));

  for (const tab of tabs) {
    const title = normalizeText(tab.title);
    const domain = getDomain(tab.url);

    if (workspaceKeywords.some((keyword) => title.includes(keyword))) {
      score += 2;
      matched.set(tab.url, tab);
      reasons.add('title matched workspace keyword');
    }

    if (workspaceKeywords.some((keyword) => domain.includes(keyword))) {
      score += 2;
      matched.set(tab.url, tab);
      reasons.add('domain matched workspace keyword');
    }

    if (pinnedDomains.includes(domain)) {
      score += 3;
      matched.set(tab.url, tab);
      reasons.add('same domain as a pinned link');
    }

    if (
      workspace.pinnedLinks.some((link) =>
        normalizeText(link.title)
          .split(/\s+/)
          .some((word) => word && title.includes(word)),
      )
    ) {
      score += 1;
      matched.set(tab.url, tab);
      reasons.add('title resembles a pinned resource');
    }
  }

  const tabUrls = Array.from(matched.values()).map((tab) => tab.url);
  const key = createSuggestionKey(workspace.id, tabUrls);

  if (state.preferences.acceptedSuggestionKeys.includes(key)) {
    score += 1;
    reasons.add('similar suggestion accepted before');
  }

  if (state.preferences.dismissedSuggestionKeys.includes(key)) {
    score -= 8;
  }

  if (score < MIN_SCORE || tabUrls.length === 0) {
    return undefined;
  }

  return {
    id: key,
    workspaceId: workspace.id,
    tabIds: Array.from(matched.values())
      .map((tab) => tab.id)
      .filter((id): id is number => typeof id === 'number'),
    tabUrls,
    score,
    reasons: Array.from(reasons),
  };
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}
