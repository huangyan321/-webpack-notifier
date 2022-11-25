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
      <el-form-item label="websocket url" prop="wsUrl">
        <el-input
          v-model="form.wsUrl"
          placeholder="Please input websocket url"
        ></el-input>
      </el-form-item>
      <el-button @click="connect" v-loading="loading" :disabled="loading">{{
        loading ? '连接中' : isConnected ? '已连接' : '连接'
      }}</el-button>
      <el-button
        @click="close"
        v-loading="closeLoading"
        :disabled="closeLoading"
        >{{ closeLoading ? '关闭中' : '关闭连接' }}</el-button
      >
    </el-form>
    <ul class="list" style="overflow: auto" ref="listRef">
      <li v-for="i in info" :key="i" class="infinite-list-item">{{ i }}</li>
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
const info = ref(['']);
const loading = ref(false);
const closeLoading = ref(false);
const listRef = ref(null);
const form = reactive({
  wsUrl: '',
});
const rules = reactive({
  wsUrl: [
    {
      required: true,
      validator: validateUrl,
      trigger: 'blur',
    },
  ],
});
onMounted(() => {
  const wsUrl = getCache('wsUrl');
  if (wsUrl) {
    form.wsUrl = wsUrl;
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
const connect = () => {
  if (closeLoading.value) return;
  loading.value = true;
  if (client.value) {
    client.value.close();
    client.value = null;
  }
  isClosed.value = false;
  isConnected.value = false;
  client.value = new WebsocketClient(form.wsUrl);
  client.value.on('open', (message) => {
    setCache('wsUrl', form.wsUrl);
    info.value.push(message + '');
  });
  client.value.on('close', (message) => {
    closeLoading.value = false;
    isConnected.value = false;
    isClosed.value = true;
    loading.value = false;
    info.value.push(message + '');
    client.value = null;
    info.value.push('closed');
  });
  client.value.on('message', (message) => {
    if (info.value.length > 100) {
      info.value.length = 0;
    }
    info.value.push('收到消息:' + message);
    message = JSON.parse(message);
    if (message.type === 'webpack' && message.data === 'done') {
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
}
</style>
