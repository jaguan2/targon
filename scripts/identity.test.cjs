const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { userDataPath } = require('../electron/identity.cjs');

test('Targon opens the original Star desktop profile', () => {
  const appData = path.resolve('test-app-data');
  assert.equal(userDataPath(appData, ''), path.join(appData, 'Star'));
});

test('release smoke checks cannot use the real desktop profile', () => {
  const appData = path.resolve('test-app-data');
  const report = path.resolve('isolated-smoke', 'report.json');
  assert.equal(userDataPath(appData, report), path.join(path.dirname(report), 'user-data'));
  assert.notEqual(userDataPath(appData, report), userDataPath(appData, ''));
  assert.throws(() => userDataPath(appData, 'relative-report.json'), /absolute/);
});
