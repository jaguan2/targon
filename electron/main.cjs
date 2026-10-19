/**
 * Electron main process.
 *
 * CommonJS (`.cjs`) because package.json declares `"type": "module"` for the
 * Vite side; Electron's entry point is loaded outside that graph.
 *
 * The renderer is locked down as far as it will go — no Node integration, full
 * context isolation, sandboxed, and no preload bridge at all. It can afford to
 * be: every calculation runs in the browser context already, so there is
 * nothing the UI needs to ask the main process for.
 */

const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { developmentUrl, isAppNavigation, externalUrl } = require('./navigation.cjs');
const { userDataPath } = require('./identity.cjs');

// Isolated, hidden startup check used by the release smoke-test command.
const smokeReportPath = app.commandLine.getSwitchValue('smoke-test-report');
const dataPath = userDataPath(app.getPath('appData'), smokeReportPath);
fs.mkdirSync(dataPath, { recursive: true });
app.setPath('userData', dataPath);
let smokeFinished = false;
function finishSmoke(error, checks) {
  if (!smokeReportPath || smokeFinished) return;
  smokeFinished = true;
  fs.writeFileSync(smokeReportPath, JSON.stringify({ success: !error, error: error ? String(error) : null, checks }, null, 2));
  app.exit(error ? 1 : 0);
}
if (smokeReportPath) setTimeout(() => finishSmoke('Desktop startup timed out.'), 30000).unref();

/**
 * A packaged Windows app has no console, so an error during startup would
 * otherwise vanish and look like "it just closes". Record it somewhere findable.
 */
const logPath = path.join(os.tmpdir(), 'targon-main.log');

function log(message) {
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Logging must never be the reason the app fails to start.
  }
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error && error.stack ? error.stack : error}`);
  finishSmoke(error);
});

/** Set when running against the Vite dev server instead of a built bundle. */
const devUrl = developmentUrl(process.env.VITE_DEV_SERVER_URL, app.isPackaged);
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
const indexUrl = pathToFileURL(indexPath).href;

function openWebLink(url) {
  const target = externalUrl(url);
  if (target) shell.openExternal(target).catch((error) => log(`openExternal failed: ${error}`));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 900,
    minWidth: 460,
    minHeight: 560,
    // Matches --void, so there is no white flash before the page paints.
    backgroundColor: '#0c1220',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Wait for the first paint rather than showing an empty frame.
  if (!smokeReportPath) window.once('ready-to-show', () => window.show());

  if (smokeReportPath) {
    window.webContents.once('did-finish-load', async () => {
      try {
        const checks = await window.webContents.executeJavaScript(`({
          bundledPage: location.protocol === 'file:',
          title: document.title,
          appMounted: !!document.querySelector('.shell .masthead'),
          onboarding: !!document.querySelector('[data-intake-stage="name"]'),
          stylesLoaded: getComputedStyle(document.documentElement).getPropertyValue('--void').trim() === '#0c1220'
        })`);
        if (!checks.bundledPage || !checks.appMounted || !checks.onboarding || !checks.stylesLoaded) {
          throw new Error('The packaged renderer did not mount correctly: ' + JSON.stringify(checks));
        }
        finishSmoke(null, checks);
      } catch (error) {
        finishSmoke(error);
      }
    });
  }

  if (devUrl) {
    window.loadURL(devUrl.href).catch((error) => log(`loadURL failed: ${error}`));
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(indexPath).catch((error) => log(`loadFile failed: ${error}`));
  }

  window.webContents.on('did-fail-load', (_event, code, description) => {
    log(`did-fail-load ${code}: ${description}`);
    finishSmoke(`did-fail-load ${code}: ${description}`);
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    log(`render-process-gone: ${JSON.stringify(details)}`);
    finishSmoke(`render-process-gone: ${details.reason}`);
  });

  // Anything trying to open a new window goes to the real browser instead.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openWebLink(url);
    return { action: 'deny' };
  });

  // The app is a single local page; navigating anywhere else is either a bug
  // or something we did not intend, so refuse and hand it to the browser.
  window.webContents.on('will-navigate', (event, url) => {
    if (!isAppNavigation(url, { indexUrl, devUrl })) {
      event.preventDefault();
      openWebLink(url);
    }
  });

  return window;
}

// Only allow a single copy; a second launch focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [existing] = BrowserWindow.getAllWindows();
    if (existing) {
      if (existing.isMinimized()) existing.restore();
      existing.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      // macOS keeps the app alive with no windows; reopen on dock click.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
