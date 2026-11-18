const { trustedNavigation } = require("./policy.cjs");

function permissionKey(permission, details = {}) {
  if (permission === "notifications") return "notifications";
  if (permission === "media" && details.mediaTypes?.length === 1 && details.mediaTypes[0] === "video") return "camera";
  return null;
}

function installPermissions(session, contents, window, origin, dialog) {
  const grants = new Set();
  let prompting = false;
  session.setPermissionCheckHandler((requester, permission, requestingOrigin, details) => {
    if (requester && requester !== contents || !trustedNavigation(requestingOrigin, origin)) return false;
    if (permission === "notifications") return grants.has("notifications");
    return requester === contents && details?.isMainFrame === true && permission === "media" && details.mediaType === "video" && grants.has("camera");
  });
  session.setPermissionRequestHandler(async (requester, permission, callback, details) => {
    const key = permissionKey(permission, details);
    if (!key || requester !== contents || details?.isMainFrame !== true || !trustedNavigation(details.requestingUrl, origin) || !trustedNavigation(contents.getURL(), origin) || window.isDestroyed() || prompting) return callback(false);
    if (grants.has(key)) return callback(true);
    prompting = true;
    try {
      const result = await dialog.showMessageBox(window, { type: "question", title: "EstateDesk permission", message: key === "camera" ? "Allow EstateDesk to use your camera for photos and QR scanning?" : "Allow EstateDesk to show desktop notifications?", buttons: ["Don't allow", "Allow"], defaultId: 0, cancelId: 0 });
      const allowed = result.response === 1 && !window.isDestroyed() && trustedNavigation(contents.getURL(), origin);
      if (allowed) grants.add(key);
      callback(allowed);
    } catch { callback(false); }
    finally { prompting = false; }
  });
  return () => grants.clear();
}
module.exports = { permissionKey, installPermissions };
