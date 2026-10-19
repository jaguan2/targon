const path = require('node:path');

// Keep Star's existing Chromium profile: changing productName must not strand
// saved profiles and friends. Smoke checks always use their isolated directory.
function userDataPath(appData, smokeReportPath) {
  if (smokeReportPath) {
    if (!path.isAbsolute(smokeReportPath)) throw new Error('Smoke report path must be absolute.');
    return path.join(path.dirname(smokeReportPath), 'user-data');
  }
  return path.join(appData, 'Star');
}

module.exports = { userDataPath };
