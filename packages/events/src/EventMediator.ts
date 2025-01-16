class EventMediator {
  listeners: Record<string, Array<(data: Record<any, any>) => void>>
  constructor() {
    this.listeners = {} // 存储事件和回调函数
  }

  // 注册事件
  on(eventName: string, callback: (data: Record<any, any>) => void) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  // 触发事件
  emit(eventName: string, data: Record<any, any>) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach(callback => callback(data))
    }
  }
}

export default new EventMediator()
