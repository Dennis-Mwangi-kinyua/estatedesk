import { DEFAULT_SITE_URL } from "./config.js";

const STORAGE_KEY = "estatedeskExtensionState";

const statusEl = document.getElementById("status");
const badgeEl = document.getElementById("badge");
const actionsEl = document.getElementById("actions");
const signedOutEl = document.getElementById("signed-out");

function setVisible(element, visible) {
  element.classList.toggle("hidden", !visible);
}

function renderState(state) {
  const unreadCount = Number(state.unreadCount ?? 0);

  if (state.authenticated) {
    statusEl.textContent =
      unreadCount > 0
        ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
        : "You are signed in. No unread notifications.";
    setVisible(actionsEl, true);
    setVisible(signedOutEl, false);

    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      setVisible(badgeEl, true);
    } else {
      setVisible(badgeEl, false);
    }

    return;
  }

  statusEl.textContent = "Sign in on EstateDesk to sync badges and quick actions.";
  setVisible(actionsEl, false);
  setVisible(signedOutEl, true);
  setVisible(badgeEl, false);
}

async function loadState() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  renderState(
    stored[STORAGE_KEY] ?? {
      authenticated: false,
      unreadCount: 0,
      siteUrl: DEFAULT_SITE_URL,
    },
  );
}

function bindButtons() {
  document.querySelectorAll("[data-path]").forEach((button) => {
    button.addEventListener("click", async () => {
      const path = button.getAttribute("data-path") || "/dashboard";
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      const siteUrl = stored[STORAGE_KEY]?.siteUrl || DEFAULT_SITE_URL;

      await chrome.runtime.sendMessage({
        type: "OPEN_PATH",
        path,
        siteUrl,
      });
      window.close();
    });
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes[STORAGE_KEY]) {
    return;
  }

  renderState(changes[STORAGE_KEY].newValue);
});

bindButtons();
void loadState();