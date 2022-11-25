/** @format */

// /** @format */
import setTray from './setTray';

import { ipcMain } from 'electron';
export default function () {
  ipcMain.handle('win-message', (_, data) => {
    setTray.flash(data);
  });
}
