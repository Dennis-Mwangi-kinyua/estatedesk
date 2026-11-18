const { test } = require('node:test');
const assert = require('node:assert/strict');
const { installPermissions, permissionKey } = require('../permissions.cjs');
test('only camera video and notifications can request consent', () => {
  assert.equal(permissionKey('media', { mediaTypes: ['video'] }), 'camera');
  for (const types of [[], ['audio'], ['video', 'audio']]) assert.equal(permissionKey('media', { mediaTypes: types }), null);
  assert.equal(permissionKey('display-capture'), null);
});
test('permissions require matching main frame and explicit consent', async () => {
  let request, check, prompts = 0;
  const session = { setPermissionRequestHandler(fn) { request = fn; }, setPermissionCheckHandler(fn) { check = fn; } };
  const origin = 'https://estatedesk.co.ke';
  const contents = { getURL: () => origin + '/dashboard' };
  const window = { isDestroyed: () => false };
  const revoke = installPermissions(session, contents, window, origin, { showMessageBox: async () => { prompts++; return { response: 1 }; } });
  const details = { isMainFrame: true, requestingUrl: origin, mediaTypes: ['video'] };
  const ask = (frame, permission, extra) => new Promise(resolve => request(frame, permission, resolve, extra));
  assert.equal(await ask(contents, 'media', { ...details, requestingUrl: 'https://evil.example' }), false);
  assert.equal(await ask(contents, 'media', { ...details, isMainFrame: false }), false);
  assert.equal(await ask({}, 'notifications', details), false);
  assert.equal(prompts, 0);
  assert.equal(check(contents, 'media', origin, { isMainFrame: true, mediaType: 'video' }), false);
  assert.equal(await ask(contents, 'media', details), true);
  assert.equal(prompts, 1);
  assert.equal(check(contents, 'media', origin, { isMainFrame: true, mediaType: 'video' }), true);
  assert.equal(check(contents, 'media', origin, { isMainFrame: true, mediaType: 'audio' }), false);
  revoke();
  assert.equal(check(contents, 'media', origin, { isMainFrame: true, mediaType: 'video' }), false);
});
