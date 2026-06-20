import { browser } from 'wxt/browser';
import type {
  BookmarkFolderSummary,
  BookmarkSummary,
  SnapshotTabEntry,
  TabSummary,
  WindowSummary,
  WorkspaceSnapshot,
} from './workspaceTypes';
import { normalizeUrl } from './url';

export async function listCurrentWindows(): Promise<WindowSummary[]> {
  const windows = await browser.windows.getAll({ populate: true });
  const groupTitles = await listTabGroupTitles(
    windows.flatMap((window) => window.tabs ?? []),
  );

  return windows.map((window) => ({
    id: window.id,
    focused: window.focused,
    tabs: (window.tabs ?? [])
      .filter((tab) => Boolean(tab.url))
      .map((tab) => toTabSummary(tab, window.id, groupTitles)),
  }));
}

export async function listCurrentTabs(): Promise<TabSummary[]> {
  const windows = await listCurrentWindows();
  return windows.flatMap((window) => window.tabs);
}

export async function listBookmarkLinks(): Promise<BookmarkSummary[]> {
  const roots = await browser.bookmarks.getTree();
  const items: BookmarkSummary[] = [];

  function collectLinks(
    nodes: Browser.bookmarks.BookmarkTreeNode[],
    folderTitle?: string,
    rootTitle?: string,
  ): BookmarkSummary[] {
    const links: BookmarkSummary[] = [];

    for (const node of nodes) {
      if (node.url) {
        links.push({
          id: node.id,
          title: node.title || node.url,
          url: node.url,
          folderTitle,
          parentId: node.parentId,
          rootTitle,
          index: node.index ?? links.length,
        });
        continue;
      }

      links.push(...collectLinks(node.children ?? [], node.title || folderTitle, rootTitle));
    }

    return links;
  }

  function visit(
    nodes: Browser.bookmarks.BookmarkTreeNode[],
    parentTitle?: string,
    rootTitle?: string,
  ) {
    for (const node of nodes) {
      if (!node.url) continue;

      items.push({
        id: node.id,
        title: node.title || node.url,
        url: node.url,
        folderTitle: parentTitle,
        parentId: node.parentId,
        rootTitle,
        index: node.index ?? items.length,
      });
    }

    for (const node of nodes) {
      if (node.url) continue;

      const folderTitle = node.title || parentTitle;
      const children = collectLinks(node.children ?? [], folderTitle, rootTitle);
      if (children.length === 0) continue;

      const primary = children[0];
      items.push({
        id: node.id,
        title: primary.title,
        url: primary.url,
        folderTitle,
        parentId: node.parentId,
        rootTitle,
        children,
        isFolder: true,
        index: node.index ?? items.length,
      });
    }
  }

  for (const root of roots) {
    for (const container of root.children ?? []) {
      if (isBookmarksBar(container.title)) {
        visit(container.children ?? [], container.title, container.title);
        continue;
      }

      const children = collectLinks(container.children ?? [], container.title, container.title);
      if (children.length === 0) continue;

      const primary = children[0];
      items.push({
        id: container.id,
        title: primary.title,
        url: primary.url,
        folderTitle: container.title,
        parentId: container.parentId,
        rootTitle: container.title,
        children,
        isFolder: true,
        index: container.index ?? items.length,
      });
    }
  }

  return items;
}

export async function listBookmarkFolders(): Promise<BookmarkFolderSummary[]> {
  const roots = await browser.bookmarks.getTree();
  const folders: BookmarkFolderSummary[] = [];

  function visit(
    nodes: Browser.bookmarks.BookmarkTreeNode[],
    depth: number,
    rootTitle?: string,
  ) {
    for (const node of nodes) {
      if (node.url) continue;

      folders.push({
        id: node.id,
        title: node.title || rootTitle || '书签',
        parentId: node.parentId,
        depth,
        rootTitle,
      });

      visit(node.children ?? [], depth + 1, rootTitle ?? node.title);
    }
  }

  for (const root of roots) {
    visit(root.children ?? [], 0);
  }

  return folders;
}

function isBookmarksBar(title?: string) {
  return title === '书签栏' || title === '收藏夹栏' || title === 'Bookmarks Bar';
}

export async function switchToTab(tab: Pick<TabSummary, 'id' | 'windowId'>) {
  if (typeof tab.id !== 'number') return;

  await browser.tabs.update(tab.id, { active: true });
  if (typeof tab.windowId === 'number') {
    await browser.windows.update(tab.windowId, { focused: true });
  }
}

export async function moveBookmark(id: string, destination: { parentId?: string; index: number }) {
  await browser.bookmarks.move(id, destination);
}

export async function updateBookmark(
  id: string,
  changes: { title?: string; url?: string },
) {
  await browser.bookmarks.update(id, changes);
}

export async function deleteBookmark(id: string) {
  await browser.bookmarks.removeTree(id);
}

export async function createBookmarkFolder(title: string, parentId?: string) {
  await browser.bookmarks.create({
    title,
    ...(parentId ? { parentId } : {}),
  });
}

export async function bookmarkCurrentTab(parentId?: string) {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!activeTab?.url) return;

  await browser.bookmarks.create({
    title: activeTab.title || activeTab.url,
    url: activeTab.url,
    ...(parentId ? { parentId } : {}),
  });
}

export async function closeTab(tab: Pick<TabSummary, 'id'>) {
  if (typeof tab.id !== 'number') return;

  await browser.tabs.remove(tab.id);
}

export async function closeTabs(tabs: Array<Pick<TabSummary, 'id'>>) {
  const tabIds = tabs
    .map((tab) => tab.id)
    .filter((id): id is number => typeof id === 'number');

  if (tabIds.length === 0) return;

  await browser.tabs.remove(tabIds);
}

export async function openUrl(url: string) {
  await browser.tabs.create({ url });
}

export async function openUrlInNewWindow(url: string, incognito = false) {
  await browser.windows.create({ url, incognito });
}

export async function openUrlInCurrentTab(url: string) {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (typeof activeTab?.id === 'number') {
    await browser.tabs.update(activeTab.id, { url });
    return;
  }

  await openUrl(url);
}

export function findExistingTabForUrl(tabs: TabSummary[], url: string) {
  const normalized = normalizeUrl(url);
  return tabs.find((tab) => normalizeUrl(tab.url) === normalized);
}

export function findDuplicateSnapshotEntries(
  entries: SnapshotTabEntry[],
  tabs: TabSummary[],
) {
  return entries.map((entry) => ({
    entry,
    existingTab: findExistingTabForUrl(tabs, entry.url),
  }));
}

export async function restoreSnapshotEntries(
  entries: SnapshotTabEntry[],
  tabs: TabSummary[],
  mode: 'skip-duplicates' | 'open-all',
) {
  for (const entry of entries) {
    const duplicate = findExistingTabForUrl(tabs, entry.url);
    if (duplicate && mode === 'skip-duplicates') {
      continue;
    }
    await openUrl(entry.url);
  }
}

export async function restoreSnapshot(snapshot: WorkspaceSnapshot) {
  const createdTabs: { entry: SnapshotTabEntry; tabId: number }[] = [];

  for (const entry of snapshot.tabs) {
    const tab = await browser.tabs.create({ url: entry.url, active: false });
    if (typeof tab.id === 'number') {
      createdTabs.push({ entry, tabId: tab.id });
    }
  }

  await restoreSnapshotGroups(createdTabs);
}

async function restoreSnapshotGroups(
  createdTabs: { entry: SnapshotTabEntry; tabId: number }[],
) {
  const tabsByGroup = new Map<string, { title?: string; tabIds: number[] }>();

  for (const createdTab of createdTabs) {
    const groupKey = getSnapshotGroupKey(createdTab.entry);
    if (!groupKey) continue;

    const currentGroup = tabsByGroup.get(groupKey);
    tabsByGroup.set(groupKey, {
      title: currentGroup?.title ?? createdTab.entry.groupTitle,
      tabIds: [...(currentGroup?.tabIds ?? []), createdTab.tabId],
    });
  }

  if (tabsByGroup.size === 0) return;

  const tabsApi = browser.tabs as typeof browser.tabs & {
    group?: (options: { tabIds: number[] }) => Promise<number>;
  };
  const groupsApi = getTabGroupsApi();

  if (!tabsApi.group || !groupsApi) return;

  for (const group of tabsByGroup.values()) {
    if (group.tabIds.length === 0) continue;

    try {
      const groupId = await tabsApi.group({ tabIds: group.tabIds });
      if (group.title) {
        await groupsApi.update(groupId, { title: group.title });
      }
    } catch {
      // Grouping can fail if a tab closes during restore.
    }
  }
}

function getSnapshotGroupKey(entry: SnapshotTabEntry) {
  if (typeof entry.groupId === 'number' && entry.groupId >= 0) {
    return `group-${entry.groupId}`;
  }

  if (entry.groupTitle) {
    return `title-${entry.groupTitle}`;
  }

  return '';
}

async function listTabGroupTitles(tabs: Browser.tabs.Tab[]) {
  const groupIds = Array.from(
    new Set(
      tabs
        .map((tab) => getTabGroupId(tab))
        .filter((groupId): groupId is number => typeof groupId === 'number' && groupId >= 0),
    ),
  );
  const groupsApi = getTabGroupsApi();
  const titles = new Map<number, string>();

  if (!groupsApi || groupIds.length === 0) {
    return titles;
  }

  await Promise.all(
    groupIds.map(async (groupId) => {
      try {
        const group = await groupsApi.get(groupId);
        if (group.title) {
          titles.set(groupId, group.title);
        }
      } catch {
        // Tab group may have disappeared while refreshing.
      }
    }),
  );

  return titles;
}

function getTabGroupsApi() {
  return (browser as typeof browser & {
    tabGroups?: {
      get(groupId: number): Promise<{ title?: string }>;
      update(groupId: number, updateProperties: { title?: string }): Promise<unknown>;
    };
  }).tabGroups;
}

function getTabGroupId(tab: Browser.tabs.Tab) {
  return (tab as Browser.tabs.Tab & { groupId?: number }).groupId;
}

function toTabSummary(
  tab: Browser.tabs.Tab,
  fallbackWindowId?: number,
  groupTitles?: Map<number, string>,
): TabSummary {
  const groupId = getTabGroupId(tab);

  return {
    id: tab.id,
    windowId: tab.windowId ?? fallbackWindowId,
    title: tab.title || tab.url || 'Untitled tab',
    url: tab.url || '',
    favIconUrl: tab.favIconUrl,
    active: tab.active,
    groupId,
    groupTitle: typeof groupId === 'number' ? groupTitles?.get(groupId) : undefined,
    index: tab.index ?? 0,
  };
}
