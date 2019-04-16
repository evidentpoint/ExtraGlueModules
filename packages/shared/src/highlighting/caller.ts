import { Caller } from '@readium/glue-rpc';
import { EventHandlingMessage, IHighlightOptions, IHighlightDeletionOptions } from './interface';
import { RangeData } from '../utilities/rangeData';

export class Highlighting extends Caller {
  public constructor(targetWindow: Window) {
    super('highlighting', targetWindow);
  }

  public async createHighlight(
    rangeDataOrCFI: RangeData | string,
    options?: IHighlightOptions,
  ): Promise<void> {
    return this.call(EventHandlingMessage.CreateHighlight, [rangeDataOrCFI, options]);
  }

  public async deleteHighlight(
    rangeDataOrCFI: RangeData | string,
    options?: IHighlightDeletionOptions,
  ): Promise<void> {
    return this.call(EventHandlingMessage.DeleteHighlight, [rangeDataOrCFI, options]);
  }
}
