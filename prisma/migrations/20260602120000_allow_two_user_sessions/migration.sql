-- Allow each account to keep up to two server-side sessions.
DROP INDEX IF EXISTS "UserSession_userId_key";
