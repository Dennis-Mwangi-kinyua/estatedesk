const LOCAL_SITE_URL = "http://localhost:3000";

function getSiteUrl() {
  return window.location.origin;
}

async function syncBadgeToExtension() {
  try {
    const response = await fetch("/api/pwa/badge-count", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (response.status === 401) {
      chrome.runtime.sendMessage({
        type: "BADGE_STATE",
        authenticated: false,
        unreadCount: 0,
        siteUrl: getSiteUrl(),
      });
      return;
    }

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    chrome.runtime.sendMessage({
      type: "BADGE_STATE",
      authenticated: true,
      unreadCount: Number(payload.count ?? 0),
      siteUrl: getSiteUrl(),
    });
  } catch {
    // Ignore transient network failures in the content script.
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "SYNC_BADGE_NOW") {
    void syncBadgeToExtension();
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    void syncBadgeToExtension();
  }
});

window.addEventListener("focus", () => {
  void syncBadgeToExtension();
});

void syncBadgeToExtension();