import { Caller } from '@readium/glue-rpc';
import { IAddEventListenerOptions } from '../eventHandling/interface';
import { CFIEventHandlingMessage } from './interface';
import { RangeData } from '../utilities/rangeData';

export class GenerateCFI extends Caller {
  public constructor(targetWindow: Window) {
    super('generateCFI', targetWindow);
  }

  public async fromRangeData(
    rangeData: RangeData,
    listener: EventListener,
    options?: IAddEventListenerOptions,
  ): Promise<string> {
    return this.call(CFIEventHandlingMessage.FromRange, [rangeData, options], (event) => {
      listener(event);
    });
  }
}
