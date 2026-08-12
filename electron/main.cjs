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

/**
 * A packaged Windows app has no console, so an error during startup would
 * otherwise vanish and look like "it just closes". Record it somewhere findable.
 */
const logPath = path.join(os.tmpdir(), 'star-main.log');

function log(message) {
  try {
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Logging must never be the reason the app fails to start.
  }
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error && error.stack ? error.stack : error}`);
});

/** Set when running against the Vite dev server instead of a built bundle. */
const devServerUrl = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const window = new BrowserWindow({
    width: 1100,
    height: 900,
    minWidth: 460,
    minHeight: 560,
    // Matches --void, so there is no white flash before the page paints.
    backgroundColor: '#0a0e27',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Wait for the first paint rather than showing an empty frame.
  window.once('ready-to-show', () => window.show());

  if (devServerUrl) {
    window.loadURL(devServerUrl);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    window.loadFile(indexPath).catch((error) => log(`loadFile failed: ${error}`));
  }

  window.webContents.on('did-fail-load', (_event, code, description) => {
    log(`did-fail-load ${code}: ${description}`);
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    log(`render-process-gone: ${JSON.stringify(details)}`);
  });

  // Anything trying to open a new window goes to the real browser instead.
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // The app is a single local page; navigating anywhere else is either a bug
  // or something we did not intend, so refuse and hand it to the browser.
  window.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    const isDevServer =
      devServerUrl && url.startsWith(devServerUrl);
    if (target.protocol !== 'file:' && !isDevServer) {
      event.preventDefault();
      shell.openExternal(url);
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
