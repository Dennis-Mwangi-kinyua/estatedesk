const PRODUCTION_ORIGIN = "https://estatedesk.co.ke";

function appOrigin(value = PRODUCTION_ORIGIN, packaged = true) {
  const url = new URL(value);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
      (packaged ? url.origin !== PRODUCTION_ORIGIN : url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("Use the production origin, or a development HTTPS/localhost origin.");
  }
  return url.origin;
}

function trustedNavigation(value, origin) {
  try {
    const url = new URL(value);
    return url.origin === origin && !url.username && !url.password;
  } catch { return false; }
}

function externalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

module.exports = { appOrigin, trustedNavigation, externalUrl };
