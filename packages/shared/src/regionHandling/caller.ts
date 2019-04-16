import { Caller } from '@readium/glue-rpc';
import { Region, IAddRegionListenerOptions, RegionEventHandlingMessage } from './interface';

export class RegionHandling extends Caller {
  public constructor(targetWindow: Window) {
    super('region-handling', targetWindow);
  }

  public async addEventListener(
    eventType: string,
    region: Region,
    listener: EventListener,
    options: IAddRegionListenerOptions = {},
  ): Promise<number> {
    const target = 'html';

    options.region = region;
    let type = eventType;
    if (eventType === 'mouseenter' || eventType === 'mouseout') {
      type = 'mousemove';
      options.eventType = eventType;
    }

    return this.call(
      RegionEventHandlingMessage.AddEventListener,
      [target, type, options],
      (event) => {
        listener(event[0]);
      },
    );
  }

  public setRegion(region: Region, id?: number): void {
    this.call(RegionEventHandlingMessage.SetRegion, [region, id]);
  }

  public removeEventListener(listenerID: number): void {
    this.call(RegionEventHandlingMessage.RemoveEventListener, [listenerID]);
  }
}
