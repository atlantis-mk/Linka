import type {
  TabSummary,
  Workspace,
  WorkspaceSnapshot,
} from './workspaceTypes';
import { getDomain } from './url';

export type SearchResult =
  | { type: 'tab'; id: string; title: string; subtitle: string; tab: TabSummary }
  | {
      type: 'pinned-link';
      id: string;
      title: string;
      subtitle: string;
      workspace: Workspace;
      url: string;
    }
  | {
      type: 'snapshot-entry';
      id: string;
      title: string;
      subtitle: string;
      snapshot: WorkspaceSnapshot;
      url: string;
    };

export function searchWorkspaceData(
  query: string,
  tabs: TabSummary[],
  workspaces: Workspace[],
  snapshots: WorkspaceSnapshot[],
): SearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const tabResults: SearchResult[] = tabs
    .filter((tab) => matches(normalized, tab.title, tab.url, getDomain(tab.url)))
    .map((tab) => ({
      type: 'tab',
      id: `tab-${tab.id ?? tab.url}`,
      title: tab.title,
      subtitle: getDomain(tab.url) || tab.url,
      tab,
    }));

  const pinnedResults: SearchResult[] = workspaces.flatMap((workspace) =>
    workspace.pinnedLinks
      .filter((link) => matches(normalized, link.title, link.url, workspace.name))
      .map((link) => ({
        type: 'pinned-link',
        id: `link-${link.id}`,
        title: link.title,
        subtitle: `${workspace.name} / ${getDomain(link.url) || link.url}`,
        workspace,
        url: link.url,
      })),
  );

  const snapshotResults: SearchResult[] = snapshots.flatMap((snapshot) =>
    snapshot.tabs
      .filter((entry) => matches(normalized, entry.title, entry.url, snapshot.title))
      .map((entry) => ({
        type: 'snapshot-entry',
        id: `snapshot-${snapshot.id}-${entry.id}`,
        title: entry.title,
        subtitle: `${snapshot.title} / ${getDomain(entry.url) || entry.url}`,
        snapshot,
        url: entry.url,
      })),
  );

  return [...tabResults, ...pinnedResults, ...snapshotResults].slice(0, 60);
}

function matches(query: string, ...values: string[]) {
  return values.some((value) => value.toLowerCase().includes(query));
}
