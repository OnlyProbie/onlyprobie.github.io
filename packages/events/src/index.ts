// src/index.js
import { NativeEventEmitter, NativeModules } from 'react-native'
import EventMediator from './EventMediator'

// 获取原生模块
const { NativeBridge } = NativeModules

// 事件监听器
const eventEmitter = new NativeEventEmitter(NativeBridge)

// 注册事件
function registerEventListener(eventName, callback) {
  eventEmitter.addListener(eventName, callback)
}

// 发送事件到 Native
function sendEventToNative(eventName, data) {
  NativeBridge.sendEventToRN(eventName, data)
}

// 暴露给外部使用
export {
  EventMediator,
  registerEventListener,
  sendEventToNative,
}
