/** @format */

'use strict';

import { app, protocol, BrowserWindow } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import setMenu from './config/menu';
import path from 'path';
import ipcMain from './services/ipcMain';

import createWindow from './services/createWindow';
// import ipcMain from './services/ipcMain';
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer';
import config from './config';
import setTray from './services/setTray';
const isDevelopment = process.env.NODE_ENV !== 'production';
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);
let loaderWin = null;
let win = null;
async function initWindow(hashPath) {
  if (config.loading) {
    loaderWin = createWindow(
      {
        width: 400,
        height: 600,
        frame: false,
        backgroundColor: '#222',
        show: false,
        transparent: true,
        skipTaskbar: true,
        resizable: false,
        webPreferences: {
          experimentalFeatures: true,
          contextIsolation: false,
        },
      },
      'loader',
      'loader.html'
    );
    loaderWin.once('ready-to-show', () => {
      loaderWin.show();
    });
    loaderWin.on('closed', () => {
      loaderWin = null;
    });
  }
  // Create the browser window.
  win = createWindow(
    {
      width: 800,
      height: 600,
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
        contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
        preload: path.join(__dirname, '/preload.js'),
      },
    },
    hashPath,
    `index.html${hashPath}`
  );
  global.sharedObject.win = win;

  setMenu(win);
  setTray.init(win);
  ipcMain();
  win.once('ready-to-show', () => {
    loaderWin && loaderWin.destroy();
    win.show();
  });
  win.on('closed', () => {
    win = null;
    global.sharedObject.win = null;
  });
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST && process.env.development)
      win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  console.log('window-all-closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('browser-window-created', () => {
  console.log('window-created');
});
app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) initWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  initWindow('');
  win.webContents.once('did-finish-load', () => {
    if (process.argv.length > (app.isPackaged ? 1 : 2)) {
      app.emit('second-instance', null, process.argv);
    }
  });
  win.on('close', (e) => {
    console.log('close', global.willQuitApp);
    if (!global.willQuitApp) {
      e.preventDefault();
      win.setSkipTaskbar(true);
      win.hide();
    }
  });
});

app.whenReady().then(() => {
  protocol.registerFileProtocol('atom', (request, callback) => {
    const url = request.url.substr(7);
    callback(decodeURI(path.normalize(url)));
  });
});
// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}
