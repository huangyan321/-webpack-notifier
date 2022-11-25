/** @format */
'use strict';
const AutoImport = require('unplugin-auto-import/webpack');
const Components = require('unplugin-vue-components/webpack');
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');

const path = require('path');

function resolve(dir) {
  return path.join(__dirname, dir);
}
const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  pages: {
    index: {
      entry: 'src/renderer/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'vue-cli-electron',
      chunks: ['chunk-vendors', 'chunk-common', 'index'],
    },
    // loader: 'src/loader/main.js' // 多页loader页
  },
  pluginOptions: {
    electronBuilder: {
      mainProcessFile: 'src/main/index.js', // 主进程入口文件
      mainProcessWatch: ['src/main'], // 检测主进程文件在更改时将重新编译主进程并重新启动
      preload: 'src/renderer/preload/ipcRenderer.js',
      builderOptions: {
        appId: process.env.VUE_APP_APPID,
        productName: process.env.VUE_APP_PRODUCTNAME,
        extraMetadata: {
          name: process.env.VUE_APP_APPID.split('.').pop(),
          version: process.env.VUE_APP_VERSION,
        },
        asar: true,
        directories: {
          output: 'dist_electron',
          buildResources: 'build',
          app: 'dist_electron/bundled',
        },
        files: [
          {
            filter: ['**'],
          },
        ],
        extends: null,
        electronVersion: '11.3.0',
        extraResources: [],
        electronDownload: {
          mirror: 'https://npm.taobao.org/mirrors/electron/',
        },
        dmg: {
          contents: [
            {
              type: 'link',
              path: '/Applications',
              x: 410,
              y: 150,
            },
            {
              type: 'file',
              x: 130,
              y: 150,
            },
          ],
        },
        mac: {
          icon: 'public/icons/icon.icns',
        },
        nsis: {
          oneClick: false,
          perMachine: true,
          allowToChangeInstallationDirectory: true,
          warningsAsErrors: false,
          allowElevation: false,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
        },
        win: {
          target: 'nsis',
          icon: 'public/icons/icon.ico',
          requestedExecutionLevel: 'highestAvailable',
        },
        linux: {
          icon: 'public/icons',
        },
        publish: {
          provider: 'generic',
          url: 'http://127.0.0.1',
        },
      },
    },
  },
  configureWebpack: {
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
    resolve: {
      alias: {
        '@': resolve('src/renderer'),
      },
    },
  },
});
