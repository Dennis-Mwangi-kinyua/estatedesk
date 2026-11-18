function installUpdates({ app, updater, dialog, getWindow }) {
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = false;
  let checking = false;
  let prompting = false;
  let manual = false;
  const show = options => {
    const window = getWindow();
    return window && !window.isDestroyed() ? dialog.showMessageBox(window, options) : dialog.showMessageBox(options);
  };
  updater.on('error', () => {
    checking = false;
    if (manual) void show({ type: 'info', message: 'Updates are unavailable. Try again later.', buttons: ['OK'] });
    manual = false;
  });
  updater.on('update-not-available', () => {
    checking = false;
    if (manual) void show({ type: 'info', message: 'EstateDesk is up to date.', buttons: ['OK'] });
    manual = false;
  });
  updater.on('update-available', async info => {
    checking = false; manual = false;
    if (prompting) return;
    prompting = true;
    try {
      const result = await show({ type: 'question', message: `EstateDesk ${info.version} is available. Download the update?`, buttons: ['Later', 'Download'], defaultId: 0, cancelId: 0 });
      if (result.response === 1) await updater.downloadUpdate();
    } catch { /* Updater errors are handled without exposing internal paths. */ }
    finally { prompting = false; }
  });
  updater.on('update-downloaded', async () => {
    try {
      const result = await show({ type: 'question', message: 'The update is ready. Save your work before restarting.', buttons: ['Later', 'Restart and install'], defaultId: 0, cancelId: 0 });
      if (result.response === 1) updater.quitAndInstall();
    } catch { /* Keep the current application running. */ }
  });
  const check = async (requested = false) => {
    if (!app.isPackaged || checking || prompting) return;
    checking = true; manual = requested;
    try { await updater.checkForUpdates(); }
    catch { checking = false; }
  };
  const timer = setInterval(() => { void check(); }, 6 * 60 * 60 * 1000);
  timer.unref();
  app.on('before-quit', () => clearInterval(timer));
  void check();
  return () => check(true);
}
module.exports = { installUpdates };
