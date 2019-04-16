import { Callback, CallSource } from '@readium/glue-rpc';

import { EventHandlingMessage, IAddEventListenerOptions } from '../eventHandling/interface';
import { createRangeData } from '../utilities/rangeData';
import { createSelectorFromStringArray, getTextSelector } from '../utilities/helpers';
import { TargetableHandler } from '../targetableHandler';
import { marshalObject } from '@readium/glue-rpc/lib/marshaling';

export class SelectionHandler extends TargetableHandler {
  constructor(source: CallSource) {
    super(source);
    source.bind(EventHandlingMessage.AddEventListener, this._addEventListener);
    source.bind(EventHandlingMessage.RemoveEventListener, this._removeEventListener);
  }

  private _createListener(callback: Callback, options: IAddEventListenerOptions): EventListener {
    return (event: any) => {
      if (options.preventDefault) {
        event.preventDefault();
      }
      if (options.stopPropagation) {
        event.stopPropagation();
      }
      if (options.stopImmediatePropagation) {
        event.stopImmediatePropagation();
      }

      const selection = window.getSelection();
      let obj: any = { text: '', rangeData: null };
      let startText;
      let endText;
      if (selection) {
        const text = selection.toString();
        let rangeData = null;
        if (selection.rangeCount) {
          const range = selection.getRangeAt(0);
          selection.removeAllRanges();
          selection.addRange(range);
          rangeData = createRangeData(range);

          const startTextNode = this._pluckTextFromElementArray(rangeData.startContainer);
          const endTextNode = this._pluckTextFromElementArray(rangeData.endContainer);
          startText = startTextNode ? getTextSelector(startTextNode) : null;
          endText = endTextNode ? getTextSelector(endTextNode) : null;
        }

        obj = { text, rangeData };
      }

      const marshaledObj = marshalObject(obj);
      if (startText) {
        marshaledObj.rangeData.startContainer.push(startText);
      }
      if (endText) {
        marshaledObj.rangeData.endContainer.push(endText);
      }

      callback(marshaledObj);
    };
  }

  private async _addEventListener(
    callback: Callback,
    target: string,
    options: IAddEventListenerOptions,
  ): Promise<number> {
    const eventType = 'mouseup';
    const listener = this._createListener(callback, options);
    return this.registerListenerForTargets(target, eventType, listener);
  }

  private async _removeEventListener({  }: Callback, id: number): Promise<void> {
    this.removeEventListeners(id);
  }

  private _pluckTextFromElementArray(elements: Element[]): Text | null {
    let text = null;
    elements.forEach((element: Element, index: number) => {
      if (element.nodeType === Node.TEXT_NODE) {
        text =  elements.splice(index, 1)[0];
      }
    });

    return text;
  }
}
