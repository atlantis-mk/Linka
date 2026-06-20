import { listCurrentWindows } from '@/src/lib/browserAdapter';
import { updateWorkspaceState } from '@/src/lib/workspaceStorage';
import type { SnapshotTabEntry } from '@/src/lib/workspaceTypes';

const AUTO_SESSION_SNAPSHOT_ID = 'auto-session-latest';
const AUTO_SESSION_WORKSPACE_ID = 'auto-session';
const AUTO_SESSION_SNAPSHOT_TITLE = '上次浏览';

export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  let broadcastTimer: ReturnType<typeof setTimeout> | undefined;
  let snapshotTimer: ReturnType<typeof setTimeout> | undefined;

  function broadcastTabsChanged() {
    if (broadcastTimer) {
      clearTimeout(broadcastTimer);
    }

    broadcastTimer = setTimeout(() => {
      void browser.runtime
        .sendMessage({
          type: 'linka:tabs-changed',
          changedAt: Date.now(),
        })
        .catch(() => {
          // No extension page is listening right now.
        });
    }, 150);

    scheduleAutoSessionSnapshot();
  }

  function scheduleAutoSessionSnapshot() {
    if (snapshotTimer) {
      clearTimeout(snapshotTimer);
    }

    snapshotTimer = setTimeout(() => {
      void saveAutoSessionSnapshot();
    }, 600);
  }

  async function saveAutoSessionSnapshot() {
    const windows = await listCurrentWindows();
    const entries = windows
      .flatMap((window) => window.tabs)
      .filter((tab) => tab.url && !isCurrentNewTab(tab.url))
      .map<SnapshotTabEntry>((tab, index) => ({
        id: `auto-tab-${tab.windowId ?? 'window'}-${tab.id ?? index}`,
        title: tab.title || tab.url,
        url: tab.url,
        ...(tab.favIconUrl ? { favIconUrl: tab.favIconUrl } : {}),
        ...(typeof tab.windowId === 'number' ? { windowId: tab.windowId } : {}),
        ...(typeof tab.groupId === 'number' ? { groupId: tab.groupId } : {}),
        ...(tab.groupTitle ? { groupTitle: tab.groupTitle } : {}),
        index,
      }));

    if (entries.length === 0) return;

    await updateWorkspaceState((state) => ({
      ...state,
      snapshots: [
        {
          id: AUTO_SESSION_SNAPSHOT_ID,
          workspaceId: AUTO_SESSION_WORKSPACE_ID,
          title: AUTO_SESSION_SNAPSHOT_TITLE,
          savedAt: new Date().toISOString(),
          tabs: entries,
        },
        ...state.snapshots.filter((snapshot) => snapshot.id !== AUTO_SESSION_SNAPSHOT_ID),
      ],
    }));

    void browser.runtime
      .sendMessage({
        type: 'linka:tabs-changed',
        changedAt: Date.now(),
      })
      .catch(() => {
        // No extension page is listening right now.
      });
  }

  function isCurrentNewTab(url: string) {
    if (url === 'chrome://newtab/' || url === 'chrome://new-tab-page/' || url === 'edge://newtab/') {
      return true;
    }

    try {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname.endsWith('/entrypoints/newtab/index.html');
    } catch {
      return false;
    }
  }

  browser.tabs.onCreated.addListener(broadcastTabsChanged);
  browser.tabs.onRemoved.addListener(broadcastTabsChanged);
  browser.tabs.onMoved.addListener(broadcastTabsChanged);
  browser.tabs.onAttached.addListener(broadcastTabsChanged);
  browser.tabs.onDetached.addListener(broadcastTabsChanged);
  browser.tabs.onActivated.addListener(broadcastTabsChanged);
  browser.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (
      changeInfo.url ||
      changeInfo.title ||
      changeInfo.favIconUrl ||
      changeInfo.status
    ) {
      broadcastTabsChanged();
    }
  });
  browser.windows.onCreated.addListener(broadcastTabsChanged);
  browser.windows.onRemoved.addListener(broadcastTabsChanged);
  browser.windows.onFocusChanged.addListener(broadcastTabsChanged);

  const tabGroups = (browser as typeof browser & {
    tabGroups?: {
      onCreated?: { addListener(listener: () => void): void };
      onRemoved?: { addListener(listener: () => void): void };
      onUpdated?: { addListener(listener: () => void): void };
      onMoved?: { addListener(listener: () => void): void };
    };
  }).tabGroups;

  tabGroups?.onCreated?.addListener(broadcastTabsChanged);
  tabGroups?.onRemoved?.addListener(broadcastTabsChanged);
  tabGroups?.onUpdated?.addListener(broadcastTabsChanged);
  tabGroups?.onMoved?.addListener(broadcastTabsChanged);

  scheduleAutoSessionSnapshot();
});
