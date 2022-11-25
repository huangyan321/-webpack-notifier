/** @format */
export default class Socket {
  constructor(socketUrl) {
    this.socketUrl = socketUrl;
    this.timer = null;
    this.closeWs = false;
    this.heartbeatOpen = false;
    this.errorResetInterval = 2000;
    this.errorResetNumber = 0; // 错误重连次数
    this.errorResetTimer = null; // 错误重连次数
    this.ws = null;
    this.deps = new Map();
    this.init();
  }
  init() {
    if (this.closeWs) {
      throw new Error('socket is closed');
    }
    if (this.ws) this.ws = null;
    const _handleError = () => {
      if (this.errorResetNumber === 4) {
        this.errorResetNumber = 0;
        this.errorResetTimer = null; // 错误重连次数
        this.ws = null;
        console.log('websocket重连失败');
      }
      this.errorResetTimer = setTimeout(() => {
        this.errorResetNumber++;
      }, this.errorResetInterval);
    };
    this.ws = new WebSocket(this.socketUrl);
    this.ws.onopen = () => {
      this.errorResetNumber = 0;
      this.errorResetTimer = null; // 错误重连次数
      this.deps.get('open')
        ? this.deps.get('open').forEach((cb) => {
            cb('Connection to server opened');
          })
        : '';
      console.log('Connection to server opened');
      this.ws.send(JSON.stringify({ type: 'heart' }));
      this.deps.get('isConnect')
        ? this.deps.get('isConnect').forEach((cb) => {
            cb(this.ws.readyState === 1 || this.ws.readyState === 0);
          })
        : '';
      this.socket_subscribe();
      this.heartbeat();
    };
    this.ws.onclose = () => {
      this.closeWs = true;
      this.deps.get('close')
        ? this.deps.get('close').forEach((cb) => {
            cb('web socket has failed  from closeState');
          })
        : '';
      console.log('web socket has failed  from closeState');
    };
    this.ws.onerror = () => {
      this.deps.get('error')
        ? this.deps.get('error').forEach((cb) => {
            cb('web socket has failed from errorState');
          })
        : '';
      console.log('web socket has failed  from errorState');
      _handleError();
    };
    this.socket_subscribe = () => {
      this.ws.onmessage = (message) => {
        message = JSON.parse(message.data);
        this.deps.get('message')
          ? this.deps.get('message').forEach((cb) => {
              cb(JSON.stringify(message));
            })
          : '';
        if (message.type === 'heartbeat') return;
        if (message.type === 'webpack') {
          console.log('webpack');
        }
      };
    };
  }
  on(type, cb) {
    const cbs = this.deps.get(type);
    if (cbs) {
      cbs.push(cb);
    } else {
      this.deps.set(type, [cb]);
    }
  }
  removeDeps() {
    this.deps.clear();
  }
  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
  heartbeat() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.ws.readyState === 1 || this.ws.readyState === 0) {
        this.ws.send(JSON.stringify({ type: 'heartbeat', msg: '心跳循环' }));
        this.heartbeat();
      } else {
        if (this.closeWs) return;
        console.log('websocket链接断开,正在重连');
        this.init();
      }
      this.deps.get('isConnect')
        ? this.deps.get('isConnect').forEach((cb) => {
            cb(this.ws.readyState === 1 || this.ws.readyState === 0);
          })
        : '';
    }, 3000);
  }
}
