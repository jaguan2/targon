const { test } = require('node:test');
const assert = require('node:assert/strict');
const { developmentUrl, isAppNavigation, externalUrl } = require('../electron/navigation.cjs');

test('packaged apps always load their bundled page', () => {
  assert.equal(developmentUrl('https://example.com', true), null);
  assert.equal(developmentUrl('http://localhost:5174', true), null);
});
test('development allows only a local HTTP origin', () => {
  assert.equal(developmentUrl('http://127.0.0.1:5174', false).origin, 'http://127.0.0.1:5174');
  for (const url of ['https://example.com', 'http://localhost.evil.test:5174', 'file:///C:/page.html']) {
    assert.throws(() => developmentUrl(url, false));
  }
});
test('navigation checks origin rather than URL prefix', () => {
  const options = { devUrl: new URL('http://localhost:5174') };
  assert.equal(isAppNavigation('http://localhost:5174/#profile', options), true);
  assert.equal(isAppNavigation('http://localhost:51740', options), false);
  assert.equal(isAppNavigation('http://localhost:5174.evil.test', options), false);
});
test('production navigation permits the entry page and fragments only', () => {
  const options = { indexUrl: 'file:///C:/targon/dist/index.html' };
  assert.equal(isAppNavigation('file:///C:/targon/dist/index.html#friends', options), true);
  assert.equal(isAppNavigation('file:///C:/Users/private.txt', options), false);
  assert.equal(isAppNavigation('https://example.com', options), false);
});
test('external links accept web URLs and reject arbitrary Windows protocols', () => {
  assert.equal(externalUrl('https://example.com/help'), 'https://example.com/help');
  for (const url of ['file:///C:/private.txt', 'javascript:alert(1)', 'ms-settings:privacy', 'broken']) assert.equal(externalUrl(url), null);
});
