/** @format */

console.log('preload引入成功');
const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, callback) => {
      const newCallback = (_, data) => callback(_, data);
      ipcRenderer.on(channel, newCallback);
    },
    invoke: (channel, data) => {
      ipcRenderer.invoke(channel, data);
    },
  },
});