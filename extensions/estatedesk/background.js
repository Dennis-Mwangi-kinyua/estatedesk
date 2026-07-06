import { DEFAULT_SITE_URL, LOCAL_SITE_URL } from "./config.js";

const BADGE_ALARM = "estatedesk-badge-sync";
const STORAGE_KEY = "estatedeskExtensionState";

async function getPreferredSiteUrl() {
  const stored = await chrome.storage.local.get(["siteUrl"]);
  return stored.siteUrl || DEFAULT_SITE_URL;
}

async function saveExtensionState(state) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      ...state,
      updatedAt: Date.now(),
    },
  });
}

async function readExtensionState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? {
    authenticated: false,
    unreadCount: 0,
    siteUrl: DEFAULT_SITE_URL,
    updatedAt: 0,
  };
}

function formatBadgeCount(count) {
  if (!count || count <= 0) {
    return "";
  }

  return count > 99 ? "99+" : String(count);
}

async function applyBadge(count) {
  const text = formatBadgeCount(count);
  await chrome.action.setBadgeText({ text });
  await chrome.action.setBadgeBackgroundColor({ color: "#0f766e" });
}

async function openPath(path, siteUrl = DEFAULT_SITE_URL) {
  const targetUrl = new URL(path, siteUrl).href;
  const tabs = await chrome.tabs.query({ url: `${siteUrl}/*` });

  if (tabs[0]?.id) {
    await chrome.tabs.update(tabs[0].id, { active: true, url: targetUrl });
    if (tabs[0].windowId) {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: targetUrl });
}

async function requestBadgeSyncFromOpenTabs() {
  const siteUrl = await getPreferredSiteUrl();
  const tabs = await chrome.tabs.query({ url: `${siteUrl}/*` });

  if (tabs.length === 0) {
    const localTabs = await chrome.tabs.query({ url: `${LOCAL_SITE_URL}/*` });
    await Promise.allSettled(
      localTabs
        .filter((tab) => typeof tab.id === "number")
        .map((tab) =>
          chrome.tabs.sendMessage(tab.id, { type: "SYNC_BADGE_NOW" }),
        ),
    );
    return;
  }

  await Promise.allSettled(
    tabs
      .filter((tab) => typeof tab.id === "number")
      .map((tab) => chrome.tabs.sendMessage(tab.id, { type: "SYNC_BADGE_NOW" })),
  );
}

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.alarms.create(BADGE_ALARM, { periodInMinutes: 5 });
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "estatedesk-open-dashboard",
    title: "Open EstateDesk dashboard",
    contexts: ["action"],
  });

  chrome.contextMenus.create({
    id: "estatedesk-report-issue",
    title: "Report issue to EstateDesk",
    contexts: ["selection", "link"],
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === BADGE_ALARM) {
    await requestBadgeSyncFromOpenTabs();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "BADGE_STATE") {
    void (async () => {
      await saveExtensionState({
        authenticated: Boolean(message.authenticated),
        unreadCount: Number(message.unreadCount ?? 0),
        siteUrl: message.siteUrl || DEFAULT_SITE_URL,
      });
      await applyBadge(Number(message.unreadCount ?? 0));
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message?.type === "OPEN_PATH") {
    void (async () => {
      await openPath(message.path || "/dashboard", message.siteUrl);
      sendResponse({ ok: true });
    })();
    return true;
  }

  return undefined;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const siteUrl = tab?.url?.startsWith(LOCAL_SITE_URL)
    ? LOCAL_SITE_URL
    : await getPreferredSiteUrl();

  if (info.menuItemId === "estatedesk-open-dashboard") {
    await openPath("/dashboard", siteUrl);
    return;
  }

  if (info.menuItemId === "estatedesk-report-issue") {
    const params = new URLSearchParams();
    const selection = info.selectionText?.trim();

    if (selection) {
      params.set("title", selection.slice(0, 120));
      params.set("text", selection.slice(0, 2000));
    }

    if (info.linkUrl) {
      params.set("url", info.linkUrl);
    }

    const query = params.size > 0 ? `?${params.toString()}` : "";
    await openPath(`/share${query}`, siteUrl);
  }
});

void readExtensionState().then((state) => applyBadge(state.unreadCount));