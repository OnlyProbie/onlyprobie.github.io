// ios/EventBridge.m
#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <React/RCTEventEmitter.h>

@interface NativeBridge : NSObject <RCTBridgeModule>
@end

@implementation NativeBridge

RCT_EXPORT_MODULE();

// Native 端发送事件给 RN
RCT_EXPORT_METHOD(sendEventToRN:(NSString *)eventName message:(NSString *)message)
{
  [EventMediator rnEmit:eventName data:message];
}

// Native 端注册事件监听
RCT_EXPORT_METHOD(registerEventListener:(NSString *)eventName callback:(RCTResponseSenderBlock)callback)
{
  [[EventMediator instance] on:eventName callback:^(id data) {
    callback(@[data]);
  }];
}

@end
