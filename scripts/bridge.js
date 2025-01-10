// Bridge.js
class Bridge {
  constructor() {
    if (this.constructor === Bridge) {
      throw new Error('Abstract class \'Bridge\' cannot be instantiated.')
    }
  }

  sendMessage(_eventName, _data) {
    throw new Error('Method \'sendMessage\' must be implemented.')
  }

  receiveMessage(_eventName, _callback) {
    throw new Error('Method \'receiveMessage\' must be implemented.')
  }
}

// Native 层实现
class NativeBridge extends Bridge {
  sendMessage(eventName, data) {
    console.log(`Native: Sending message to RN - Event: ${eventName}, Data:`, data)
    // 通过 NativeBridge 向 RN 发送数据
  }

  receiveMessage(eventName, callback) {
    console.log(`Native: Listening for event ${eventName}`)
    // 监听来自 RN 的事件
    callback({ message: 'Hello from Native!' })
  }
}

// RN 层实现
class RNBridge extends Bridge {
  sendMessage(eventName, data) {
    console.log(`RN: Sending message to Native - Event: ${eventName}, Data:`, data)
    // 通过 RNBridge 向 Native 发送数据
  }

  receiveMessage(eventName, callback) {
    console.log(`RN: Listening for event ${eventName}`)
    // 监听来自 Native 的事件
    callback({ message: 'Hello from RN!' })
  }
}

// 使用桥接
const nativeBridge = new NativeBridge()
const rnBridge = new RNBridge()

nativeBridge.receiveMessage('eventFromRN', (data) => {
  console.log('Native received:', data)
})

rnBridge.receiveMessage('eventFromNative', (data) => {
  console.log('RN received:', data)
})

// 在 Native 层触发事件
nativeBridge.sendMessage('eventFromNative', { content: 'This is Native' })

// 在 RN 层触发事件
rnBridge.sendMessage('eventFromRN', { content: 'This is RN' })
