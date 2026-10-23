export function parseLoadSessions(value) {
  if (!Array.isArray(value) || !value.length) throw new Error("Load sessions must be a non-empty array.");
  const users = new Set();
  const cookies = new Set();
  return value.map(session => {
    if (!session || typeof session.userId !== "string" || !session.userId.trim()
      || typeof session.cookieHeader !== "string" || !session.cookieHeader.trim()
      || /[\r\n]/.test(session.cookieHeader)) {
      throw new Error("Each load session needs a userId and valid cookieHeader.");
    }
    if (users.has(session.userId) || cookies.has(session.cookieHeader)) {
      throw new Error("Load sessions must have distinct user IDs and cookie headers.");
    }
    users.add(session.userId); cookies.add(session.cookieHeader);
    return { userId: session.userId, cookieHeader: session.cookieHeader };
  });
}
