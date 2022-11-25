<!-- @format -->

<template>
  <div class="main">
    <h1>填写相关配置</h1>
    <el-form
      ref="ruleFormRef"
      :model="form"
      label-width="120px"
      :rules="rules"
      status-icon
      label-position="top"
    >
      <el-form-item label="websocket url" prop="socketUrl">
        <el-input
          v-model="form.socketUrl"
          placeholder="Please input websocket url"
        ></el-input>
      </el-form-item>
      <el-form-item label="heartbeat interval (unit:ms)" prop="heartbeat">
        <el-input
          v-model="form.heartbeat"
          type="number"
          placeholder="Please input heartbeat interval (default 30000)"
        ></el-input>
      </el-form-item>
      <el-button
        @click="connect"
        size="small"
        v-loading="loading"
        :disabled="loading"
        >{{ loading ? '连接中' : isConnected ? '已连接' : '连接' }}</el-button
      >
      <el-button
        @click="close"
        size="small"
        v-loading="closeLoading"
        :disabled="closeLoading"
        >{{ closeLoading ? '关闭中' : '关闭连接' }}</el-button
      >
      <el-button @click="clear" size="small">清空日志</el-button>
    </el-form>
    <ul class="list" style="overflow: auto" ref="listRef">
      <li
        v-for="(i, idx) in info"
        :key="idx"
        :style="{ color: i.color }"
        class="listitem"
      >
        {{ i.msg }}
      </li>
    </ul>
  </div>
</template>

<script setup>
// import cfg from '@/config';
import WebsocketClient from '../webscoket';
// import Log from './components/Log.vue';
import {
  watchEffect,
  reactive,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  nextTick,
} from 'vue';
import { setCache, getCache } from './utils/cache';
const validateUrl = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please input websocket url'));
  } else {
    const reg = /ws:\/\/([\w.]+\/?)\S*/;
    if (reg.test(value)) {
      callback();
    } else {
      callback(new Error('no websocket url'));
    }
  }
};
const isConnected = ref(false);
const isClosed = ref(true);
const client = ref(null);
const info = ref([]);
const loading = ref(false);
const closeLoading = ref(false);
const listRef = ref(null);
const form = reactive({
  socketUrl: '',
  heartbeat: '',
});
const rules = reactive({
  socketUrl: [
    {
      required: true,
      validator: validateUrl,
      trigger: 'blur',
    },
  ],
});
onMounted(() => {
  const cacheForm = getCache('form');
  if (cacheForm) {
    form.socketUrl = cacheForm.socketUrl;
  }
  if (client.value) {
    if (client.value.readyState === 1) {
      isConnected.value = true;
    }
  }
  window.electron.ipcRenderer.on('before-quit', close);
  window.electron.ipcRenderer.on('renderer-message-read', () => {
    setMessage({
      flashFrame: false,
      messageConfig: {
        news: 0,
      },
    });
  });
});
watch(
  info,
  () => {
    nextTick(() => {
      listRef.value.scrollTop = listRef.value.scrollHeight;
    });
  },
  { deep: true }
);
const clear = () => {
  info.value.length = 0;
};
const connect = () => {
  if (closeLoading.value) return;
  if (isConnected.value) return;
  loading.value = true;
  if (client.value) {
    client.value.close();
    client.value = null;
  }
  isClosed.value = false;
  isConnected.value = false;
  client.value = new WebsocketClient(form);

  client.value.on('open', (message) => {
    setCache('form', form);
    info.value.push({
      msg: message + '',
      color: '#67c23a',
    });
  });
  client.value.on('close', (message) => {
    closeLoading.value = false;
    isConnected.value = false;
    isClosed.value = true;
    loading.value = false;
    info.value.push({
      msg: message + '',
      color: '#e6a23c',
    });
    client.value = null;
    info.value.push({
      msg: 'closed',
      color: '#f56c6c',
    });
  });
  client.value.on('message', (message) => {
    if (info.value.length > 100) {
      info.value.length = 0;
    }
    info.value.push({
      msg: 'received message:' + message,
      color: '#67c23a',
    });
    message = JSON.parse(message);
    if (
      message.type === 'webpack' &&
      message.data === 'done' &&
      message.platform === 'server'
    ) {
      info.value.push({
        msg: 'invoke notification...',
        color: '#909399',
      });
      setMessage({
        flashFrame: true,
        messageConfig: {
          title: 'webpack',
          id: 1,
          body: '打包成功',
          news: 1,
        },
      });
    }
  });
  client.value.on('isConnect', (status) => {
    loading.value = false;
    isConnected.value = status;
  });
  client.value.on('send', (message) => {
    info.value.push({
      msg: message + '',
      color: '#d55b26',
    });
  });
  client.value.on('error', (message) => {
    info.value.push({
      msg: message + '',
      color: '#f56c6c',
    });
  });
};
const close = () => {
  if (client.value) {
    closeLoading.value = true;
    client.value.close();
  } else {
    loading.value = false;
  }
};
function setMessage(obj) {
  window.electron.ipcRenderer.invoke('win-message', obj);
}
onBeforeUnmount(close);
watchEffect(() => {
  // if (form.wsUrl) {
  //   console.log(form.wsUrl);
  // }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
body {
}
.main {
  max-width: 900px;
  margin: 0 auto;
}
.list {
  min-height: 300px;
  max-height: 500px;
  list-style: none;
  text-align: left;
  padding: 0;
  overflow: auto;
  background-color: #f5f7fa;
  font-size: 14px;
  padding-left: 20px;
  padding-top: 20px;
}
.list .listitem {
  margin-top: 3px;
}
</style>
