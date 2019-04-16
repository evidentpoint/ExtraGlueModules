import { Caller } from '@readium/glue-rpc';
import { EventHandlingMessage, IAddEventListenerOptions } from '../eventHandling/interface';

export class LinkHandling extends Caller {
  public readonly typeName: string = 'LinkHandling';

  public constructor(targetWindow: Window) {
    super('link-handling', targetWindow);
  }

  public async addEventListener(
    eventType: string,
    listener: EventListener,
    options: IAddEventListenerOptions = {},
  ): Promise<number> {
    return this.call(EventHandlingMessage.AddEventListener, [eventType, options], (payload) => {
      listener(payload[0]);
    });
  }

  public removeEventListener(id: number): void {
    this.call(EventHandlingMessage.RemoveEventListener, [id]);
  }
}
