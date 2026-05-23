import { EventEmitter } from 'eventemitter3';

class EventBusClass extends EventEmitter {
  private static instance: EventBusClass;

  static getInstance(): EventBusClass {
    if (!EventBusClass.instance) {
      EventBusClass.instance = new EventBusClass();
    }
    return EventBusClass.instance;
  }

  onceOnce(event: string | symbol, fn: (...args: any[]) => void, context?: any): void {
    const wrapped = (...args: any[]) => {
      this.off(event, wrapped, context);
      fn.apply(context, args);
    };
    this.on(event, wrapped, context);
  }
}

export const EventBus = EventBusClass.getInstance();