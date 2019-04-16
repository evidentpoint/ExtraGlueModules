import { Callback, CallSource } from '@readium/glue-rpc';
import * as EPUBcfi from 'readium-cfi-js';
import { IAddEventListenerOptions } from '../eventHandling/interface';
import { CFIEventHandlingMessage } from './interface';
import { RangeData, createRangeFromRangeData } from '../utilities/rangeData';
import { TargetableHandler } from '../targetableHandler';

export class GenerateCFIHandler extends TargetableHandler {
  constructor(source: CallSource) {
    super(source);
    source.bind(CFIEventHandlingMessage.FromRange, this._fromRangeData);
  }

  private async _fromRangeData(
    callback: Callback,
    rangeData: RangeData,
    options: IAddEventListenerOptions,
  ): Promise<void> {
    const range = createRangeFromRangeData(rangeData);

    // Taken from cfi-navigation-logic
    const classBlacklist = ['cfi-marker'];
    const elementBlacklist: [] = [];
    const idBlacklist = ['MathJax_Message', 'MathJax_SVG_Hidden'];
    let cfi = '';

    if (range.collapsed && range.startContainer.nodeType === Node.TEXT_NODE) {
      cfi = EPUBcfi.Generator.generateCharacterOffsetCfiComponent(
        range.startContainer,
        range.startOffset,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );

      return callback(cfi);
    }

    if (range.collapsed) {
      let cfi = EPUBcfi.Generator.generateElementCFIComponent(
        range.startContainer,
        classBlacklist,
        elementBlacklist,
        idBlacklist,
      );

      if (cfi[0] === '!') {
        cfi = cfi.substring(1);
      }

      return callback(cfi);
    }

    cfi = EPUBcfi.Generator.generateRangeComponent(
      range.startContainer,
      range.startOffset,
      range.endContainer,
      range.endOffset,
      classBlacklist,
      elementBlacklist,
      idBlacklist,
    );

    return callback(cfi);
  }
}
