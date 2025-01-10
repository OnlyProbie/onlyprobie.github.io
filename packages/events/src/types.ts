export type EventCallback = (data: any) => void

export interface EventSubscription {
  remove: () => void
}

export interface EventBridgeInterface {
  emit: (eventName: string, data?: any) => void
  addListener: (eventName: string, callback: EventCallback) => EventSubscription
  removeAllListeners: (eventName: string) => void
}
