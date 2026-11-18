const { app, BrowserWindow, dialog, Menu, shell } = require("electron");
const { installPermissions } = require("./permissions.cjs");
const { appOrigin, trustedNavigation, externalUrl } = require("./policy.cjs");

app.enableSandbox();
const origin = appOrigin(app.isPackaged ? undefined : process.env.ESTATEDESK_DESKTOP_URL, app.isPackaged);
let window;
let checkForUpdates = () => {};

function createWindow() {
  window = new BrowserWindow({
    title: "EstateDesk", width: 1280, height: 850, minWidth: 360, minHeight: 600,
    backgroundColor: "#f3f6f3",
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, webviewTag: false, partition: "persist:estatedesk",
    },
  });
  const contents = window.webContents;
  const session = contents.session;
  let externalPrompt = false;
  const openExternal = async value => {
    const url = externalUrl(value);
    if (!url || externalPrompt || window.isDestroyed()) return;
    externalPrompt = true;
    try {
      const result = await dialog.showMessageBox(window, {
        type: "question", title: "Open in your browser?",
        message: `Open ${new URL(url).hostname} in your default browser?`,
        buttons: ["Cancel", "Open browser"], defaultId: 0, cancelId: 0,
      });
      if (result.response === 1) await shell.openExternal(url);
    } catch { /* A missing browser must not crash the workspace. */ }
    finally { externalPrompt = false; }
  };
  const revokePermissions = installPermissions(session, contents, window, origin, dialog);
  contents.on("did-navigate", (_event, url) => { if (new URL(url).pathname.startsWith("/login")) revokePermissions(); });
  contents.setWindowOpenHandler(({ url }) => {
    if (trustedNavigation(url, origin)) void contents.loadURL(url).catch(() => {});
    else void openExternal(url);
    return { action: "deny" };
  });
  for (const eventName of ["will-navigate", "will-redirect"]) {
    contents.on(eventName, (event, url) => {
      if (!trustedNavigation(url, origin)) { event.preventDefault(); void openExternal(url); }
    });
  }
  contents.on("will-attach-webview", event => event.preventDefault());
  contents.on("did-fail-load", async (_event, code, _description, _url, mainFrame) => {
    if (!mainFrame || code === -3 || window.isDestroyed()) return;
    const result = await dialog.showMessageBox(window, {
      type: "warning", title: "EstateDesk is unavailable",
      message: "Check your internet connection, then try again.", buttons: ["Retry", "Close"],
    });
    if (window.isDestroyed()) return;
    if (result.response === 0) void contents.loadURL(`${origin}/login?source=desktop`).catch(() => {});
    else window.close();
  });
  void contents.loadURL(`${origin}/login?source=desktop`).catch(() => {});
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => { if (window && !window.isDestroyed()) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
      { role: "fileMenu" }, { role: "editMenu" },
      { label: "View", submenu: [{ role: "reload" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "togglefullscreen" }] },
      { role: "windowMenu" },
      { label: "Help", submenu: [{ label: "Check for updates", click: () => { void checkForUpdates(); } }] },
    ]));
    createWindow();
    if (app.isPackaged && ["win32", "darwin"].includes(process.platform)) {
      const { autoUpdater } = require("electron-updater");
      const { installUpdates } = require("./updates.cjs");
      checkForUpdates = installUpdates({ app, updater: autoUpdater, dialog, getWindow: () => window });
    }
    app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
}
