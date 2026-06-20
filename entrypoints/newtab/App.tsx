import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useForm } from '@tanstack/react-form';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AppWindowIcon,
  ArrowUpDownIcon,
  BookmarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  FanIcon,
  FolderIcon,
  Grid2X2Icon,
  GripVerticalIcon,
  HistoryIcon,
  LanguagesIcon,
  LinkIcon,
  ListIcon,
  RotateCcwIcon,
  SaveIcon,
  SearchIcon,
  SettingsIcon,
  SmartphoneIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import {
  bookmarkCurrentTab,
  closeTab,
  closeTabs,
  createBookmarkFolder,
  deleteBookmark,
  listBookmarkFolders,
  listBookmarkLinks,
  listCurrentWindows,
  moveBookmark,
  openUrl,
  openUrlInNewWindow,
  openUrlInCurrentTab,
  restoreSnapshot,
  switchToTab,
  updateBookmark,
} from '@/src/lib/browserAdapter';
import type {
  BookmarkFolderSummary,
  BookmarkSummary,
  SnapshotTabEntry,
  TabSummary,
  WindowSummary,
  WorkspaceSnapshot,
} from '@/src/lib/workspaceTypes';
import { readWorkspaceState, updateWorkspaceState } from '@/src/lib/workspaceStorage';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/src/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/src/components/ui/empty';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/src/components/ui/hover-card';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/src/components/ui/field';
import { Separator } from '@/src/components/ui/separator';
import { Slider } from '@/src/components/ui/slider';
import { Switch } from '@/src/components/ui/switch';
import { getDomain, normalizeUrl } from '@/src/lib/url';
import { cn } from '@/src/lib/utils';

interface BrowsingCardItem {
  id: string;
  tabs: TabSummary[];
  groupTitle?: string;
}

interface SearchEngineConfig {
  id: string;
  label: string;
  logo: string;
  searchUrl: string;
  enabled: boolean;
}

const DEFAULT_SEARCH_ENGINES: SearchEngineConfig[] = [
  {
    id: 'baidu',
    label: '百度',
    logo: '/logo/baidu.svg',
    searchUrl: 'https://www.baidu.com/s?wd=',
    enabled: true,
  },
  {
    id: 'google',
    label: '谷歌',
    logo: '/logo/google.svg',
    searchUrl: 'https://www.google.com/search?q=',
    enabled: true,
  },
  {
    id: 'bing',
    label: '必应',
    logo: '/logo/bing.svg',
    searchUrl: 'https://cn.bing.com/search?q=',
    enabled: true,
  },
] as const satisfies SearchEngineConfig[];

type SearchEngineId = string;
type CardViewMode = 'card' | 'icon';
type WallpaperKind = 'static' | 'dynamic' | 'solid';
type Locale = 'zh-CN' | 'en-US';

const DEFAULT_PAGE_TITLE = 'Linka 标签页';
const DEFAULT_LOCALE: Locale = 'zh-CN';
const DEFAULT_TOP_HEIGHT = 30;
const NEWTAB_SETTINGS_STORAGE_KEY = 'linka:newtab-settings';
const WALLPAPER_BLUR_MAX_PX = 10;
const CARD_VIEW_LIMITS = {
  bookmarks: 15,
  browsingTabs: 21,
  snapshots: 12,
};

const MESSAGES = {
  'zh-CN': {
    add: '新 增',
    addFolder: '添加文件夹...',
    all: '全选',
    appMenu: '应用菜单',
    autoGroup: '自动分组',
    bookmarks: '书签一览',
    bookmarkFolder: '收藏夹',
    bookmarksBar: '收藏夹栏',
    browsing: '正在浏览',
    cancel: '取 消',
    cardView: '切换为卡片视图',
    clearPageTitle: '清空页面标题',
    clearSearch: '清除搜索',
    close: '关闭',
    closeAll: '关闭全部',
    closeAllTabs: '关闭全部标签',
    closeGroup: '关闭分组',
    collapseFolder: '收起文件夹 {name}',
    collapseGroup: '收起分组 {name}',
    collapseSnapshot: '收起快照 {name}',
    confirm: '确 认',
    createSnapshot: '生成快照',
    current: '当前',
    custom: '自定义',
    customSearchEngine: '自定义搜索引擎',
    customSearchEngineHelp: '例子：“https://www.baidu.com/s?wd=”，等号后面为您每次搜索的内容！',
    delete: '删除',
    deleteConfirm: '删除“{name}”？',
    deleteSnapshot: '删除快照',
    donate: '打赏支持',
    donateLater: '下次再说',
    donatePublic: '赞赏支出公示',
    donateTitle: '打赏支持 Linka 标签页',
    donateText: '如果 Linka 对您有价值，不妨支持一下我吧，我将专注于持续优化产品体验。',
    dragSort: '拖动排序',
    edit: '编辑...',
    editBookmark: '编辑收藏夹',
    emptyBookmarks: '暂无书签数据',
    emptyFolders: '暂无收藏夹',
    emptySnapshot: '空快照',
    emptySnapshots: '暂无历史快照',
    emptyTabs: '暂无打开的标签页',
    enableSearchEngine: '启用 {name}',
    folder: '文件夹',
    folderName: '文件夹名称',
    historySnapshots: '历史快照',
    iconOnly: '仅显示图标',
    iconView: '切换为图标视图',
    inPrivateBlocked: '需要允许扩展在 InPrivate/无痕模式中运行后才能打开。',
    inPrivateOpen: '在 InPrivate 窗口中打开',
    language: '语言',
    loading: '正在加载...',
    manageBookmarks: '管理收藏夹',
    name: '名称',
    newFolder: '新建文件夹',
    noPaymentQr: '暂无收款码图片',
    noWallpaper: '暂无壁纸',
    open: '打开',
    openAll: '打开全部',
    openInNewTab: '在新标签页中打开',
    openInNewWindow: '在新窗口中打开',
    openSnapshot: '打开快照',
    otherBookmarks: '其他收藏夹',
    pageJump: '页面跳转',
    pageTitle: '页面标题',
    previewWallpaper: '预览壁纸：',
    randomBackground: '随机背景',
    refreshWallpaper: '刷新壁纸',
    reset: '重 置',
    resetPageTitle: '重置页面标题',
    resetTopHeight: '重置顶部高度',
    restoreSnapshot: '恢复快照',
    save: '保 存',
    saveToFolder: '将保存到 {name}',
    searchEngine: '搜索引擎',
    searchEngineName: '搜索引擎名称',
    searchEngineUrl: '搜索引擎地址',
    searchOrUrl: '搜索或输入网址',
    searchPlaceholder: '搜索书签、标签页或网页',
    searchSubmit: '提交搜索',
    selectTab: '选择 {name}',
    settings: '设置',
    showClockLogo: '时钟/LOGO',
    showSearchBox: '搜索框',
    showTopMenu: '顶部菜单',
    showUrl: '显示网址',
    simpleMode: '简约模式',
    snapshotName: '快照名称',
    snapshotTitle: '浏览快照 {time}',
    sortBookmarks: '排序书签',
    syncAfterRefresh: '刷新后会自动同步浏览器数据。',
    theme: '壁纸主题',
    themeSettings: '壁纸主题设置',
    topHeight: '顶部高度',
    unnamed: '未命名',
    unnamedFolder: '未命名文件夹',
    unnamedGroup: '未命名分组',
    unnamedSnapshot: '未命名快照',
    unnamedTab: '未命名标签',
    unknownTime: '未知时间',
    upload: '上传',
    uploadIcon: '上传图标',
    uploadWallpaper: '上传壁纸',
    wallpaperAddress: '壁纸地址：',
    wallpaperBlur: '壁纸模糊：',
    wallpaperBrightness: '壁纸亮度：',
    wallpaperLocked: '壁纸已固定',
    wallpaperLockedHelp: '开启后随机刷新不会替换当前壁纸地址。',
    wallpaperLockedTitle: '壁纸已固定，关闭固定壁纸后可刷新',
    wallpaperLock: '固定壁纸：',
    wechat: '微信',
    alipay: '支付宝',
  },
  'en-US': {
    add: 'Add',
    addFolder: 'Add folder...',
    all: 'Select all',
    appMenu: 'App menu',
    autoGroup: 'Auto group',
    bookmarks: 'Bookmarks',
    bookmarkFolder: 'Bookmarks',
    bookmarksBar: 'Bookmarks Bar',
    browsing: 'Browsing',
    cancel: 'Cancel',
    cardView: 'Switch to card view',
    clearPageTitle: 'Clear page title',
    clearSearch: 'Clear search',
    close: 'Close',
    closeAll: 'Close all',
    closeAllTabs: 'Close all tabs',
    closeGroup: 'Close group',
    collapseFolder: 'Collapse folder {name}',
    collapseGroup: 'Collapse group {name}',
    collapseSnapshot: 'Collapse snapshot {name}',
    confirm: 'Confirm',
    createSnapshot: 'Create snapshot',
    current: 'Current',
    custom: 'Custom',
    customSearchEngine: 'Custom search engines',
    customSearchEngineHelp: 'Example: "https://www.baidu.com/s?wd=". Each query is appended after the equals sign.',
    delete: 'Delete',
    deleteConfirm: 'Delete "{name}"?',
    deleteSnapshot: 'Delete snapshot',
    donate: 'Support',
    donateLater: 'Maybe later',
    donatePublic: 'Donation ledger',
    donateTitle: 'Support Linka New Tab',
    donateText: 'If Linka is useful to you, consider supporting ongoing product improvements.',
    dragSort: 'Drag to sort',
    edit: 'Edit...',
    editBookmark: 'Edit bookmark',
    emptyBookmarks: 'No bookmarks yet',
    emptyFolders: 'No bookmark folders',
    emptySnapshot: 'Empty snapshot',
    emptySnapshots: 'No snapshots yet',
    emptyTabs: 'No open tabs',
    enableSearchEngine: 'Enable {name}',
    folder: 'Folder',
    folderName: 'Folder name',
    historySnapshots: 'Snapshots',
    iconOnly: 'Icon only',
    iconView: 'Switch to icon view',
    inPrivateBlocked: 'Allow this extension in InPrivate/incognito mode before opening.',
    inPrivateOpen: 'Open in InPrivate window',
    language: 'Language',
    loading: 'Loading...',
    manageBookmarks: 'Manage bookmarks',
    name: 'Name',
    newFolder: 'New folder',
    noPaymentQr: 'No payment QR image',
    noWallpaper: 'No wallpaper',
    open: 'Open',
    openAll: 'Open all',
    openInNewTab: 'Open in new tab',
    openInNewWindow: 'Open in new window',
    openSnapshot: 'Open snapshot',
    otherBookmarks: 'Other Bookmarks',
    pageJump: 'In-page navigation',
    pageTitle: 'Page title',
    previewWallpaper: 'Wallpaper preview:',
    randomBackground: 'Random background',
    refreshWallpaper: 'Refresh wallpaper',
    reset: 'Reset',
    resetPageTitle: 'Reset page title',
    resetTopHeight: 'Reset top height',
    restoreSnapshot: 'Restore snapshot',
    save: 'Save',
    saveToFolder: 'Save to {name}',
    searchEngine: 'Search engine',
    searchEngineName: 'Search engine name',
    searchEngineUrl: 'Search engine URL',
    searchOrUrl: 'Search or enter URL',
    searchPlaceholder: 'Search bookmarks, tabs, or the web',
    searchSubmit: 'Submit search',
    selectTab: 'Select {name}',
    settings: 'Settings',
    showClockLogo: 'Clock/Logo',
    showSearchBox: 'Search box',
    showTopMenu: 'Top menu',
    showUrl: 'Show URLs',
    simpleMode: 'Simple mode',
    snapshotName: 'Snapshot name',
    snapshotTitle: 'Snapshot {time}',
    sortBookmarks: 'Sort bookmarks',
    syncAfterRefresh: 'Browser data will sync automatically after refresh.',
    theme: 'Wallpaper',
    themeSettings: 'Wallpaper settings',
    topHeight: 'Top height',
    unnamed: 'Untitled',
    unnamedFolder: 'Untitled folder',
    unnamedGroup: 'Untitled group',
    unnamedSnapshot: 'Untitled snapshot',
    unnamedTab: 'Untitled tab',
    unknownTime: 'Unknown time',
    upload: 'Upload',
    uploadIcon: 'Upload icon',
    uploadWallpaper: 'Upload wallpaper',
    wallpaperAddress: 'Wallpaper URL:',
    wallpaperBlur: 'Wallpaper blur:',
    wallpaperBrightness: 'Wallpaper brightness:',
    wallpaperLocked: 'Wallpaper pinned',
    wallpaperLockedHelp: 'When enabled, random refresh will not replace the current wallpaper URL.',
    wallpaperLockedTitle: 'Wallpaper pinned. Turn off pinning to refresh it.',
    wallpaperLock: 'Pin wallpaper:',
    wechat: 'WeChat',
    alipay: 'Alipay',
  },
} as const;

type MessageKey = keyof (typeof MESSAGES)[Locale];
type Translate = (key: MessageKey, values?: Record<string, string | number>) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function createTranslator(locale: Locale): Translate {
  return (key, values) => {
    const message: string = MESSAGES[locale][key] ?? MESSAGES[DEFAULT_LOCALE][key];
    if (!values) return message;

    return Object.entries(values).reduce(
      (current, [name, value]) => current.replaceAll(`{${name}}`, String(value)),
      message,
    );
  };
}

function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used inside I18nContext.Provider');
  }

  return context;
}

interface NewtabSettings {
  locale: Locale;
  searchEngineId: SearchEngineId;
  searchEngines: SearchEngineConfig[];
  pageTitle: string;
  topHeight: number;
  simpleMode: boolean;
  inPageNavigation: boolean;
  showClockLogo: boolean;
  showSearchBox: boolean;
  pinTopMenu: boolean;
  randomBackground: boolean;
  wallpaperUrl: string;
  wallpaperKind: WallpaperKind;
  wallpaperBrightness: number;
  wallpaperBlur: number;
  wallpaperLocked: boolean;
  showUrls: boolean;
  autoGroupBrowsing: boolean;
  showBookmarksColumn: boolean;
  showBrowsingColumn: boolean;
  showSnapshotsColumn: boolean;
  bookmarksViewMode: CardViewMode;
  browsingViewMode: CardViewMode;
  snapshotsViewMode: CardViewMode;
}

type StoredNewtabSettings = Partial<NewtabSettings> & {
  cardViewMode?: CardViewMode;
};

const DEFAULT_NEWTAB_SETTINGS: NewtabSettings = {
  locale: DEFAULT_LOCALE,
  searchEngineId: 'baidu',
  searchEngines: DEFAULT_SEARCH_ENGINES.map((engine) => ({ ...engine })),
  pageTitle: DEFAULT_PAGE_TITLE,
  topHeight: DEFAULT_TOP_HEIGHT,
  simpleMode: false,
  inPageNavigation: true,
  showClockLogo: true,
  showSearchBox: true,
  pinTopMenu: true,
  randomBackground: true,
  wallpaperUrl: '',
  wallpaperKind: 'static',
  wallpaperBrightness: 80,
  wallpaperBlur: 0,
  wallpaperLocked: false,
  showUrls: true,
  autoGroupBrowsing: true,
  showBookmarksColumn: true,
  showBrowsingColumn: true,
  showSnapshotsColumn: true,
  bookmarksViewMode: 'card',
  browsingViewMode: 'card',
  snapshotsViewMode: 'card',
};

function App() {
  const [bookmarks, setBookmarks] = useState<BookmarkSummary[]>([]);
  const [bookmarkFolders, setBookmarkFolders] = useState<BookmarkFolderSummary[]>([]);
  const [windows, setWindows] = useState<WindowSummary[]>([]);
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [settings, setSettings] = useState<NewtabSettings>(() => readStoredNewtabSettings());
  const [searchEngineSettingsOpen, setSearchEngineSettingsOpen] = useState(false);
  const [wallpaperRefreshing, setWallpaperRefreshing] = useState(false);
  const {
    locale,
    searchEngineId,
    searchEngines,
    pageTitle,
    topHeight,
    simpleMode,
    inPageNavigation,
    showClockLogo,
    showSearchBox,
    pinTopMenu,
    randomBackground,
    wallpaperUrl,
    wallpaperKind,
    wallpaperBrightness,
    wallpaperBlur,
    wallpaperLocked,
    showUrls,
    autoGroupBrowsing,
    showBookmarksColumn,
    showBrowsingColumn,
    showSnapshotsColumn,
    bookmarksViewMode,
    browsingViewMode,
    snapshotsViewMode,
  } = settings;
  const t = useMemo(() => createTranslator(locale), [locale]);
  const i18nValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: (value) => setSettings((current) => ({ ...current, locale: value })),
      t,
    }),
    [locale, t],
  );
  const setSearchEngineId = (value: SearchEngineId) =>
    setSettings((current) => ({ ...current, searchEngineId: value }));
  const setSearchEngines = (value: SearchEngineConfig[]) =>
    setSettings((current) => {
      const engines = normalizeSearchEngines(value);
      const enabledEngines = engines.filter((engine) => engine.enabled);
      const hasCurrentEngine = enabledEngines.some((engine) => engine.id === current.searchEngineId);

      return {
        ...current,
        searchEngines: engines,
        searchEngineId: hasCurrentEngine
          ? current.searchEngineId
          : enabledEngines[0]?.id ?? DEFAULT_NEWTAB_SETTINGS.searchEngineId,
      };
    });
  const setPageTitle = (value: string) =>
    setSettings((current) => ({ ...current, pageTitle: value }));
  const setTopHeight = (value: number) =>
    setSettings((current) => ({ ...current, topHeight: value }));
  const setSimpleMode = (value: boolean) =>
    setSettings((current) => ({ ...current, simpleMode: value }));
  const setInPageNavigation = (value: boolean) =>
    setSettings((current) => ({ ...current, inPageNavigation: value }));
  const setShowClockLogo = (value: boolean) =>
    setSettings((current) => ({ ...current, showClockLogo: value }));
  const setShowSearchBox = (value: boolean) =>
    setSettings((current) => ({ ...current, showSearchBox: value }));
  const setPinTopMenu = (value: boolean) =>
    setSettings((current) => ({ ...current, pinTopMenu: value }));
  const setRandomBackground = (value: boolean) =>
    setSettings((current) => ({ ...current, randomBackground: value }));
  const setWallpaperSettings = (value: WallpaperSettingsValue) =>
    setSettings((current) => ({
      ...current,
      randomBackground: true,
      wallpaperUrl: value.url,
      wallpaperKind: value.kind,
      wallpaperBrightness: value.brightness,
      wallpaperBlur: value.blur,
      wallpaperLocked: value.locked,
    }));
  const setShowUrls = (value: boolean) =>
    setSettings((current) => ({ ...current, showUrls: value }));
  const setAutoGroupBrowsing = (value: boolean) =>
    setSettings((current) => ({ ...current, autoGroupBrowsing: value }));
  const setShowBookmarksColumn = (value: boolean) =>
    setSettings((current) => ({ ...current, showBookmarksColumn: value }));
  const setShowBrowsingColumn = (value: boolean) =>
    setSettings((current) => ({ ...current, showBrowsingColumn: value }));
  const setShowSnapshotsColumn = (value: boolean) =>
    setSettings((current) => ({ ...current, showSnapshotsColumn: value }));
  const setBookmarksViewMode = (value: CardViewMode) =>
    setSettings((current) => ({ ...current, bookmarksViewMode: value }));
  const setBrowsingViewMode = (value: CardViewMode) =>
    setSettings((current) => ({ ...current, browsingViewMode: value }));
  const setSnapshotsViewMode = (value: CardViewMode) =>
    setSettings((current) => ({ ...current, snapshotsViewMode: value }));

  const tabs = useMemo(
    () => windows.flatMap((window) => window.tabs).filter((tab) => !isCurrentNewTab(tab.url)),
    [windows],
  );
  const hydratedBookmarks = useMemo(
    () => hydrateBookmarkFavicons(bookmarks, tabs),
    [bookmarks, tabs],
  );
  const visibleWorkspaceColumnCount = [
    showBookmarksColumn,
    showBrowsingColumn,
    showSnapshotsColumn,
  ].filter(Boolean).length;
  const bookmarkItemLimit = getCardViewItemLimit(
    bookmarksViewMode,
    CARD_VIEW_LIMITS.bookmarks,
    visibleWorkspaceColumnCount,
  );
  const browsingItemLimit = getCardViewItemLimit(
    browsingViewMode,
    CARD_VIEW_LIMITS.browsingTabs,
    visibleWorkspaceColumnCount,
  );
  const snapshotItemLimit = getCardViewItemLimit(
    snapshotsViewMode,
    CARD_VIEW_LIMITS.snapshots,
    visibleWorkspaceColumnCount,
  );
  const bookmarkItems = useMemo(
    () => hydratedBookmarks.slice(0, bookmarkItemLimit),
    [bookmarkItemLimit, hydratedBookmarks],
  );
  const browsingItems = useMemo(
    () => buildBrowsingCards(tabs.slice(0, browsingItemLimit), autoGroupBrowsing),
    [autoGroupBrowsing, browsingItemLimit, tabs],
  );
  const snapshotItems = useMemo(
    () => snapshots
      .slice()
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .slice(0, snapshotItemLimit),
    [snapshotItemLimit, snapshots],
  );
  const enabledSearchEngines = useMemo(
    () => searchEngines.filter((engine) => engine.enabled),
    [searchEngines],
  );
  const searchEngine =
    enabledSearchEngines.find((engine) => engine.id === searchEngineId) ??
    enabledSearchEngines[0] ??
    DEFAULT_SEARCH_ENGINES[0];
  const collapseTopContent = !showClockLogo && !showSearchBox;
  const backgroundStyle = randomBackground
    ? ({
        '--linka-wallpaper-image': `url("${wallpaperUrl}")`,
        '--linka-wallpaper-brightness': `${wallpaperBrightness}%`,
        '--linka-wallpaper-blur': `${getWallpaperBlurPx(wallpaperBlur)}px`,
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    void refreshHome();
  }, []);

  useEffect(() => {
    document.title = pageTitle.trim() || DEFAULT_PAGE_TITLE;
  }, [pageTitle]);

  useEffect(() => {
    writeStoredNewtabSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!browser.runtime?.onMessage) return;

    let refreshTimer: number | undefined;

    function handleTabsChanged(message: unknown) {
      if (!isTabsChangedMessage(message)) return;

      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        void refreshHome({ showLoading: false });
      }, 120);
    }

    browser.runtime.onMessage.addListener(handleTabsChanged);

    return () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }
      browser.runtime.onMessage.removeListener(handleTabsChanged);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function refreshHome(options: { showLoading?: boolean } = {}) {
    const showLoading = options.showLoading ?? true;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const [bookmarkLinks, folders, currentWindows, workspaceState] = await Promise.all([
        listBookmarkLinks(),
        listBookmarkFolders(),
        listCurrentWindows(),
        readWorkspaceState(),
      ]);
      setBookmarks(bookmarkLinks);
      setBookmarkFolders(folders);
      setWindows(currentWindows);
      setSnapshots(workspaceState.snapshots);
    } catch {
      setBookmarks([]);
      setBookmarkFolders([]);
      setWindows([]);
      setSnapshots([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function refreshWallpaper() {
    if (wallpaperRefreshing) return;

    setWallpaperRefreshing(true);

    try {
      if (wallpaperLocked) {
        await refreshHome({ showLoading: false });
        return;
      }

      const nextWallpaperUrl = createRandomBackgroundUrl();
      await preloadImage(nextWallpaperUrl);
      setSettings((current) => ({
        ...current,
        randomBackground: true,
        wallpaperUrl: nextWallpaperUrl,
        wallpaperKind: 'static',
      }));
      await refreshHome({ showLoading: false });
    } finally {
      setWallpaperRefreshing(false);
    }
  }

  async function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSearch();
  }

  async function runSearch() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const directMatch = [...bookmarks, ...tabs].find(
      (item) =>
        item.title.toLowerCase() === trimmedQuery.toLowerCase() ||
        item.url.toLowerCase() === trimmedQuery.toLowerCase(),
    );
    if (directMatch) {
      if (isTabSummary(directMatch)) {
        await switchToTab(directMatch);
      } else {
        await navigateToUrl(directMatch.url);
      }
      setQuery('');
      await refreshHome({ showLoading: false });
      return;
    }

    await navigateToUrl(buildSearchUrl(searchEngine, trimmedQuery));
    setQuery('');
    await refreshHome({ showLoading: false });
  }

  async function navigateToUrl(url: string) {
    if (inPageNavigation) {
      await openUrlInCurrentTab(url);
      return;
    }

    await openUrl(url);
  }

  async function createSnapshotFromTabs(title: string, selectedTabs: TabSummary[]) {
    const nowIso = new Date().toISOString();
    const trimmedTitle = title.trim() || t('snapshotTitle', { time: formatSnapshotSavedAt(nowIso, locale) });
    const snapshot: WorkspaceSnapshot = {
      id: `snapshot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      workspaceId: 'manual',
      title: trimmedTitle,
      savedAt: nowIso,
      tabs: selectedTabs.map((tab, index) => ({
        id: `snapshot-tab-${tab.windowId ?? 'window'}-${tab.id ?? index}`,
        title: tab.title || tab.url,
        url: tab.url,
        ...(tab.favIconUrl ? { favIconUrl: tab.favIconUrl } : {}),
        ...(typeof tab.windowId === 'number' ? { windowId: tab.windowId } : {}),
        ...(typeof tab.groupId === 'number' ? { groupId: tab.groupId } : {}),
        ...(tab.groupTitle ? { groupTitle: tab.groupTitle } : {}),
        index,
      })),
    };

    const nextState = await updateWorkspaceState((state) => ({
      ...state,
      snapshots: [snapshot, ...state.snapshots],
    }));
    setSnapshots(nextState.snapshots);
  }

  async function closeAllBrowsingTabs() {
    await closeTabs(tabs);
    await refreshHome({ showLoading: false });
  }

  async function deleteSnapshot(snapshotId: string) {
    const nextState = await updateWorkspaceState((state) => ({
      ...state,
      snapshots: state.snapshots.filter((snapshot) => snapshot.id !== snapshotId),
    }));
    setSnapshots(nextState.snapshots);
  }

  async function deleteSnapshotEntry(snapshotId: string, entryId: string) {
    const nextState = await updateWorkspaceState((state) => ({
      ...state,
      snapshots: state.snapshots.flatMap((snapshot) => {
        if (snapshot.id !== snapshotId) return [snapshot];

        const tabs = snapshot.tabs.filter((entry) => entry.id !== entryId);
        return tabs.length > 0 ? [{ ...snapshot, tabs }] : [];
      }),
    }));
    setSnapshots(nextState.snapshots);
  }

  async function sortBookmarks(source: BookmarkSummary, target: BookmarkSummary) {
    if (!source.parentId || source.parentId !== target.parentId) return;

    await moveBookmark(source.id, {
      parentId: target.parentId,
      index: target.index,
    });
    await refreshHome({ showLoading: false });
  }

  async function editBookmark(item: BookmarkSummary, values: { title: string; url?: string; parentId?: string }) {
    const { parentId, ...changes } = values;

    await updateBookmark(item.id, changes);
    if (parentId && parentId !== item.parentId) {
      await moveBookmark(item.id, { parentId, index: 0 });
    }
    await refreshHome({ showLoading: false });
  }

  async function removeBookmark(item: BookmarkSummary) {
    await deleteBookmark(item.id);
    await refreshHome({ showLoading: false });
  }

  async function addCurrentPageBookmark(parentId?: string) {
    await bookmarkCurrentTab(parentId);
    await refreshHome({ showLoading: false });
  }

  async function addBookmarkFolder(parentId?: string) {
    const title = window.prompt(t('folderName'), t('newFolder'))?.trim();
    if (!title) return;

    await createBookmarkFolder(title, parentId);
    await refreshHome({ showLoading: false });
  }

  const clock = now.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const date = now.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <I18nContext.Provider value={i18nValue}>
    <main
      className="newtab-shell h-screen overflow-x-auto text-primary-foreground"
      data-random-background={randomBackground ? 'true' : 'false'}
      style={backgroundStyle}
    >
      <div className="newtab-content relative h-screen overflow-y-auto px-6 py-6 sm:px-8 lg:px-10">
        <header
          className={cn(
            'newtab-topbar sticky top-0 z-20 -mx-6 flex items-center justify-end gap-4 px-6 py-3 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10',
            !pinTopMenu && 'opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100',
          )}
          style={{ minHeight: topHeight }}
        >
          <nav aria-label="Linka navigation" className="flex flex-wrap items-center justify-end gap-1">
            <LanguageSwitcher />
            <WallpaperSettingsDialog
              onConfirm={setWallpaperSettings}
              value={{
                url: wallpaperUrl,
                kind: wallpaperKind,
                brightness: wallpaperBrightness,
                blur: wallpaperBlur,
                locked: wallpaperLocked,
              }}
            />
            <SponsorDialog />
            <AppMenuHoverCard
              inPageNavigation={inPageNavigation}
              pageTitle={pageTitle}
              pinTopMenu={pinTopMenu}
              autoGroupBrowsing={autoGroupBrowsing}
              setAutoGroupBrowsing={setAutoGroupBrowsing}
              setInPageNavigation={setInPageNavigation}
              setPageTitle={setPageTitle}
              setPinTopMenu={setPinTopMenu}
              setRandomBackground={setRandomBackground}
              setShowClockLogo={setShowClockLogo}
              setShowBookmarksColumn={setShowBookmarksColumn}
              setShowBrowsingColumn={setShowBrowsingColumn}
              setShowSearchBox={setShowSearchBox}
              setShowSnapshotsColumn={setShowSnapshotsColumn}
              setShowUrls={setShowUrls}
              setSimpleMode={setSimpleMode}
              setTopHeight={setTopHeight}
              showBookmarksColumn={showBookmarksColumn}
              showBrowsingColumn={showBrowsingColumn}
              showClockLogo={showClockLogo}
              randomBackground={randomBackground}
              showSearchBox={showSearchBox}
              showSnapshotsColumn={showSnapshotsColumn}
              showUrls={showUrls}
              simpleMode={simpleMode}
              topHeight={topHeight}
            />
          </nav>
        </header>

        <section
          aria-label="Time and search"
          className={cn(
            'relative mx-auto flex max-w-3xl flex-col items-center justify-center text-center transition-[gap,min-height,padding,transform] duration-500 ease-out motion-reduce:transition-none',
            simpleMode
              ? 'min-h-[calc(100vh-9rem)] gap-8 pt-0'
              : collapseTopContent
                ? 'min-h-0 gap-0 pt-0'
                : showClockLogo
                ? showSearchBox
                  ? 'min-h-72 gap-8 pt-12'
                  : 'min-h-56 gap-5 pt-6'
                : 'min-h-24 gap-0 pt-6',
          )}
        >
          {showClockLogo && (
            <div
              className={cn(
                'flex flex-col items-center gap-4 select-none transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
                simpleMode ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100',
              )}
            >
              <time className="text-7xl leading-none font-bold sm:text-8xl" dateTime={now.toISOString()}>
                {clock}
              </time>
              <time className="text-xl font-semibold sm:text-2xl" dateTime={now.toISOString()}>
                {date}
              </time>
            </div>
          )}

          {showSearchBox && (
            <form
              className="relative flex h-13 w-full max-w-2xl items-center rounded-full bg-background px-3 pl-4 text-foreground shadow-lg ring-1 ring-border transition-[opacity,transform,box-shadow] duration-500 ease-out motion-reduce:transition-none"
              onSubmit={(event) => void submitSearch(event)}
            >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label={t('searchEngine')}
                  className="rounded-full"
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <img alt="" className="size-4 object-contain" src={searchEngine.logo} />
                  <ChevronDownIcon data-icon="inline-end" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                <DropdownMenuLabel>{t('searchEngine')}</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {enabledSearchEngines.map((engine) => (
                    <DropdownMenuItem
                      key={engine.id}
                      onSelect={() => setSearchEngineId(engine.id)}
                    >
                      <img alt="" className="size-4 object-contain" src={engine.logo} />
                      <span>{engine.label}</span>
                      {engine.id === searchEngineId && (
                        <Badge className="ml-auto" variant="secondary">
                          {t('current')}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => setSearchEngineSettingsOpen(true)}>
                    <SettingsIcon />
                    <span>{t('settings')}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <SearchEngineSettingsDialog
              engines={searchEngines}
              onOpenChange={setSearchEngineSettingsOpen}
              onSave={setSearchEngines}
              open={searchEngineSettingsOpen}
            />

            <SearchIcon className="ml-2 text-muted-foreground" />
            <Input
              aria-label={t('searchOrUrl')}
              autoComplete="off"
              className="h-full border-0 bg-transparent text-base font-medium shadow-none ring-0 focus-visible:ring-0 md:text-base"
              id="search-input"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              type="text"
              value={query}
            />
            {query && (
              <Button
                aria-label={t('clearSearch')}
                className="rounded-full"
                onClick={() => setQuery('')}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon />
              </Button>
            )}
            <Button
              aria-label={t('searchSubmit')}
              className="rounded-full"
              disabled={!query.trim()}
              onClick={() => void runSearch()}
              size="icon-sm"
              type="button"
            >
              <SearchIcon />
            </Button>
            </form>
          )}
        </section>

        <section
          aria-label="Workspace links"
          className={cn(
            'relative mx-auto grid w-full max-w-[112rem] grid-cols-1 gap-8 transition-[max-height,opacity,transform,margin] duration-500 ease-out motion-reduce:transition-none',
            visibleWorkspaceColumnCount <= 1 && 'xl:grid-cols-1',
            visibleWorkspaceColumnCount === 2 && 'xl:grid-cols-2',
            visibleWorkspaceColumnCount >= 3 && 'xl:grid-cols-3',
            simpleMode
              ? 'mt-0 max-h-0 translate-y-8 opacity-0 pointer-events-none'
              : cn(
                'max-h-[44rem] translate-y-0 opacity-100',
                collapseTopContent ? 'mt-0' : showClockLogo ? 'mt-8' : 'mt-4',
              ),
          )}
          aria-hidden={simpleMode}
        >
            {showBookmarksColumn && (
              <BookmarkSection
                cardViewMode={bookmarksViewMode}
                folders={bookmarkFolders}
                items={bookmarkItems}
                loading={loading}
                onAddCurrentPage={addCurrentPageBookmark}
                onAddFolder={addBookmarkFolder}
                onDeleteBookmark={removeBookmark}
                onEditBookmark={editBookmark}
                onOpen={(url) => navigateToUrl(url)}
                onSort={sortBookmarks}
                setCardViewMode={setBookmarksViewMode}
                showUrls={showUrls}
                title={t('bookmarks')}
              />
            )}
            {showBrowsingColumn && (
              <BrowsingSection
                actualTabs={tabs}
                cardViewMode={browsingViewMode}
                canCreateSnapshot={showSnapshotsColumn}
                onCloseAllTabs={closeAllBrowsingTabs}
                onCreateSnapshot={createSnapshotFromTabs}
                items={browsingItems}
                loading={loading}
                setCardViewMode={setBrowsingViewMode}
                showUrls={showUrls}
                title={t('browsing')}
              />
            )}
            {showSnapshotsColumn && (
              <SnapshotSection
                cardViewMode={snapshotsViewMode}
                items={snapshotItems}
                loading={loading}
                onDelete={deleteSnapshot}
                onDeleteEntry={deleteSnapshotEntry}
                setCardViewMode={setSnapshotsViewMode}
                showUrls={showUrls}
                title={t('historySnapshots')}
              />
            )}
        </section>
      </div>

      <Button
        aria-busy={wallpaperRefreshing}
        aria-label={wallpaperLocked ? t('wallpaperLocked') : t('refreshWallpaper')}
        className="wallpaper-refresh-button fixed right-5 bottom-5 z-30 rounded-full bg-transparent text-primary-foreground shadow-none hover:bg-transparent hover:text-primary-foreground sm:right-8 sm:bottom-8"
        disabled={wallpaperRefreshing}
        onClick={() => void refreshWallpaper()}
        size="icon-lg"
        title={wallpaperLocked ? t('wallpaperLockedTitle') : t('refreshWallpaper')}
        type="button"
        variant="ghost"
      >
        <FanIcon className={cn('wallpaper-refresh-icon size-5', wallpaperRefreshing && 'animate-spin')} />
      </Button>
    </main>
    </I18nContext.Provider>
  );
}

function BookmarkSection({
  cardViewMode,
  folders,
  items,
  loading,
  onAddCurrentPage,
  onAddFolder,
  onDeleteBookmark,
  onEditBookmark,
  onOpen,
  onSort,
  setCardViewMode,
  showUrls,
  title,
}: {
  cardViewMode: CardViewMode;
  folders: BookmarkFolderSummary[];
  items: BookmarkSummary[];
  loading: boolean;
  onAddCurrentPage: (parentId?: string) => Promise<void>;
  onAddFolder: (parentId?: string) => Promise<void>;
  onDeleteBookmark: (item: BookmarkSummary) => Promise<void>;
  onEditBookmark: (item: BookmarkSummary, values: { title: string; url?: string; parentId?: string }) => Promise<void>;
  onOpen: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  onSort: (source: BookmarkSummary, target: BookmarkSummary) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
  showUrls: boolean;
  title: string;
}) {
  const { t } = useI18n();
  const [sorting, setSorting] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const normalItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (item.children ?? []).length < 2);
  const groupedItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (item.children ?? []).length >= 2);
  const displayItems = [...normalItems, ...groupedItems];
  const sortableIds = displayItems.map(({ item }) => item.id);

  async function finishSort(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : '';
    if (!overId || activeId === overId) return;

    const source = displayItems.find(({ item }) => item.id === activeId)?.item;
    const target = displayItems.find(({ item }) => item.id === overId)?.item;
    if (!source || !target) return;

    await onSort(source, target);
  }

  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle count={items.length}>{title}</SectionTitle>
        <div className="flex items-center gap-2">
          <CardViewToggle
            mode={cardViewMode}
            setMode={setCardViewMode}
          />
          <Button
            aria-label={t('sortBookmarks')}
            className="rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 hover:text-primary-foreground"
            onClick={() => {
              setSorting((current) => !current);
            }}
            size="icon-sm"
            type="button"
            variant={sorting ? 'default' : 'ghost'}
          >
            <ArrowUpDownIcon />
          </Button>
        </div>
      </div>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => void finishSort(event)}
        sensors={sensors}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div
            className={cn(
              'grid items-start',
              cardViewMode === 'icon'
                ? 'grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-x-3 gap-y-4'
                : 'grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3.5',
            )}
          >
            {displayItems.map(({ item, index }) => (
              <SortableBookmarkCard
                index={index}
                folders={folders}
                item={item}
                key={item.id}
                onAddCurrentPage={onAddCurrentPage}
                onAddFolder={onAddFolder}
                onDeleteBookmark={onDeleteBookmark}
                onEditBookmark={onEditBookmark}
                onOpen={onOpen}
                setCardViewMode={setCardViewMode}
                viewMode={cardViewMode}
                showSortingHandle={sorting}
                showUrls={showUrls}
                sorting={sorting}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <EmptyState
          icon={BookmarkIcon}
          loading={loading}
          title={loading ? t('loading') : t('emptyBookmarks')}
        />
      )}
    </section>
  );
}

function SectionTitle({
  children,
  count,
}: {
  children: ReactNode;
  count: number;
}) {
  const { t } = useI18n();
  return (
    <h2 className="flex min-w-0 items-start gap-1.5 text-xl font-bold">
      <span className="truncate">{children}</span>
      <Badge
        className="mt-0.5 h-4 min-w-4 rounded-full bg-background/20 px-1.5 text-[10px] leading-none text-primary-foreground"
        variant="secondary"
      >
        {count}
      </Badge>
    </h2>
  );
}

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const languages: { locale: Locale; label: string; shortLabel: string }[] = [
    { locale: 'zh-CN', label: '中文', shortLabel: '中' },
    { locale: 'en-US', label: 'English', shortLabel: 'EN' },
  ];

  return (
    <HoverCard closeDelay={160} openDelay={80}>
      <HoverCardTrigger asChild>
        <Button
          aria-label={t('language')}
          className="text-primary-foreground hover:bg-background/15 hover:text-primary-foreground"
          size="icon"
          type="button"
          variant="ghost"
        >
          <LanguagesIcon />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-40 p-2 text-foreground" sideOffset={10}>
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {t('language')}
          </div>
          {languages.map((language) => (
            <button
              className={cn(
                'flex h-9 items-center justify-between rounded-md px-2 text-sm font-medium transition-colors hover:bg-muted',
                language.locale === locale && 'bg-muted',
              )}
              key={language.locale}
              onClick={() => setLocale(language.locale)}
              type="button"
            >
              <span>{language.label}</span>
              <Badge variant="secondary">{language.shortLabel}</Badge>
            </button>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function BookmarkContextMenu({
  children,
  folders,
  item,
  onAddCurrentPage,
  onAddFolder,
  onDeleteBookmark,
  onEditBookmark,
  setCardViewMode,
}: {
  children: ReactNode;
  folders: BookmarkFolderSummary[];
  item: BookmarkSummary;
  onAddCurrentPage: (parentId?: string) => Promise<void>;
  onAddFolder: (parentId?: string) => Promise<void>;
  onDeleteBookmark: (item: BookmarkSummary) => Promise<void>;
  onEditBookmark: (item: BookmarkSummary, values: { title: string; url?: string; parentId?: string }) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
}) {
  const { t } = useI18n();
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="contents">{children}</div>
      </ContextMenuTrigger>
      <BookmarkContextMenuContent
        folders={folders}
        item={item}
        onAddCurrentPage={onAddCurrentPage}
        onAddFolder={onAddFolder}
        onDeleteBookmark={onDeleteBookmark}
        onEditBookmark={onEditBookmark}
        setCardViewMode={setCardViewMode}
      />
    </ContextMenu>
  );
}

function BookmarkContextMenuContent({
  folders,
  item,
  onAddCurrentPage,
  onAddFolder,
  onDeleteBookmark,
  onEditBookmark,
  setCardViewMode,
}: {
  folders: BookmarkFolderSummary[];
  item: BookmarkSummary;
  onAddCurrentPage: (parentId?: string) => Promise<void>;
  onAddFolder: (parentId?: string) => Promise<void>;
  onDeleteBookmark: (item: BookmarkSummary) => Promise<void>;
  onEditBookmark: (item: BookmarkSummary, values: { title: string; url?: string; parentId?: string }) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
}) {
  const { t } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const isFolder = item.isFolder === true;
  const targetFolderId = isFolder ? item.id : item.parentId;
  const itemDisplayName = isFolder ? item.folderTitle || item.title : item.title || item.url;

  async function deleteItem() {
    if (!window.confirm(t('deleteConfirm', { name: itemDisplayName }))) return;

    await onDeleteBookmark(item);
  }

  return (
    <>
    <ContextMenuContent className="w-72">
      <ContextMenuGroup>
        <ContextMenuItem onSelect={() => void openUrl(item.url)}>
          <ExternalLinkIcon />
          <span>{t('openInNewTab')}</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => void openUrlInNewWindow(item.url)}>
          <AppWindowIcon />
          <span>{t('openInNewWindow')}</span>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => {
            void openUrlInNewWindow(item.url, true).catch(() => {
              window.alert(t('inPrivateBlocked'));
            });
          }}
        >
          <AppWindowIcon />
          <span>{t('inPrivateOpen')}</span>
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuItem
          onSelect={(event) => {
            event.preventDefault();
            setEditOpen(true);
          }}
        >
          <SettingsIcon />
          <span>{t('edit')}</span>
        </ContextMenuItem>
        <ContextMenuCheckboxItem
          checked
          onSelect={() => setCardViewMode('icon')}
        >
          {t('iconOnly')}
        </ContextMenuCheckboxItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onSelect={() => void deleteItem()}>
        <Trash2Icon />
        <span>{t('delete')}</span>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuItem onSelect={() => void onAddFolder(targetFolderId)}>
          <BookmarkIcon />
          <span>{t('addFolder')}</span>
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuItem onSelect={() => void openUrl('chrome://bookmarks/')}>
          <SettingsIcon />
          <span>{t('manageBookmarks')}</span>
        </ContextMenuItem>
      </ContextMenuGroup>
    </ContextMenuContent>
    <BookmarkEditDialog
      folders={folders}
      item={item}
      onOpenChange={setEditOpen}
      onCreateFolder={onAddFolder}
      onSave={(values) => onEditBookmark(item, values)}
      open={editOpen}
    />
    </>
  );
}

function BookmarkEditDialog({
  folders,
  item,
  onCreateFolder,
  onOpenChange,
  onSave,
  open,
}: {
  folders: BookmarkFolderSummary[];
  item: BookmarkSummary;
  onCreateFolder: (parentId?: string) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSave: (values: { title: string; url?: string; parentId?: string }) => Promise<void>;
  open: boolean;
}) {
  const { t } = useI18n();
  const isFolder = item.isFolder === true;
  const fallbackFolderId = folders[0]?.id;
  const [title, setTitle] = useState(item.title || item.folderTitle || '');
  const [url, setUrl] = useState(item.url || '');
  const [selectedFolderId, setSelectedFolderId] = useState(item.parentId || fallbackFolderId || '');
  const [saving, setSaving] = useState(false);
  const visibleFolders = folders.filter((folder) => folder.id !== item.id);
  const selectedFolder = visibleFolders.find((folder) => folder.id === selectedFolderId);

  useEffect(() => {
    if (!open) return;

    setTitle(isFolder ? item.folderTitle || item.title : item.title || item.url);
    setUrl(item.url || '');
    setSelectedFolderId(item.parentId || fallbackFolderId || '');
    setSaving(false);
  }, [fallbackFolderId, isFolder, item, open]);

  async function submitEdit() {
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle || (!isFolder && !trimmedUrl) || saving) return;

    setSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        ...(isFolder ? {} : { url: trimmedUrl }),
        ...(selectedFolderId ? { parentId: selectedFolderId } : {}),
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  async function createFolder() {
    await onCreateFolder(selectedFolderId || undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>
            {t('editBookmark')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 font-medium">
            {t('name')}
            <Input
              aria-label={t('name')}
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />
          </label>

          {!isFolder && (
            <label className="flex flex-col gap-2 font-medium">
              URL
              <Input
                aria-label="URL"
                onChange={(event) => setUrl(event.target.value)}
                value={url}
              />
            </label>
          )}

          <div className="flex flex-col gap-2">
            <div className="font-medium">{t('folder')}</div>
            <div className="max-h-72 overflow-y-auto rounded-lg border bg-background/30 p-1">
              {visibleFolders.map((folder) => {
                const selected = folder.id === selectedFolderId;
                return (
                  <button
                    className={cn(
                      'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left font-medium transition-colors hover:bg-muted',
                      selected && 'bg-muted',
                    )}
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    style={{ paddingLeft: 12 + folder.depth * 18 }}
                    type="button"
                  >
                    <FolderIcon className="size-3.5" />
                    <span className="truncate">{formatBookmarkFolderTitle(folder, t)}</span>
                  </button>
                );
              })}
              {visibleFolders.length === 0 && (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  {t('emptyFolders')}
                </div>
              )}
            </div>
            {selectedFolder && (
              <span className="text-xs text-muted-foreground">
                {t('saveToFolder', { name: formatBookmarkFolderTitle(selectedFolder, t) })}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={saving}
            onClick={() => void createFolder()}
            type="button"
            variant="outline"
          >
            {t('newFolder')}
          </Button>
          <Button
            disabled={saving}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="secondary"
          >
            {t('cancel')}
          </Button>
          <Button
            disabled={saving || !title.trim() || (!isFolder && !url.trim())}
            onClick={() => void submitEdit()}
            type="button"
          >
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatBookmarkFolderTitle(folder: BookmarkFolderSummary, t: Translate) {
  if (folder.title === 'Bookmarks Bar') return t('bookmarksBar');
  if (folder.title === 'Other Bookmarks') return t('otherBookmarks');
  return folder.title || folder.rootTitle || t('bookmarkFolder');
}

interface SearchEngineSettingsDialogProps {
  engines: SearchEngineConfig[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (engines: SearchEngineConfig[]) => void;
}

function SearchEngineSettingsDialog({
  engines,
  open,
  onOpenChange,
  onSave,
}: SearchEngineSettingsDialogProps) {
  const { t } = useI18n();
  const [draftEngines, setDraftEngines] = useState<SearchEngineConfig[]>(() =>
    normalizeSearchEngines(engines),
  );
  const enabledValidCount = draftEngines.filter(
    (engine) => engine.enabled && engine.label.trim() && engine.searchUrl.trim(),
  ).length;
  const canSave = enabledValidCount > 0;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const sortableIds = draftEngines.map((engine) => engine.id);

  useEffect(() => {
    if (open) {
      setDraftEngines(normalizeSearchEngines(engines));
    }
  }, [engines, open]);

  function updateEngine(id: string, value: Partial<SearchEngineConfig>) {
    setDraftEngines((current) =>
      current.map((engine) => (engine.id === id ? { ...engine, ...value } : engine)),
    );
  }

  function addEngine() {
    setDraftEngines((current) => [
      ...current,
      {
        id: createSearchEngineId(current),
        label: t('custom'),
        logo: '',
        searchUrl: '',
        enabled: true,
      },
    ]);
  }

  function resetEngines() {
    setDraftEngines(DEFAULT_SEARCH_ENGINES.map((engine) => ({ ...engine })));
  }

  function deleteEngine(id: string) {
    setDraftEngines((current) => {
      if (current.length <= 1) return current;
      return current.filter((engine) => engine.id !== id);
    });
  }

  function finishSort(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : '';
    if (!overId || activeId === overId) return;

    setDraftEngines((current) => {
      const oldIndex = current.findIndex((engine) => engine.id === activeId);
      const newIndex = current.findIndex((engine) => engine.id === overId);
      if (oldIndex < 0 || newIndex < 0) return current;

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>, id: string) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;
      if (typeof result === 'string') {
        updateEngine(id, { logo: result });
      }
    });
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function saveEngines() {
    if (!canSave) return;

    onSave(draftEngines);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(42rem,calc(100vh-2rem))] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t('customSearchEngine')}</DialogTitle>
          <DialogDescription className="text-base text-foreground">
            {t('customSearchEngineHelp')}
          </DialogDescription>
        </DialogHeader>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={finishSort}
          sensors={sensors}
        >
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="flex min-h-0 flex-col gap-3 overflow-x-hidden overflow-y-auto pb-px pr-1 [scrollbar-gutter:stable]">
              {draftEngines.map((engine) => (
                <SortableSearchEngineRow
                  canDelete={draftEngines.length > 1}
                  engine={engine}
                  key={engine.id}
                  onDelete={deleteEngine}
                  onLogoUpload={handleLogoUpload}
                  onUpdate={updateEngine}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <DialogFooter className="items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button onClick={addEngine} type="button">
              {t('add')}
            </Button>
            <Button onClick={resetEngines} type="button" variant="destructive">
              {t('reset')}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t('cancel')}
            </Button>
            <Button disabled={!canSave} onClick={saveEngines} type="button">
              {t('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SortableSearchEngineRowProps {
  canDelete: boolean;
  engine: SearchEngineConfig;
  onDelete: (id: string) => void;
  onLogoUpload: (event: ChangeEvent<HTMLInputElement>, id: string) => void;
  onUpdate: (id: string, value: Partial<SearchEngineConfig>) => void;
}

function SortableSearchEngineRow({
  canDelete,
  engine,
  onDelete,
  onLogoUpload,
  onUpdate,
}: SortableSearchEngineRowProps) {
  const { t } = useI18n();
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: engine.id,
  });

  return (
    <div
      className={cn(
        'grid grid-cols-[auto_auto_1.5rem_minmax(4.5rem,7rem)_minmax(10rem,1fr)_auto] items-center gap-2 rounded-lg',
        'sm:grid-cols-[auto_auto_1.75rem_minmax(5rem,7rem)_minmax(12rem,1fr)_auto_auto]',
        isDragging && 'z-20 opacity-75',
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transform && !isDragging ? transition : undefined,
      }}
    >
      <Button
        aria-label={t('dragSort')}
        className="cursor-grab active:!translate-y-0 active:cursor-grabbing"
        ref={setActivatorNodeRef}
        size="icon"
        type="button"
        variant="ghost"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon />
      </Button>
      <Checkbox
        aria-label={t('enableSearchEngine', { name: engine.label || t('searchEngine') })}
        checked={engine.enabled}
        onCheckedChange={(checked) => onUpdate(engine.id, { enabled: checked === true })}
      />
      {engine.logo ? (
        <img alt="" className="size-6 object-contain" src={engine.logo} />
      ) : (
        <SearchIcon className="text-muted-foreground" />
      )}
      <Input
        aria-label={t('searchEngineName')}
        onChange={(event) => onUpdate(engine.id, { label: event.target.value })}
        value={engine.label}
      />
      <Input
        aria-label={t('searchEngineUrl')}
        onChange={(event) => onUpdate(engine.id, { searchUrl: event.target.value })}
        placeholder="https://example.com/search?q="
        value={engine.searchUrl}
      />
      <Button
        asChild
        aria-label={t('uploadIcon')}
        className="active:!translate-y-0"
        type="button"
        variant="outline"
      >
        <label>
          <UploadIcon />
          <Input
            accept="image/*"
            className="sr-only"
            onChange={(event) => onLogoUpload(event, engine.id)}
            type="file"
          />
        </label>
      </Button>
      <Button
        aria-label={t('delete')}
        className="active:!translate-y-0"
        disabled={!canDelete}
        onClick={() => onDelete(engine.id)}
        size="icon"
        type="button"
        variant="destructive"
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

function SortableBookmarkCard({
  folders,
  index,
  item,
  onAddCurrentPage,
  onAddFolder,
  onDeleteBookmark,
  onEditBookmark,
  onOpen,
  setCardViewMode,
  showSortingHandle,
  showUrls,
  sorting,
  viewMode,
}: {
  folders: BookmarkFolderSummary[];
  index: number;
  item: BookmarkSummary;
  onAddCurrentPage: (parentId?: string) => Promise<void>;
  onAddFolder: (parentId?: string) => Promise<void>;
  onDeleteBookmark: (item: BookmarkSummary) => Promise<void>;
  onEditBookmark: (item: BookmarkSummary, values: { title: string; url?: string; parentId?: string }) => Promise<void>;
  onOpen: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
  showSortingHandle: boolean;
  showUrls: boolean;
  sorting: boolean;
  viewMode: CardViewMode;
}) {
  const { t } = useI18n();
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled: !sorting,
    id: item.id,
  });
  const folderItems = item.children ?? [];
  const cardItem = folderItems.length === 1 ? folderItems[0] : item;

  return (
    <div
      className={cn(
        'relative rounded-lg touch-none',
        sorting && viewMode === 'card' && 'flex cursor-default items-center gap-1.5',
        sorting && viewMode === 'icon' && 'cursor-default',
        isDragging && 'z-20 opacity-75',
      )}
      onClickCapture={(event) => {
        if (!sorting) return;

        event.preventDefault();
        event.stopPropagation();
      }}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transform && !isDragging ? transition : undefined,
      }}
    >
      {showSortingHandle && (
        <BookmarkSortHandle
          attributes={attributes}
          listeners={listeners}
          setActivatorNodeRef={setActivatorNodeRef}
          viewMode={viewMode}
        />
      )}
      <div className={cn(sorting && viewMode === 'card' && 'min-w-0 flex-1')}>
        {viewMode === 'icon' ? (
          <IconGridCard
            count={folderItems.length >= 2 ? folderItems.length : undefined}
            hoverContent={folderItems.length >= 2 ? (
              <IconHoverPanel
                action={(
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      void Promise.all(folderItems.map((folderItem) => openUrl(folderItem.url)));
                    }}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <ExternalLinkIcon data-icon="inline-start" />
                    {t('openAll')}
                  </Button>
                )}
                title={item.folderTitle || item.title || t('unnamedFolder')}
              >
                {folderItems.map((folderItem) => (
                  <ResourceOpenButton
                    item={folderItem}
                    key={folderItem.id}
                    onOpen={onOpen}
                    showUrls={showUrls}
                  />
                ))}
              </IconHoverPanel>
            ) : undefined}
                item={cardItem}
                menu={(
                  <BookmarkContextMenuContent
                    folders={folders}
                    item={cardItem}
                onAddCurrentPage={onAddCurrentPage}
                onAddFolder={onAddFolder}
                onDeleteBookmark={onDeleteBookmark}
                onEditBookmark={onEditBookmark}
                setCardViewMode={setCardViewMode}
              />
            )}
            onOpen={async () => {
              if (folderItems.length >= 2) {
                await Promise.all(folderItems.map((folderItem) => openUrl(folderItem.url)));
                return;
              }

              await onOpen(cardItem.url, cardItem);
            }}
            title={folderItems.length >= 2 ? item.folderTitle || item.title : cardItem.title}
          />
        ) : folderItems.length >= 2 ? (
          <BookmarkGroupCard
            folders={folders}
            item={item}
            onAddCurrentPage={onAddCurrentPage}
            onAddFolder={onAddFolder}
            onDeleteBookmark={onDeleteBookmark}
            onEditBookmark={onEditBookmark}
            onOpen={onOpen}
            setCardViewMode={setCardViewMode}
            showUrls={showUrls}
          />
        ) : (
          <BookmarkContextMenu
            folders={folders}
            item={cardItem}
            onAddCurrentPage={onAddCurrentPage}
            onAddFolder={onAddFolder}
            onDeleteBookmark={onDeleteBookmark}
            onEditBookmark={onEditBookmark}
            setCardViewMode={setCardViewMode}
          >
            <ResourceCard
              compact={index < 9}
              grouped={false}
              item={cardItem}
              onOpen={onOpen}
              showUrls={showUrls}
              showClose={false}
            />
          </BookmarkContextMenu>
        )}
      </div>
    </div>
  );
}

function BookmarkSortHandle({
  attributes,
  listeners,
  setActivatorNodeRef,
  viewMode,
}: {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  setActivatorNodeRef: ReturnType<typeof useSortable>['setActivatorNodeRef'];
  viewMode: CardViewMode;
}) {
  const { t } = useI18n();
  return (
    <button
      aria-label={t('dragSort')}
      className={cn(
        'flex size-5 shrink-0 cursor-grab items-center justify-center text-primary-foreground/75 transition-colors hover:text-primary-foreground active:cursor-grabbing',
        viewMode === 'icon' && 'absolute top-1 left-1 z-10',
      )}
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon className="size-3.5" />
    </button>
  );
}

function BrowsingSection({
  actualTabs,
  cardViewMode,
  canCreateSnapshot,
  items,
  loading,
  onCreateSnapshot,
  onCloseAllTabs,
  setCardViewMode,
  showUrls,
  title,
}: {
  actualTabs: TabSummary[];
  cardViewMode: CardViewMode;
  canCreateSnapshot: boolean;
  items: BrowsingCardItem[];
  loading: boolean;
  onCloseAllTabs: () => Promise<void>;
  onCreateSnapshot: (title: string, selectedTabs: TabSummary[]) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
  showUrls: boolean;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle count={items.length}>{title}</SectionTitle>
        <div className="flex items-center gap-2">
          <CardViewToggle
            mode={cardViewMode}
            setMode={setCardViewMode}
          />
          {canCreateSnapshot && (
            <CreateSnapshotDialog
              loading={loading}
              onCreateSnapshot={onCreateSnapshot}
              tabs={actualTabs}
            />
          )}
          <Button
            aria-label={t('closeAllTabs')}
            className="rounded-full bg-background/20 text-primary-foreground hover:bg-destructive/20 hover:text-primary-foreground"
            disabled={loading || actualTabs.length === 0}
            onClick={() => void onCloseAllTabs()}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        </div>
      </div>
      {cardViewMode === 'icon' ? (
        <IconGrid>
          {items.map((item) => {
            const primaryTab = item.tabs[0];
            if (!primaryTab) return null;

            return (
              <IconGridCard
                count={item.tabs.length > 1 ? item.tabs.length : undefined}
                hoverContent={item.tabs.length > 1 ? (
                  <IconHoverPanel
                    action={(
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            void Promise.all(item.tabs.map((tab) => switchToTab(tab)));
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <ExternalLinkIcon data-icon="inline-start" />
                          {t('openAll')}
                        </Button>
                        <Button
                          className="text-destructive hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            void Promise.all(item.tabs.map((tab) => closeTab(tab)));
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <XIcon data-icon="inline-start" />
                          {t('closeAll')}
                        </Button>
                      </div>
                    )}
                    title={item.groupTitle ? getGroupDisplayTitle(item.groupTitle, t) : primaryTab.title || t('unnamedGroup')}
                  >
                    {item.tabs.map((tab) => (
                      <ResourceOpenButton
                        item={tab}
                        key={`${tab.windowId}-${tab.id}-${tab.url}`}
                        onClose={(_, selectedTab) => closeTab(selectedTab as TabSummary)}
                        onOpen={(_, selectedTab) => switchToTab(selectedTab as TabSummary)}
                        showUrls={showUrls}
                      />
                    ))}
                  </IconHoverPanel>
                ) : undefined}
                item={primaryTab}
                key={item.id}
                onDelete={async () => {
                  await Promise.all(item.tabs.map((tab) => closeTab(tab)));
                }}
                onOpen={async () => {
                  if (item.tabs.length > 1) {
                    for (const tab of item.tabs) {
                      await switchToTab(tab);
                    }
                    return;
                  }

                  await switchToTab(primaryTab);
                }}
                title={item.groupTitle ? getGroupDisplayTitle(item.groupTitle, t) : primaryTab.title}
                variant="close"
              />
            );
          })}
        </IconGrid>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] items-start gap-3.5">
          {items.map((item) => (
            <BrowsingCard
              item={item}
              key={item.id}
              onClose={closeTab}
              onOpen={switchToTab}
              showUrls={showUrls}
            />
          ))}
        </div>
      )}
      {items.length === 0 && (
        <EmptyState
          icon={AppWindowIcon}
          loading={loading}
          title={loading ? t('loading') : t('emptyTabs')}
        />
      )}
    </section>
  );
}

function CreateSnapshotDialog({
  loading,
  onCreateSnapshot,
  tabs,
}: {
  loading: boolean;
  onCreateSnapshot: (title: string, selectedTabs: TabSummary[]) => Promise<void>;
  tabs: TabSummary[];
}) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const tabOptions = useMemo(
    () => tabs.map((tab, index) => ({ key: getTabSelectionKey(tab, index), tab })),
    [tabs],
  );
  const allSelected = tabOptions.length > 0 && selectedKeys.size === tabOptions.length;
  const partiallySelected = selectedKeys.size > 0 && selectedKeys.size < tabOptions.length;
  const allCheckedState = partiallySelected ? 'indeterminate' : allSelected;

  useEffect(() => {
    if (!open) return;

    setSnapshotTitle(t('snapshotTitle', { time: formatSnapshotSavedAt(new Date().toISOString(), locale) }));
    setSelectedKeys(new Set(tabOptions.map((option) => option.key)));
  }, [open, tabOptions]);

  function toggleAll(checked: boolean | 'indeterminate') {
    setSelectedKeys(checked === true ? new Set(tabOptions.map((option) => option.key)) : new Set());
  }

  function toggleTab(key: string, checked: boolean | 'indeterminate') {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (checked === true) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  async function submitSnapshot() {
    const selectedTabs = tabOptions
      .filter((option) => selectedKeys.has(option.key))
      .map((option) => option.tab);

    if (selectedTabs.length === 0 || saving) return;

    setSaving(true);
    try {
      await onCreateSnapshot(snapshotTitle, selectedTabs);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        aria-label={t('createSnapshot')}
        className="rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 hover:text-primary-foreground"
        disabled={loading || tabOptions.length === 0}
        onClick={() => setOpen(true)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <SaveIcon />
      </Button>
      <DialogContent className="max-h-[min(36rem,calc(100vh-2rem))] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('createSnapshot')}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t('snapshotName')}
            <Input
              aria-label={t('snapshotName')}
              onChange={(event) => setSnapshotTitle(event.target.value)}
              value={snapshotTitle}
            />
          </label>
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
            <label className="flex min-w-0 items-center gap-3 text-sm font-medium">
              <Checkbox
                aria-label={t('all')}
                checked={allCheckedState}
                onCheckedChange={toggleAll}
              />
              <span>{t('all')}</span>
            </label>
            <Badge variant="secondary">
              {selectedKeys.size}/{tabOptions.length}
            </Badge>
          </div>
          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {tabOptions.map(({ key, tab }) => (
              <label
                className="grid min-w-0 grid-cols-[auto_1rem_minmax(0,1fr)] items-center gap-3 rounded-lg border bg-card p-2 text-card-foreground"
                key={key}
              >
                <Checkbox
                  aria-label={t('selectTab', { name: tab.title || tab.url })}
                  checked={selectedKeys.has(key)}
                  onCheckedChange={(checked) => toggleTab(key, checked)}
                />
                <SiteMark item={tab} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <strong className="truncate text-sm font-semibold" title={tab.title || t('unnamedTab')}>
                    {tab.title || t('unnamedTab')}
                  </strong>
                  <span className="truncate text-xs text-muted-foreground" title={tab.url}>
                    {tab.url}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            {t('cancel')}
          </Button>
          <Button
            disabled={selectedKeys.size === 0 || saving}
            onClick={() => void submitSnapshot()}
            type="button"
          >
            <SaveIcon data-icon="inline-start" />
            {t('createSnapshot')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SponsorDialog() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<'alipay' | 'wechat'>('wechat');
  const sponsorImage = method === 'wechat'
    ? '/pay/wx.jpeg'
    : '/pay/zfb.jpeg';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        aria-label={t('donate')}
        className="text-primary-foreground hover:bg-background/15 hover:text-primary-foreground"
        onClick={() => setOpen(true)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <SponsorIcon />
      </Button>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-base font-semibold text-muted-foreground">
            {t('donateTitle')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 px-2 pb-2 text-center">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('donateText')}
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setMethod('wechat')}
              size="sm"
              type="button"
              variant={method === 'wechat' ? 'default' : 'outline'}
            >
              {t('wechat')}
            </Button>
            <Button
              onClick={() => setMethod('alipay')}
              size="sm"
              type="button"
              variant={method === 'alipay' ? 'default' : 'outline'}
            >
              {t('alipay')}
            </Button>
          </div>
          <SponsorQrCode key={sponsorImage} alt={`${method === 'wechat' ? t('wechat') : t('alipay')} ${t('donate')}`} src={sponsorImage} />
          <a
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            href="https://www.itab.link/donate.html"
            rel="noreferrer"
            target="_blank"
          >
            {t('donatePublic')}
          </a>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} size="sm" type="button" variant="outline">
            {t('donateLater')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SponsorQrCode({ alt, src }: { alt: string; src: string }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-square w-56 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        {t('noPaymentQr')}
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className="aspect-square w-56 rounded-lg border bg-background object-cover"
      onError={() => setFailed(true)}
      src={src}
    />
  );
}

function SponsorIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M273.067 477.867h477.866V409.6H273.067zm0 68.266v51.2A187.733 187.733 0 0 0 460.8 785.067h102.4a187.733 187.733 0 0 0 187.733-187.734v-51.2H273.067zm-34.134-204.8h546.134a34.133 34.133 0 0 1 34.133 34.134v221.866a256 256 0 0 1-256 256H460.8a256 256 0 0 1-256-256V375.467a34.133 34.133 0 0 1 34.133-34.134zM512 34.133a34.133 34.133 0 0 1 34.133 34.134v170.666a34.133 34.133 0 0 1-68.266 0V68.267A34.133 34.133 0 0 1 512 34.133zM375.467 102.4a34.133 34.133 0 0 1 34.133 34.133v102.4a34.133 34.133 0 0 1-68.267 0v-102.4a34.133 34.133 0 0 1 34.134-34.133m273.066 0a34.133 34.133 0 0 1 34.134 34.133v102.4a34.133 34.133 0 1 1-68.267 0v-102.4a34.133 34.133 0 0 1 34.133-34.133M170.667 921.668h682.666a34.133 34.133 0 1 1 0 68.267H170.667a34.133 34.133 0 1 1 0-68.267z"
        fill="currentColor"
      />
    </svg>
  );
}

function SnapshotSection({
  cardViewMode,
  items,
  loading,
  onDelete,
  onDeleteEntry,
  setCardViewMode,
  showUrls,
  title,
}: {
  cardViewMode: CardViewMode;
  items: WorkspaceSnapshot[];
  loading: boolean;
  onDelete: (snapshotId: string) => Promise<void>;
  onDeleteEntry: (snapshotId: string, entryId: string) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
  showUrls: boolean;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <section className="min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <SectionTitle count={items.length}>{title}</SectionTitle>
        <div className="flex items-center gap-2">
          <CardViewToggle
            mode={cardViewMode}
            setMode={setCardViewMode}
          />
        </div>
      </div>
      {cardViewMode === 'icon' ? (
        <IconGrid>
          {items.map((item) => {
            const primaryTab = item.tabs[0];
            return (
              <IconGridCard
                count={item.tabs.length > 1 ? item.tabs.length : undefined}
                hoverContent={item.tabs.length > 1 ? (
                  <IconHoverPanel
                    action={(
                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          void openSnapshotTabs(item);
                        }}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <ExternalLinkIcon data-icon="inline-start" />
                        {t('restoreSnapshot')}
                      </Button>
                    )}
                    title={item.title || t('unnamedSnapshot')}
                  >
                    {item.tabs.map((entry) => (
                      <SnapshotEntryOpenRow
                        entry={entry}
                        key={entry.id}
                        onDelete={() => onDeleteEntry(item.id, entry.id)}
                        showUrls={showUrls}
                      />
                    ))}
                  </IconHoverPanel>
                ) : undefined}
                item={primaryTab}
                key={`${item.id}-${item.savedAt}-${item.tabs.length}`}
                onDelete={() => onDelete(item.id)}
                onOpen={() => openSnapshotTabs(item)}
                title={item.title || t('unnamedSnapshot')}
              />
            );
          })}
        </IconGrid>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] items-start gap-3.5">
          {items.map((item) => (
            <SnapshotStackCard
              item={item}
              key={`${item.id}-${item.savedAt}-${item.tabs.length}`}
              onDelete={onDelete}
              onDeleteEntry={onDeleteEntry}
              onOpen={openSnapshotTabs}
              showUrls={showUrls}
            />
          ))}
        </div>
      )}
      {items.length === 0 && (
        <EmptyState
          icon={HistoryIcon}
          loading={loading}
          title={loading ? t('loading') : t('emptySnapshots')}
        />
      )}
    </section>
  );
}

function SnapshotStackCard({
  item,
  onDelete,
  onDeleteEntry,
  onOpen,
  showUrls,
}: {
  item: WorkspaceSnapshot;
  onDelete: (snapshotId: string) => Promise<void>;
  onDeleteEntry: (snapshotId: string, entryId: string) => Promise<void>;
  onOpen: (snapshot: WorkspaceSnapshot) => Promise<void>;
  showUrls: boolean;
}) {
  const { locale, t } = useI18n();
  const disabled = item.tabs.length === 0;
  const [expanded, setExpanded] = useState(false);
  const itemHeight = showUrls ? 64 : 44;
  const expandedGap = 8;
  const stackOffset = showUrls ? 14 : 10;
  const visibleStackCount = Math.min(item.tabs.length, 3);
  const stackHeight = showUrls ? 96 : 64;
  const collapseButtonSpace = 32;
  const stackBadgeSpace = item.tabs.length > 3 ? 24 : 0;
  const expandedHeight =
    item.tabs.length * itemHeight + Math.max(item.tabs.length - 1, 0) * expandedGap;
  const title = item.title || t('unnamedSnapshot');

  return (
    <div
      className={cn('flex flex-col', disabled && 'opacity-70')}
      onClick={() => {
        if (!disabled) {
          setExpanded((current) => !current);
        }
      }}
    >
      <div className="mb-1.5 truncate px-1 text-sm font-semibold text-primary-foreground" title={`${title} · ${formatSnapshotSavedAt(item.savedAt, locale)}`}>
        {title} · {formatSnapshotSavedAt(item.savedAt, locale)}
      </div>
      <div
        className="relative w-full transition-[height,margin] duration-300 ease-out"
        style={{
          height: expanded ? expandedHeight + collapseButtonSpace : stackHeight + stackBadgeSpace,
          marginBottom: showUrls ? 12 : 8,
        }}
      >
        {item.tabs.map((entry, index) => {
          const visibleInStack = index < visibleStackCount;
          const y = expanded ? index * (itemHeight + expandedGap) : Math.min(index, 2) * stackOffset;
          const scale = expanded ? 1 : 1 - Math.min(index, 2) * 0.035;
          const transitionDelay = expanded
            ? `${index * 45}ms`
            : `${Math.max(item.tabs.length - index - 1, 0) * 20}ms`;

          return (
            <div
              className={cn(
                'absolute inset-x-0 rounded-lg bg-card p-2 text-card-foreground shadow-sm ring-1 ring-foreground/10 transition-[opacity,transform] duration-300 ease-out will-change-transform',
                !expanded && !visibleInStack && 'opacity-0 pointer-events-none',
              )}
              key={entry.id}
              style={{
                height: itemHeight,
                transform: `translateY(${y}px) scale(${scale})`,
                transitionDelay,
                zIndex: expanded
                  ? item.tabs.length - index
                  : visibleStackCount - Math.min(index, 2),
              }}
            >
              {expanded ? (
                <SnapshotEntryOpenRow
                  entry={entry}
                  onDelete={() => onDeleteEntry(item.id, entry.id)}
                  showUrls={showUrls}
                />
              ) : index === 0 ? (
                <SnapshotCollapsedRow
                  entry={entry}
                  onDelete={() => onDelete(item.id)}
                  onOpen={() => onOpen(item)}
                  showUrls={showUrls}
                />
              ) : (
                <TabDisplayRow item={entry} showUrls={showUrls} />
              )}
              {expanded && index < item.tabs.length - 1 && (
                <Separator className="absolute right-2 bottom-[-5px] left-2" />
              )}
            </div>
          );
        })}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-card text-sm text-muted-foreground shadow-sm ring-1 ring-foreground/10">
            {t('emptySnapshot')}
          </div>
        )}
        {!expanded && item.tabs.length > 3 && (
          <span className="absolute right-2 bottom-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            +{item.tabs.length - 3}
          </span>
        )}
        {expanded && !disabled && (
          <Button
            aria-label={t('collapseSnapshot', { name: title })}
            className="absolute right-0 bottom-0 rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(false);
            }}
            size="icon-xs"
            type="button"
            variant="secondary"
          >
            <ChevronUpIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

function SnapshotEntryOpenRow({
  entry,
  onDelete,
  showUrls,
}: {
  entry: SnapshotTabEntry;
  onDelete: () => Promise<void>;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <button
        className="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] items-center gap-3 text-left"
        onClick={(event) => {
          event.stopPropagation();
          void openUrl(entry.url);
        }}
        type="button"
      >
        <SiteMark item={entry} />
        <span className={cn('flex min-w-0 flex-col', showUrls && 'gap-0.5')}>
          <strong className="truncate text-base leading-tight font-semibold" title={entry.title || t('unnamedTab')}>
            {entry.title || t('unnamedTab')}
          </strong>
          {showUrls && (
            <span className="truncate text-sm text-muted-foreground" title={entry.url}>{entry.url}</span>
          )}
        </span>
      </button>
      <Button
        aria-label={`${t('delete')} ${entry.title || entry.url}`}
        className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={(event) => {
          event.stopPropagation();
          void onDelete();
        }}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}

function SnapshotCollapsedRow({
  entry,
  onDelete,
  onOpen,
  showUrls,
}: {
  entry: SnapshotTabEntry;
  onDelete: () => Promise<void>;
  onOpen: () => Promise<void>;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <TabDisplayRow item={entry} showUrls={showUrls} />
      <div className="flex items-center gap-1">
        <Button
          aria-label={t('openSnapshot')}
          className="rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            void onOpen();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <ExternalLinkIcon />
        </Button>
        <Button
          aria-label={t('deleteSnapshot')}
          className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            void onDelete();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

function BrowsingCard({
  item,
  onClose,
  onOpen,
  showUrls,
}: {
  item: BrowsingCardItem;
  onClose: (tab: Pick<TabSummary, 'id'>) => Promise<void>;
  onOpen: (tab: Pick<TabSummary, 'id' | 'windowId'>) => Promise<void>;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  const isGroup = Boolean(item.groupTitle);
  const primaryTab = item.tabs[0];
  const [expanded, setExpanded] = useState(false);

  if (!isGroup) {
    return (
      <ResourceCard
        compact
        grouped={false}
        item={primaryTab}
        onClose={(_, tab) => onClose(tab as TabSummary)}
        onOpen={(_, tab) => onOpen(tab as TabSummary)}
        showUrls={showUrls}
        showClose
      />
    );
  }

  const itemHeight = showUrls ? 64 : 44;
  const expandedGap = 8;
  const stackOffset = showUrls ? 14 : 10;
  const visibleStackCount = Math.min(item.tabs.length, 3);
  const stackHeight = showUrls ? 96 : 64;
  const collapseButtonSpace = 32;
  const stackBadgeSpace = item.tabs.length > 3 ? 24 : 0;
  const expandedHeight =
    item.tabs.length * itemHeight + Math.max(item.tabs.length - 1, 0) * expandedGap;
  const groupTitle = getGroupDisplayTitle(item.groupTitle, t);

  return (
    <div
      className="flex flex-col"
      onClick={() => setExpanded((current) => !current)}
    >
      <div className="mb-1.5 truncate px-1 text-sm font-semibold text-primary-foreground" title={groupTitle}>
        {groupTitle}
      </div>
      <div
        className="relative w-full transition-[height,margin] duration-300 ease-out"
        style={{
          height: expanded ? expandedHeight + collapseButtonSpace : stackHeight + stackBadgeSpace,
          marginBottom: showUrls ? 12 : 8,
        }}
      >
        {item.tabs.map((tab, index) => {
          const visibleInStack = index < visibleStackCount;
          const y = expanded ? index * (itemHeight + expandedGap) : Math.min(index, 2) * stackOffset;
          const scale = expanded ? 1 : 1 - Math.min(index, 2) * 0.035;
          const transitionDelay = expanded
            ? `${index * 45}ms`
            : `${Math.max(item.tabs.length - index - 1, 0) * 20}ms`;

          return (
            <div
              className={cn(
                'absolute inset-x-0 rounded-lg bg-card p-2 text-card-foreground shadow-sm ring-1 ring-foreground/10 transition-[opacity,transform] duration-300 ease-out will-change-transform',
                !expanded && !visibleInStack && 'opacity-0 pointer-events-none',
              )}
              key={`${tab.windowId}-${tab.id}-${tab.url}`}
              style={{
                height: itemHeight,
                transform: `translateY(${y}px) scale(${scale})`,
                transitionDelay,
                zIndex: expanded ? item.tabs.length - index : visibleStackCount - Math.min(index, 2),
              }}
            >
              {expanded ? (
                <ResourceOpenButton
                  item={tab}
                  onClose={(_, selectedTab) => onClose(selectedTab as TabSummary)}
                  onOpen={(_, selectedTab) => onOpen(selectedTab as TabSummary)}
                  showUrls={showUrls}
                />
              ) : index === 0 ? (
                <GroupCollapsedRow
                  item={tab}
                  onCloseGroup={async () => {
                    await Promise.all(item.tabs.map((groupTab) => onClose(groupTab)));
                  }}
                  onOpenAll={async () => {
                    for (const groupTab of item.tabs) {
                      await onOpen(groupTab);
                    }
                  }}
                  showUrls={showUrls}
                />
              ) : (
                <TabDisplayRow item={tab} showUrls={showUrls} />
              )}
              {expanded && index < item.tabs.length - 1 && (
                <Separator className="absolute right-2 bottom-[-5px] left-2" />
              )}
            </div>
          );
        })}
        {!expanded && item.tabs.length > 3 && (
          <span className="absolute right-2 bottom-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            +{item.tabs.length - 3}
          </span>
        )}
        {expanded && (
          <Button
            aria-label={t('collapseGroup', { name: groupTitle })}
            className="absolute right-0 bottom-0 rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(false);
            }}
            size="icon-xs"
            type="button"
            variant="secondary"
          >
            <ChevronUpIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

function GroupCollapsedRow({
  item,
  onCloseGroup,
  onOpenAll,
  showUrls,
}: {
  item: TabSummary;
  onCloseGroup: () => Promise<void>;
  onOpenAll: () => Promise<void>;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <TabDisplayRow item={item} showUrls={showUrls} />
      <div className="flex items-center gap-1">
        <Button
          aria-label={t('open')}
          className="rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            void onOpenAll();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <ExternalLinkIcon />
        </Button>
        <Button
          aria-label={t('closeGroup')}
          className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            void onCloseGroup();
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>
    </div>
  );
}

function BookmarkGroupCard({
  folders,
  item,
  onAddCurrentPage,
  onAddFolder,
  onDeleteBookmark,
  onEditBookmark,
  onOpen,
  setCardViewMode,
  showUrls,
}: {
  folders: BookmarkFolderSummary[];
  item: BookmarkSummary;
  onAddCurrentPage: (parentId?: string) => Promise<void>;
  onAddFolder: (parentId?: string) => Promise<void>;
  onDeleteBookmark: (item: BookmarkSummary) => Promise<void>;
  onEditBookmark: (item: BookmarkSummary, values: { title: string; url?: string; parentId?: string }) => Promise<void>;
  onOpen: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  setCardViewMode: (value: CardViewMode) => void;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  const folderItems = item.children ?? [];
  const primaryBookmark = folderItems[0];
  const [expanded, setExpanded] = useState(false);
  const itemHeight = showUrls ? 64 : 44;
  const expandedGap = 8;
  const stackOffset = showUrls ? 14 : 10;
  const visibleStackCount = Math.min(folderItems.length, 3);
  const stackHeight = showUrls ? 96 : 64;
  const collapseButtonSpace = 32;
  const stackBadgeSpace = folderItems.length > 3 ? 24 : 0;
  const expandedHeight =
    folderItems.length * itemHeight + Math.max(folderItems.length - 1, 0) * expandedGap;
  const folderTitle = item.folderTitle || item.title || t('unnamedFolder');

  return (
    <BookmarkContextMenu
      folders={folders}
      item={item}
      onAddCurrentPage={onAddCurrentPage}
      onAddFolder={onAddFolder}
      onDeleteBookmark={onDeleteBookmark}
      onEditBookmark={onEditBookmark}
      setCardViewMode={setCardViewMode}
    >
    <div
      className="flex flex-col"
      onClick={() => setExpanded((current) => !current)}
    >
      <div className="mb-1.5 truncate px-1 text-sm font-semibold text-primary-foreground" title={folderTitle}>
        {folderTitle}
      </div>
      <div
        className="relative w-full transition-[height,margin] duration-300 ease-out"
        style={{
          height: expanded ? expandedHeight + collapseButtonSpace : stackHeight + stackBadgeSpace,
          marginBottom: showUrls ? 12 : 8,
        }}
      >
        {folderItems.map((folderItem, index) => {
          const visibleInStack = index < visibleStackCount;
          const y = expanded ? index * (itemHeight + expandedGap) : Math.min(index, 2) * stackOffset;
          const scale = expanded ? 1 : 1 - Math.min(index, 2) * 0.035;
          const transitionDelay = expanded
            ? `${index * 45}ms`
            : `${Math.max(folderItems.length - index - 1, 0) * 20}ms`;

          return (
            <div
              className={cn(
                'absolute inset-x-0 rounded-lg bg-card p-2 text-card-foreground shadow-sm ring-1 ring-foreground/10 transition-[opacity,transform] duration-300 ease-out will-change-transform',
                !expanded && !visibleInStack && 'opacity-0 pointer-events-none',
              )}
              key={folderItem.id}
              style={{
                height: itemHeight,
                transform: `translateY(${y}px) scale(${scale})`,
                transitionDelay,
                zIndex: expanded
                  ? folderItems.length - index
                  : visibleStackCount - Math.min(index, 2),
              }}
            >
              {expanded ? (
                <ResourceOpenButton
                  item={folderItem}
                  onOpen={onOpen}
                  showUrls={showUrls}
                />
              ) : index === 0 ? (
                <BookmarkCollapsedRow
                  item={folderItem}
                  onOpenAll={async () => {
                    await Promise.all(folderItems.map((bookmark) => openUrl(bookmark.url)));
                  }}
                  showUrls={showUrls}
                />
              ) : (
                <TabDisplayRow item={folderItem} showUrls={showUrls} />
              )}
              {expanded && index < folderItems.length - 1 && (
                <Separator className="absolute right-2 bottom-[-5px] left-2" />
              )}
            </div>
          );
        })}
        {!expanded && folderItems.length > 3 && (
          <span className="absolute right-2 bottom-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            +{folderItems.length - 3}
          </span>
        )}
        {expanded && (
          <Button
            aria-label={t('collapseFolder', { name: folderTitle })}
            className="absolute right-0 bottom-0 rounded-full"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded(false);
            }}
            size="icon-xs"
            type="button"
            variant="secondary"
          >
            <ChevronUpIcon />
          </Button>
        )}
      </div>
    </div>
    </BookmarkContextMenu>
  );
}

function BookmarkCollapsedRow({
  item,
  onOpenAll,
  showUrls,
}: {
  item: BookmarkSummary;
  onOpenAll: () => Promise<void>;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <TabDisplayRow item={item} showUrls={showUrls} />
      <Button
        aria-label={t('open')}
        className="rounded-full"
        onClick={(event) => {
          event.stopPropagation();
          void onOpenAll();
        }}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <ExternalLinkIcon />
      </Button>
    </div>
  );
}

interface WallpaperSettingsValue {
  url: string;
  kind: WallpaperKind;
  brightness: number;
  blur: number;
  locked: boolean;
}

function WallpaperSettingsDialog({
  onConfirm,
  value,
}: {
  onConfirm: (value: WallpaperSettingsValue) => void;
  value: WallpaperSettingsValue;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(open);
  const form = useForm({
    defaultValues: normalizeWallpaperSettingsValue(value),
    onSubmit: async ({ value: submittedValue }) => {
      const submittedUrl = submittedValue.url.trim() || createRandomBackgroundUrl();
      const normalizedValue = normalizeWallpaperSettingsValue(submittedValue);
      onConfirm({
        ...normalizedValue,
        url: normalizedValue.locked ? normalizeStableWallpaperUrl(submittedUrl) : submittedUrl,
      });
      setOpen(false);
    },
  });

  useEffect(() => {
    if (open && !wasOpen.current) form.reset(normalizeWallpaperSettingsValue(value));
    wasOpen.current = open;
  }, [form, open, value]);

  function handleUpload(
    event: ChangeEvent<HTMLInputElement>,
    onUpload: (value: string) => void,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      onUpload(result);
    });
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost">
          {t('theme')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('themeSettings')}</DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-6"
          id="wallpaper-settings-form"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="url"
              children={(field) => (
                <Field className="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <FieldLabel htmlFor={field.name}>{t('wallpaperAddress')}</FieldLabel>
                  <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <Input
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      value={field.state.value}
                    />
                    <Button asChild aria-label={t('uploadWallpaper')} type="button" variant="outline">
                      <label>
                        {t('upload')}
                        <Input
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => handleUpload(event, field.handleChange)}
                          type="file"
                        />
                      </label>
                    </Button>
                    <form.Subscribe
                      selector={(state) => state.values.locked}
                      children={(locked) => (
                        <Button
                          aria-label={t('refreshWallpaper')}
                          disabled={locked}
                          onClick={() => {
                            field.handleChange(createRandomBackgroundUrl());
                            form.setFieldValue('kind', 'static');
                          }}
                          type="button"
                          variant="outline"
                        >
                          <RotateCcwIcon />
                        </Button>
                      )}
                    />
                  </div>
                </Field>
              )}
            />

            <form.Field
              name="locked"
              children={(field) => (
                <Field className="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <FieldLabel htmlFor={field.name}>{t('wallpaperLock')}</FieldLabel>
                  <Field orientation="horizontal">
                    <Switch
                      checked={field.state.value}
                      id={field.name}
                      onBlur={field.handleBlur}
                      onCheckedChange={field.handleChange}
                    />
                    <FieldDescription>{t('wallpaperLockedHelp')}</FieldDescription>
                  </Field>
                </Field>
              )}
            />

            <form.Field
              name="brightness"
              children={(field) => (
                <Field className="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_4rem]">
                  <FieldLabel>{t('wallpaperBrightness')}</FieldLabel>
                  <Slider
                    max={100}
                    min={0}
                    onBlur={field.handleBlur}
                    onValueChange={(nextValue) => field.handleChange(nextValue[0] ?? 0)}
                    value={[field.state.value]}
                  />
                  <FieldDescription className="text-right">{field.state.value}%</FieldDescription>
                </Field>
              )}
            />

            <form.Field
              name="blur"
              children={(field) => (
                <Field className="grid items-center gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_4rem]">
                  <FieldLabel>{t('wallpaperBlur')}</FieldLabel>
                  <Slider
                    max={100}
                    min={0}
                    onBlur={field.handleBlur}
                    onValueChange={(nextValue) => field.handleChange(readPercent(nextValue[0] ?? 0, 0, 100))}
                    value={[readPercent(field.state.value, 0, 100)]}
                  />
                  <FieldDescription className="text-right">
                    {readPercent(field.state.value, 0, 100)}%
                  </FieldDescription>
                </Field>
              )}
            />

            <form.Subscribe
              selector={(state) => [
                state.values.url,
                state.values.brightness,
                state.values.blur,
              ] as const}
              children={([url, brightness, blur]) => (
                <Field className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <FieldLabel>{t('previewWallpaper')}</FieldLabel>
                  {url ? (
                    <img
                      alt={t('previewWallpaper')}
                      className="aspect-video w-full max-w-xl rounded-md border object-cover"
                      src={url}
                      style={{
                        filter: `brightness(${brightness}%) blur(${getWallpaperBlurPx(blur)}px)`,
                      }}
                    />
                  ) : (
                    <FieldDescription>{t('noWallpaper')}</FieldDescription>
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button form="wallpaper-settings-form" type="submit">
            {t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppMenuHoverCard({
  autoGroupBrowsing,
  inPageNavigation,
  pageTitle,
  pinTopMenu,
  randomBackground,
  setAutoGroupBrowsing,
  setInPageNavigation,
  setPageTitle,
  setPinTopMenu,
  setRandomBackground,
  setShowClockLogo,
  setShowBookmarksColumn,
  setShowBrowsingColumn,
  setShowSearchBox,
  setShowSnapshotsColumn,
  setShowUrls,
  setSimpleMode,
  setTopHeight,
  showBookmarksColumn,
  showBrowsingColumn,
  showClockLogo,
  showSearchBox,
  showSnapshotsColumn,
  showUrls,
  simpleMode,
  topHeight,
}: {
  autoGroupBrowsing: boolean;
  inPageNavigation: boolean;
  pageTitle: string;
  pinTopMenu: boolean;
  randomBackground: boolean;
  setAutoGroupBrowsing: (value: boolean) => void;
  setInPageNavigation: (value: boolean) => void;
  setPageTitle: (value: string) => void;
  setPinTopMenu: (value: boolean) => void;
  setRandomBackground: (value: boolean) => void;
  setShowClockLogo: (value: boolean) => void;
  setShowBookmarksColumn: (value: boolean) => void;
  setShowBrowsingColumn: (value: boolean) => void;
  setShowSearchBox: (value: boolean) => void;
  setShowSnapshotsColumn: (value: boolean) => void;
  setShowUrls: (value: boolean) => void;
  setSimpleMode: (value: boolean) => void;
  setTopHeight: (value: number) => void;
  showBookmarksColumn: boolean;
  showBrowsingColumn: boolean;
  showClockLogo: boolean;
  showSearchBox: boolean;
  showSnapshotsColumn: boolean;
  showUrls: boolean;
  simpleMode: boolean;
  topHeight: number;
}) {
  const { t } = useI18n();
  function resetTitle() {
    setPageTitle(DEFAULT_PAGE_TITLE);
  }

  function resetTopHeight() {
    setTopHeight(DEFAULT_TOP_HEIGHT);
  }

  return (
    <HoverCard closeDelay={180} openDelay={80}>
      <HoverCardTrigger asChild>
        <Button
          aria-label={t('appMenu')}
          className="text-primary-foreground hover:bg-background/15 hover:text-primary-foreground"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Grid2X2Icon />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="end"
        className="w-96 text-foreground"
        sideOffset={10}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)_auto] overflow-hidden rounded-lg border bg-background">
              <div className="flex items-center border-r px-2 text-sm font-medium">
                {t('pageTitle')}
              </div>
              <Input
                aria-label={t('pageTitle')}
                className="rounded-none border-0 shadow-none ring-0 focus-visible:ring-0"
                onChange={(event) => setPageTitle(event.target.value)}
                value={pageTitle}
              />
              <Button
                aria-label={t('clearPageTitle')}
                className="self-center justify-self-center rounded-full"
                disabled={!pageTitle}
                onClick={() => setPageTitle('')}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <XIcon />
              </Button>
            </div>
            <Button
              aria-label={t('resetPageTitle')}
              className="border bg-background"
              onClick={resetTitle}
              size="icon"
              type="button"
              variant="outline"
            >
              <RotateCcwIcon />
            </Button>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)_4rem] overflow-hidden rounded-lg border bg-background">
              <div className="flex items-center border-r px-2 text-sm font-medium">
                {t('topHeight')}
              </div>
              <Input
                aria-label={t('topHeight')}
                className="rounded-none border-0 shadow-none ring-0 focus-visible:ring-0"
                min={0}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setTopHeight(Number.isFinite(nextValue) ? nextValue : 0);
                }}
                type="number"
                value={topHeight}
              />
              <div className="flex items-center justify-center border-l text-sm font-medium">
                px
              </div>
            </div>
            <Button
              aria-label={t('resetTopHeight')}
              className="border bg-background"
              onClick={resetTopHeight}
              size="icon"
              type="button"
              variant="outline"
            >
              <RotateCcwIcon />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SettingsSwitch
              checked={simpleMode}
              label={t('simpleMode')}
              onCheckedChange={setSimpleMode}
            />
            <SettingsSwitch
              checked={inPageNavigation}
              label={t('pageJump')}
              onCheckedChange={setInPageNavigation}
            />
            <SettingsSwitch
              checked={showClockLogo}
              label={t('showClockLogo')}
              onCheckedChange={setShowClockLogo}
            />
            <SettingsSwitch
              checked={showSearchBox}
              label={t('showSearchBox')}
              onCheckedChange={setShowSearchBox}
            />
            <SettingsSwitch
              checked={pinTopMenu}
              label={t('showTopMenu')}
              onCheckedChange={setPinTopMenu}
            />
            <SettingsSwitch
              checked={randomBackground}
              label={t('randomBackground')}
              onCheckedChange={setRandomBackground}
            />
            <SettingsSwitch
              checked={showUrls}
              label={t('showUrl')}
              onCheckedChange={setShowUrls}
            />
            <SettingsSwitch
              checked={autoGroupBrowsing}
              label={t('autoGroup')}
              onCheckedChange={setAutoGroupBrowsing}
            />
            <SettingsSwitch
              checked={showBookmarksColumn}
              label={t('bookmarks')}
              onCheckedChange={setShowBookmarksColumn}
            />
            <SettingsSwitch
              checked={showBrowsingColumn}
              label={t('browsing')}
              onCheckedChange={setShowBrowsingColumn}
            />
            <SettingsSwitch
              checked={showSnapshotsColumn}
              label={t('historySnapshots')}
              onCheckedChange={setShowSnapshotsColumn}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <Separator />
            <Separator />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function SettingsSwitch({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch
        aria-label={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

function CardViewToggle({
  mode,
  setMode,
}: {
  mode: CardViewMode;
  setMode: (mode: CardViewMode) => void;
}) {
  const { t } = useI18n();
  const nextMode = mode === 'card' ? 'icon' : 'card';
  const label = mode === 'card' ? t('iconView') : t('cardView');

  return (
    <Button
      aria-label={label}
      className="rounded-full bg-background/20 text-primary-foreground hover:bg-background/30 hover:text-primary-foreground"
      onClick={() => setMode(nextMode)}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      {mode === 'card' ? <SmartphoneIcon /> : <ListIcon />}
    </Button>
  );
}

function IconGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] items-start gap-x-3 gap-y-4">
      {children}
    </div>
  );
}

function IconGridCard({
  count,
  hoverContent,
  item,
  menu,
  onDelete,
  onOpen,
  title,
  variant = 'delete',
}: {
  count?: number;
  hoverContent?: ReactNode;
  item?: BookmarkSummary | SnapshotTabEntry | TabSummary;
  menu?: ReactNode;
  onDelete?: () => Promise<void>;
  onOpen: () => Promise<void>;
  title?: string;
  variant?: 'close' | 'delete';
}) {
  const { t } = useI18n();
  const displayTitle = title || item?.title || item?.url || t('unnamed');
  const card = (
    <div className="group/icon relative min-w-0">
      <button
        className="flex w-full min-w-0 flex-col items-center gap-1.5 rounded-lg p-1.5 text-center transition-colors hover:bg-background/15"
        onClick={() => void onOpen()}
        title={displayTitle}
        type="button"
      >
        <span className="relative flex size-12 items-center justify-center rounded-xl bg-card/90 text-card-foreground shadow-sm ring-1 ring-foreground/10 backdrop-blur">
          {item ? <SiteMark item={item} size="lg" /> : <LinkIcon className="size-5 text-muted-foreground" />}
          {count && count > 1 && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 text-[10px]" variant="secondary">
              {count}
            </Badge>
          )}
        </span>
        <span className="w-full truncate text-xs leading-4 font-medium text-primary-foreground" title={displayTitle}>
          {displayTitle}
        </span>
      </button>
      {onDelete && (
        <button
          aria-label={`${variant === 'close' ? t('close') : t('delete')} ${displayTitle}`}
          className="absolute top-0 right-0 opacity-0 transition-opacity group-hover/icon:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            void onDelete();
          }}
          type="button"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm ring-1 ring-destructive/20">
            {variant === 'close' ? <XIcon className="size-3" /> : <Trash2Icon className="size-3" />}
          </span>
        </button>
      )}
    </div>
  );

  if (hoverContent && menu) {
    return (
      <ContextMenu>
        <HoverCard closeDelay={160} openDelay={120}>
          <ContextMenuTrigger asChild>
            <HoverCardTrigger asChild>{card}</HoverCardTrigger>
          </ContextMenuTrigger>
          <HoverCardContent align="start" className="w-80 p-3 text-foreground" sideOffset={8}>
            {hoverContent}
          </HoverCardContent>
        </HoverCard>
        {menu}
      </ContextMenu>
    );
  }

  const cardWithMenu = menu ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
      {menu}
    </ContextMenu>
  ) : card;

  if (!hoverContent) return cardWithMenu;

  return (
    <HoverCard closeDelay={160} openDelay={120}>
      <HoverCardTrigger asChild>{cardWithMenu}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-80 p-3 text-foreground" sideOffset={8}>
        {hoverContent}
      </HoverCardContent>
    </HoverCard>
  );
}

function IconHoverPanel({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="truncate text-sm font-semibold" title={title}>
          {title}
        </h3>
        {action}
      </div>
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
        {children}
      </div>
    </div>
  );
}

function TabDisplayRow({
  item,
  showUrls,
}: {
  item: BookmarkSummary | SnapshotTabEntry | TabSummary;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] items-center gap-3 text-left">
      <SiteMark item={item} />
      <span className={cn('flex min-w-0 flex-col', showUrls && 'gap-0.5')}>
        <strong className="truncate text-base leading-tight font-semibold" title={item.title || t('unnamedTab')}>
          {item.title || t('unnamedTab')}
        </strong>
        {showUrls && (
          <span className="truncate text-sm text-muted-foreground" title={item.url}>{item.url}</span>
        )}
      </span>
    </div>
  );
}

function ResourceCard({
  compact,
  grouped,
  item,
  meta,
  onClose,
  onOpen,
  secondaryItem,
  showUrls,
  showClose,
}: {
  compact: boolean;
  grouped: boolean;
  item: BookmarkSummary | TabSummary;
  meta?: string;
  onClose?: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  onOpen: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  secondaryItem?: TabSummary;
  showUrls: boolean;
  showClose: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card
      className={cn(
        'relative bg-card/90 text-card-foreground shadow-md backdrop-blur',
        showUrls ? 'min-h-16' : 'min-h-12',
        grouped && (showUrls ? 'min-h-32' : 'min-h-24'),
      )}
      size="sm"
    >
      <CardContent className={cn('flex min-w-0 flex-col px-3', showUrls ? 'gap-3' : 'gap-2')}>
        <ResourceOpenButton
          item={item}
          onClose={showClose ? onClose : undefined}
          onOpen={onOpen}
          showUrls={showUrls}
        />
        {grouped && (
          <ResourceOpenButton
            item={secondaryItem ?? item}
            onClose={showClose ? onClose : undefined}
            onOpen={onOpen}
            showUrls={showUrls}
          />
        )}
        {!compact && meta && (
          <Badge className="max-w-[178px] justify-start truncate" title={meta} variant="outline">
            {meta}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function ResourceOpenButton({
  item,
  onClose,
  onOpen,
  showUrls,
}: {
  item: BookmarkSummary | TabSummary;
  onClose?: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  onOpen: (url: string, item: BookmarkSummary | TabSummary) => Promise<void>;
  showUrls: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
      <button
        className="grid min-w-0 grid-cols-[1rem_minmax(0,1fr)] items-center gap-3 text-left"
        onClick={(event) => {
          event.stopPropagation();
          void onOpen(item.url, item);
        }}
        type="button"
      >
        <SiteMark item={item} />
        <span className={cn('flex min-w-0 flex-col', showUrls && 'gap-0.5')}>
          <strong className="truncate text-base leading-tight font-semibold" title={item.title || t('unnamedTab')}>
            {item.title || t('unnamedTab')}
          </strong>
          {showUrls && (
            <span className="truncate text-sm text-muted-foreground" title={item.url}>{item.url}</span>
          )}
        </span>
      </button>
      {onClose && (
        <Button
          aria-label={`${t('close')} ${item.title || item.url}`}
          className="rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            void onClose(item.url, item);
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <XIcon />
        </Button>
      )}
    </div>
  );
}

function SiteMark({
  item,
  size = 'sm',
}: {
  item: BookmarkSummary | SnapshotTabEntry | TabSummary;
  size?: 'sm' | 'lg';
}) {
  const faviconCandidates = useMemo(() => getFaviconCandidates(item), [item]);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const fallback = getFallbackLabel(item.title || item.url);
  const faviconUrl = faviconCandidates[candidateIndex];
  const markClassName = size === 'lg' ? 'size-4' : 'size-4';

  useEffect(() => {
    setCandidateIndex(0);
  }, [faviconCandidates]);

  if (faviconUrl) {
    return (
      <img
        alt=""
        className={cn(markClassName, 'shrink-0 object-contain')}
        onError={() => setCandidateIndex((current) => current + 1)}
        src={faviconUrl}
      />
    );
  }

  return (
    <span className={cn('flex shrink-0 items-center justify-center font-medium', markClassName, size === 'lg' ? 'text-sm' : 'text-xs')}>
      {fallback || <LinkIcon />}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  loading,
  title,
}: {
  icon: LucideIcon;
  loading: boolean;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <Empty className="mt-3 min-h-24 border bg-card/70 text-card-foreground shadow-sm backdrop-blur">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {!loading && <EmptyDescription>{t('syncAfterRefresh')}</EmptyDescription>}
      </EmptyHeader>
    </Empty>
  );
}

function buildBrowsingCards(items: TabSummary[], autoGroupByDomain: boolean): BrowsingCardItem[] {
  const singleCards: { position: number; item: BrowsingCardItem }[] = [];
  const groupCards: { firstPosition: number; item: BrowsingCardItem }[] = [];
  const groupedTabs = new Map<number, { firstPosition: number; tabs: TabSummary[] }>();
  const ungroupedTabs: { position: number; tab: TabSummary }[] = [];

  items.forEach((tab, position) => {
    if (typeof tab.groupId === 'number' && tab.groupId >= 0) {
      const currentGroup = groupedTabs.get(tab.groupId);
      groupedTabs.set(tab.groupId, {
        firstPosition: currentGroup?.firstPosition ?? position,
        tabs: [...(currentGroup?.tabs ?? []), tab],
      });
      return;
    }

    ungroupedTabs.push({ position, tab });
  });

  for (const [groupId, group] of groupedTabs) {
    const orderedTabs = group.tabs.slice().sort((a, b) => a.index - b.index);
    groupCards.push({
      firstPosition: group.firstPosition,
      item: {
        id: `group-${groupId}`,
        groupTitle: orderedTabs[0]?.groupTitle || '',
        tabs: orderedTabs,
      },
    });
  }

  if (!autoGroupByDomain) {
    for (const { position, tab } of ungroupedTabs) {
      singleCards.push({
        position,
        item: {
          id: getTabCardId(tab),
          tabs: [tab],
        },
      });
    }

    return [
      ...singleCards.sort((a, b) => a.position - b.position).map((bucket) => bucket.item),
      ...groupCards.sort((a, b) => a.firstPosition - b.firstPosition).map((bucket) => bucket.item),
    ];
  }

  const domainGroups = new Map<string, { firstPosition: number; tabs: TabSummary[] }>();
  const singleTabs: { position: number; tab: TabSummary }[] = [];

  for (const { position, tab } of ungroupedTabs) {
    const domain = getDomain(tab.url);

    if (!domain) {
      singleTabs.push({ position, tab });
      continue;
    }

    const currentGroup = domainGroups.get(domain);
    domainGroups.set(domain, {
      firstPosition: currentGroup?.firstPosition ?? position,
      tabs: [...(currentGroup?.tabs ?? []), tab],
    });
  }

  for (const [domain, group] of domainGroups) {
    if (group.tabs.length < 2) {
      singleTabs.push({ position: group.firstPosition, tab: group.tabs[0] });
      continue;
    }

    groupCards.push({
      firstPosition: group.firstPosition,
      item: {
        id: `domain-${domain}`,
        groupTitle: domain,
        tabs: group.tabs,
      },
    });
  }

  for (const { position, tab } of singleTabs) {
    singleCards.push({
      position,
      item: {
        id: getTabCardId(tab),
        tabs: [tab],
      },
    });
  }

  return [
    ...singleCards.sort((a, b) => a.position - b.position).map((bucket) => bucket.item),
    ...groupCards.sort((a, b) => a.firstPosition - b.firstPosition).map((bucket) => bucket.item),
  ];
}

function getTabCardId(tab: TabSummary) {
  return `tab-${tab.windowId ?? 'window'}-${tab.id ?? tab.url}`;
}

function getTabSelectionKey(tab: TabSummary, index: number) {
  return `${tab.windowId ?? 'window'}-${tab.id ?? tab.url}-${index}`;
}

function getGroupDisplayTitle(title: string | undefined, t: Translate) {
  const normalizedTitle = title?.trim();
  if (!normalizedTitle) return t('unnamedGroup');

  const domain = getDomain(normalizedTitle);
  return domain || normalizedTitle.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

function hydrateBookmarkFavicons(bookmarks: BookmarkSummary[], tabs: TabSummary[]) {
  const exactFavicons = new Map<string, string>();
  const domainFavicons = new Map<string, string>();

  for (const tab of tabs) {
    if (!tab.favIconUrl) continue;

    exactFavicons.set(normalizeUrl(tab.url), tab.favIconUrl);

    const domain = getDomain(tab.url);
    if (domain && !domainFavicons.has(domain)) {
      domainFavicons.set(domain, tab.favIconUrl);
    }
  }

  function hydrate(bookmark: BookmarkSummary): BookmarkSummary {
    const exactFavicon = exactFavicons.get(normalizeUrl(bookmark.url));
    const domainFavicon = domainFavicons.get(getDomain(bookmark.url));
    const favIconUrl = bookmark.favIconUrl ?? exactFavicon ?? domainFavicon;

    return {
      ...bookmark,
      ...(favIconUrl ? { favIconUrl } : {}),
      children: bookmark.children?.map(hydrate),
    };
  }

  return bookmarks.map(hydrate);
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

function isTabsChangedMessage(message: unknown): message is { type: 'linka:tabs-changed' } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    message.type === 'linka:tabs-changed'
  );
}

function isTabSummary(item: BookmarkSummary | TabSummary): item is TabSummary {
  return typeof item.id === 'number';
}

async function openSnapshotTabs(snapshot: WorkspaceSnapshot) {
  await restoreSnapshot(snapshot);
}

function formatSnapshotSavedAt(value: string, locale: Locale = DEFAULT_LOCALE) {
  const savedAt = new Date(value);

  if (Number.isNaN(savedAt.getTime())) {
    return MESSAGES[locale].unknownTime;
  }

  return savedAt.toLocaleString(locale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getFaviconCandidates(item: BookmarkSummary | SnapshotTabEntry | TabSummary) {
  const candidates: string[] = [];

  if ('favIconUrl' in item && item.favIconUrl) {
    candidates.push(item.favIconUrl);
  }

  try {
    const pageUrl = new URL(item.url);
    if (window.location.protocol === 'chrome-extension:') {
      candidates.push(buildChromeFaviconUrl(item.url));
      candidates.push(buildChromeFaviconUrl(pageUrl.origin));
    } else {
      candidates.push(`${pageUrl.origin}/favicon.ico`);
    }
  } catch {
    // Ignore invalid URLs and use fallback text.
  }

  return Array.from(new Set(candidates));
}

function buildChromeFaviconUrl(pageUrl: string) {
  const faviconPath = `/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=32`;
  return `${window.location.origin}${faviconPath}`;
}

function getFallbackLabel(value: string) {
  const normalized = value.trim();
  return normalized ? normalized.slice(0, 1).toUpperCase() : '';
}

function getCardViewItemLimit(
  viewMode: CardViewMode,
  cardLimit: number,
  visibleColumnCount: number,
) {
  if (viewMode === 'card') return cardLimit;

  const columnCount = Math.max(visibleColumnCount, 1);
  const maxWorkspaceWidthRem = 112;
  const workspaceColumnGapRem = 2;
  const iconCellMinWidthRem = 4.75;
  const iconColumnGapRem = 0.75;
  const estimatedColumnWidthRem =
    (maxWorkspaceWidthRem - Math.max(columnCount - 1, 0) * workspaceColumnGapRem) / columnCount;
  const iconsPerRow = Math.max(
    3,
    Math.floor((estimatedColumnWidthRem + iconColumnGapRem) / (iconCellMinWidthRem + iconColumnGapRem)),
  );

  return Math.min(Math.max(iconsPerRow * 4, cardLimit), 48);
}

function readStoredNewtabSettings(): NewtabSettings {
  if (typeof window === 'undefined') return createDefaultNewtabSettings();

  try {
    const storedSettings = window.localStorage.getItem(NEWTAB_SETTINGS_STORAGE_KEY);
    if (!storedSettings) return createDefaultNewtabSettings();

    const parsedSettings = JSON.parse(storedSettings) as StoredNewtabSettings;
    const defaultSettings = createDefaultNewtabSettings();
    const storedWallpaperLocked =
      typeof parsedSettings.wallpaperLocked === 'boolean'
        ? parsedSettings.wallpaperLocked
        : defaultSettings.wallpaperLocked;
    const storedWallpaperUrl =
      typeof parsedSettings.wallpaperUrl === 'string' && parsedSettings.wallpaperUrl.trim()
        ? parsedSettings.wallpaperUrl
        : defaultSettings.wallpaperUrl;
    const wallpaperUrl = storedWallpaperLocked
      ? normalizeStableWallpaperUrl(storedWallpaperUrl)
      : createRandomBackgroundUrl();

    const searchEngines = normalizeSearchEngines(parsedSettings.searchEngines);
    const enabledSearchEngines = searchEngines.filter((engine) => engine.enabled);
    const searchEngineId =
      isSearchEngineId(parsedSettings.searchEngineId, enabledSearchEngines)
        ? parsedSettings.searchEngineId
        : enabledSearchEngines[0]?.id ?? defaultSettings.searchEngineId;

    return {
      locale: readLocale(parsedSettings.locale, defaultSettings.locale),
      searchEngineId,
      searchEngines,
      pageTitle:
        typeof parsedSettings.pageTitle === 'string'
          ? parsedSettings.pageTitle
          : defaultSettings.pageTitle,
      topHeight:
        typeof parsedSettings.topHeight === 'number' && Number.isFinite(parsedSettings.topHeight)
          ? parsedSettings.topHeight
          : defaultSettings.topHeight,
      simpleMode:
        typeof parsedSettings.simpleMode === 'boolean'
          ? parsedSettings.simpleMode
          : defaultSettings.simpleMode,
      inPageNavigation:
        typeof parsedSettings.inPageNavigation === 'boolean'
          ? parsedSettings.inPageNavigation
          : defaultSettings.inPageNavigation,
      showClockLogo:
        typeof parsedSettings.showClockLogo === 'boolean'
          ? parsedSettings.showClockLogo
          : defaultSettings.showClockLogo,
      showSearchBox:
        typeof parsedSettings.showSearchBox === 'boolean'
          ? parsedSettings.showSearchBox
          : defaultSettings.showSearchBox,
      pinTopMenu:
        typeof parsedSettings.pinTopMenu === 'boolean'
          ? parsedSettings.pinTopMenu
          : defaultSettings.pinTopMenu,
      randomBackground:
        typeof parsedSettings.randomBackground === 'boolean'
          ? parsedSettings.randomBackground
          : defaultSettings.randomBackground,
      wallpaperUrl,
      wallpaperKind: readWallpaperKind(parsedSettings.wallpaperKind, defaultSettings.wallpaperKind),
      wallpaperBrightness: readPercent(
        parsedSettings.wallpaperBrightness,
        defaultSettings.wallpaperBrightness,
        100,
      ),
      wallpaperBlur: readPercent(
        parsedSettings.wallpaperBlur,
        defaultSettings.wallpaperBlur,
        100,
      ),
      wallpaperLocked: storedWallpaperLocked,
      showUrls:
        typeof parsedSettings.showUrls === 'boolean'
          ? parsedSettings.showUrls
          : defaultSettings.showUrls,
      autoGroupBrowsing:
        typeof parsedSettings.autoGroupBrowsing === 'boolean'
          ? parsedSettings.autoGroupBrowsing
          : defaultSettings.autoGroupBrowsing,
      showBookmarksColumn:
        typeof parsedSettings.showBookmarksColumn === 'boolean'
          ? parsedSettings.showBookmarksColumn
          : defaultSettings.showBookmarksColumn,
      showBrowsingColumn:
        typeof parsedSettings.showBrowsingColumn === 'boolean'
          ? parsedSettings.showBrowsingColumn
          : defaultSettings.showBrowsingColumn,
      showSnapshotsColumn:
        typeof parsedSettings.showSnapshotsColumn === 'boolean'
          ? parsedSettings.showSnapshotsColumn
          : defaultSettings.showSnapshotsColumn,
      bookmarksViewMode: readCardViewMode(
        parsedSettings.bookmarksViewMode,
        readCardViewMode(parsedSettings.cardViewMode, defaultSettings.bookmarksViewMode),
      ),
      browsingViewMode: readCardViewMode(
        parsedSettings.browsingViewMode,
        readCardViewMode(parsedSettings.cardViewMode, defaultSettings.browsingViewMode),
      ),
      snapshotsViewMode: readCardViewMode(
        parsedSettings.snapshotsViewMode,
        readCardViewMode(parsedSettings.cardViewMode, defaultSettings.snapshotsViewMode),
      ),
    };
  } catch {
    return createDefaultNewtabSettings();
  }
}

function writeStoredNewtabSettings(settings: NewtabSettings) {
  try {
    window.localStorage.setItem(NEWTAB_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
}

function createRandomBackgroundUrl() {
  return `https://picsum.photos/seed/${createWallpaperSeed()}/1920/1080`;
}

function createWallpaperSeed() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
    image.src = url;
  });
}

function normalizeWallpaperSettingsValue(value: WallpaperSettingsValue): WallpaperSettingsValue {
  return {
    ...value,
    brightness: readPercent(value.brightness, DEFAULT_NEWTAB_SETTINGS.wallpaperBrightness, 100),
    blur: readPercent(value.blur, DEFAULT_NEWTAB_SETTINGS.wallpaperBlur, 100),
  };
}

function getWallpaperBlurPx(blurPercent: number) {
  return (readPercent(blurPercent, DEFAULT_NEWTAB_SETTINGS.wallpaperBlur, 100) / 100) * WALLPAPER_BLUR_MAX_PX;
}

function normalizeStableWallpaperUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname === 'picsum.photos' &&
      parsedUrl.pathname === '/1920/1080' &&
      parsedUrl.searchParams.has('random')
    ) {
      return `https://picsum.photos/seed/${encodeURIComponent(
        parsedUrl.searchParams.get('random') || createWallpaperSeed(),
      )}/1920/1080`;
    }
  } catch {
    // Keep custom or invalid user-entered values untouched.
  }

  return url;
}

function createDefaultNewtabSettings(): NewtabSettings {
  return {
    ...DEFAULT_NEWTAB_SETTINGS,
    searchEngines: DEFAULT_SEARCH_ENGINES.map((engine) => ({ ...engine })),
    wallpaperUrl: createRandomBackgroundUrl(),
  };
}

function readLocale(value: unknown, fallback: Locale): Locale {
  return value === 'zh-CN' || value === 'en-US' ? value : fallback;
}

function isSearchEngineId(
  value: unknown,
  engines: SearchEngineConfig[] = DEFAULT_SEARCH_ENGINES,
): value is SearchEngineId {
  return typeof value === 'string' && engines.some((engine) => engine.id === value);
}

function normalizeSearchEngines(value: unknown): SearchEngineConfig[] {
  if (!Array.isArray(value)) return DEFAULT_SEARCH_ENGINES.map((engine) => ({ ...engine }));

  const engines = value
    .map((engine, index): SearchEngineConfig | null => {
      if (!engine || typeof engine !== 'object') return null;

      const candidate = engine as Partial<SearchEngineConfig>;
      const id =
        typeof candidate.id === 'string' && candidate.id.trim()
          ? candidate.id.trim()
          : `search-engine-${index + 1}`;
      const label =
        typeof candidate.label === 'string' && candidate.label.trim()
          ? candidate.label
          : MESSAGES[DEFAULT_LOCALE].custom;
      const searchUrl =
        typeof candidate.searchUrl === 'string'
          ? candidate.searchUrl
          : '';
      const logo =
        typeof candidate.logo === 'string'
          ? candidate.logo
          : '';

      return {
        id,
        label,
        logo,
        searchUrl,
        enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : true,
      };
    })
    .filter((engine): engine is SearchEngineConfig => Boolean(engine));

  if (engines.length === 0) {
    return DEFAULT_SEARCH_ENGINES.map((engine) => ({ ...engine }));
  }

  if (!engines.some((engine) => engine.enabled)) {
    return engines.map((engine, index) => ({ ...engine, enabled: index === 0 }));
  }

  return engines;
}

function buildSearchUrl(engine: SearchEngineConfig, query: string) {
  const searchUrl = engine.searchUrl.trim();

  if (!searchUrl) {
    return `${DEFAULT_SEARCH_ENGINES[0].searchUrl}${encodeURIComponent(query)}`;
  }

  return `${searchUrl}${encodeURIComponent(query)}`;
}

function createSearchEngineId(engines: SearchEngineConfig[]) {
  const existingIds = new Set(engines.map((engine) => engine.id));
  let index = engines.length + 1;
  let id = `custom-${index}`;

  while (existingIds.has(id)) {
    index += 1;
    id = `custom-${index}`;
  }

  return id;
}

function readCardViewMode(value: unknown, fallback: CardViewMode): CardViewMode {
  return value === 'icon' || value === 'card' ? value : fallback;
}

function readWallpaperKind(value: unknown, fallback: WallpaperKind): WallpaperKind {
  return value === 'static' || value === 'dynamic' || value === 'solid' ? value : fallback;
}

function readPercent(value: unknown, fallback: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 0), max);
}

export default App;
