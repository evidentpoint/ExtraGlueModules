import { Caller } from '@readium/glue-rpc';
import { EventHandlingMessage, IAddEventListenerOptions } from '../eventHandling/interface';

export class SelectionHandling extends Caller {
  public constructor(targetWindow: Window) {
    super('selection-handling', targetWindow);
  }

  public async addEventListener(
    target: string,
    listener: EventListener,
    options: IAddEventListenerOptions = {},
  ): Promise<number> {
    return this.call(
      EventHandlingMessage.AddEventListener,
      [target, options],
      (payload: any) => {
        listener(payload[0]);
      },
    );
  }

  public removeEventListener(id: number): void {
    this.call(EventHandlingMessage.RemoveEventListener, [id]);
  }
}
