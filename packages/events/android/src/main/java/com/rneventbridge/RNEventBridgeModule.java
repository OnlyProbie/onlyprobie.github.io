// android/src/com/eventbridge/NativeBridge.java
package com.eventbridge;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class NativeBridge extends ReactContextBaseJavaModule {

    public NativeBridge(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "NativeBridge";
    }

    // Native 端发送事件给 RN
    @ReactMethod
    public void sendEventToRN(String eventName, String message) {
        // 触发 RN 端的事件
        EventMediator.nativeEmit(eventName, message);
    }

    // Native 端注册事件监听
    @ReactMethod
    public void registerEventListener(String eventName, Callback callback) {
        EventMediator.instance.on(eventName, data -> {
            callback.invoke(data);
        });
    }
}
