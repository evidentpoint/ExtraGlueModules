import { Callback, CallSource } from '@readium/glue-rpc';
import {
  IAddRegionListenerOptions,
  RegionScope,
  RegionEventHandlingMessage,
  Region,
} from './interface';
import { marshalObject } from '../../../rpc/lib/marshaling';
import { TargetableHandler } from '../targetableHandler';

interface EventData {
  clientX: number;
  clientY: number;
  screenX: number;
  screenY: number;
  pageX: number;
  pageY: number;
}

export class RegionHandler extends TargetableHandler {
  private debug: boolean;
  private registeredOptions: { [id: number]: IAddRegionListenerOptions };

  constructor(source: CallSource) {
    super(source);
    source.bind(RegionEventHandlingMessage.AddEventListener, this._addEventListener);
    source.bind(RegionEventHandlingMessage.RemoveEventListener, this._removeEventListener);
    source.bind(RegionEventHandlingMessage.SetRegion, this._setRegionAsync);
    this.debug = false;

    this.registeredOptions = {};
  }

  protected createListener(callback: Callback, id: number): EventListener {
    return (event) => {
      // Get the current options for this handler
      const options = this.registeredOptions[id];
      if (options.stopPropagation) {
        event.preventDefault();
      }

      if (options.stopPropagation) {
        event.stopPropagation();
      }
      if (options.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }
      const region = options.region;
      const eventType = options.eventType;
      if (!region) {
        console.error('"region" was not passed into RegionHandler');
        return;
      }
      if (!(event instanceof MouseEvent)) {
        console.error('Event is not an instance of MouseEvent');
        return;
      }

      let x = event.clientX;
      let y = event.clientY;
      if (region.scope === RegionScope.Document) {
        x = event.pageX;
        y = event.pageY;
      }

      options.wasWithinRegion = options.withinRegion;
      options.withinRegion =
        x >= region.left &&
        x <= region.left + region.width &&
        (y >= region.top && y <= region.top + region.height);

      let shouldCallback = options.withinRegion;
      if (eventType === 'mouseenter') {
        shouldCallback = options.wasWithinRegion === false && options.withinRegion === true;
      } else if (eventType === 'mouseout') {
        shouldCallback = options.wasWithinRegion === true && options.withinRegion === false;
      }

      if (shouldCallback) {
        const eventData = this._getEventData(event);
        callback(eventData);
      }
    };
  }

  private async _setRegionAsync(callback: Callback, region: Region, id?: number): Promise<void> {
    this._setRegion(region, id);
  }

  private _setRegion(region: Region, id?: number): void {
    const options = {
      region,
    };
    if (id) {
      this._setOptionsById(options, id);
    } else {
      this._setOptionsForAll(options);
    }
  }

  private _setOptionsById(newOptions: IAddRegionListenerOptions, id: number): void {
    const options = this.registeredOptions[id];
    if (!options) {
      return;
    }
    if (newOptions.region && options.region) {
      options.region = this._newRegion(newOptions.region, options.region);

      if (this.debug && options.region) {
        this._makevisualdebug(id, newOptions.region);
      }
    }
    if (newOptions.withinRegion) {
      options.withinRegion = newOptions.withinRegion;
    }
  }

  private _newRegion(newRegion: Region | undefined, oldRegion: Region): Region | undefined {
    const region = oldRegion;
    if (newRegion) {
      region.left = newRegion.left !== undefined ? newRegion.left : oldRegion.left;
      region.top = newRegion.top !== undefined ? newRegion.top : oldRegion.top;
      region.width = newRegion.width !== undefined ? newRegion.width : oldRegion.width;
      region.height = newRegion.height !== undefined ? newRegion.height : oldRegion.height;
      region.scope = newRegion.scope !== undefined ? newRegion.scope : oldRegion.scope;
    }

    return region;
  }

  private _setOptionsForAll(options: IAddRegionListenerOptions): void {
    const handlers = this.registeredOptions;

    const keys = Object.keys(handlers);
    for (let i = 0; i < keys.length; i += 1) {
      const key = parseInt(keys[i], 10);
      this._setOptionsById(options, key);
    }
  }

  private _getEventData(event: MouseEvent): EventData {
    const data: EventData = {
      clientX: event.clientX,
      clientY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      pageX: event.pageX,
      pageY: event.pageY,
    };

    const marshaledObj = marshalObject(data);
    return marshaledObj;
  }

  private async _addEventListener(
    callback: Callback,
    target: string,
    eventType: string,
    options: IAddRegionListenerOptions,
  ): Promise<number> {
    const newId = this.peekId();
    this.registeredOptions[newId] = options;

    const listener: EventListener = this.createListener(callback, newId);
    this.registerListenerForTargets(target, eventType, listener);

    if (this.debug && options.region) {
      this._makevisualdebug(newId, options.region);
    }

    return newId;
  }

  private async _removeEventListener({  }: Callback, listenerID: number): Promise<void> {
    this.removeEventListeners(listenerID);
  }

  // For debugging only
  // Visualizes the region on screen
  private _makevisualdebug(id: number, region: any): void {
    const delid = `debug-region-${id}`;
    let el = document.getElementById(delid);
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('id', delid);
      el.style.setProperty('background', 'rgba(200, 200, 200, 0.3)');
      el.style.setProperty('border', '1px solid black');
      el.style.setProperty('position', 'absolute');
      document.body.append(el);
    }

    el.style.setProperty('left', `${region.left}px`);
    el.style.setProperty('top', `${region.top}px`);
    el.style.setProperty('width', `${region.width}px`);
    el.style.setProperty('height', `${region.height}px`);
  }
}
