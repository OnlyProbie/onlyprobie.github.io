// src/EventMediator.js
class EventMediator {
  constructor() {
    this.listeners = {} // 存储事件名与监听器的映射
  }

  // 注册事件监听器
  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  // 触发事件
  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback(data))
    }
  }

  // Native 端发送事件
  static nativeEmit(eventName, data) {
    EventMediator.instance.emit(eventName, data)
  }

  // RN 端发送事件
  static rnEmit(eventName, data) {
    EventMediator.instance.emit(eventName, data)
  }
}

// 创建单例实例
EventMediator.instance = new EventMediator()

export default EventMediator
