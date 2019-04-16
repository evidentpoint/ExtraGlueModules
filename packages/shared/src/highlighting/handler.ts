import { Callback, CallSource } from '@readium/glue-rpc';
import * as EPUBcfi from 'readium-cfi-js';
import { EventHandlingMessage, IHighlightOptions, IHighlightDeletionOptions } from './interface';
import {
  RangeData,
  createRangeFromRangeData,
  createRange,
} from '../utilities/rangeData';
import {
  createSelectorFromStringArray,
} from '../utilities/helpers';
import { TargetableHandler } from '../targetableHandler';

export class Highlighter extends TargetableHandler {
  constructor(source: CallSource) {
    super(source);
    source.bind(EventHandlingMessage.CreateHighlight, this._createHighlight);
    source.bind(EventHandlingMessage.DeleteHighlight, this._deleteHighlight);
  }

  private async _createHighlight(
    callback: Callback,
    rangeData: RangeData | string,
    options: IHighlightOptions,
  ): Promise<number> {
    const cfi = `epubcfi(/99!${rangeData})`;

    let range;
    if (typeof rangeData === 'string') {
      range = this._getRangeFromCFI(cfi);
    } else {
      range = createRangeFromRangeData(rangeData);
    }

    if (!range) {
      return -1;
    }

    let highlightsContainer = document.getElementById('highlights');
    if (!highlightsContainer) highlightsContainer = this._createHighlightsContainer();
    const clientRects = range.getClientRects();
    const id = this._createHighlightId(rangeData);

    const el = document.getElementById(id);
    if (el) {
      return -1;
    }

    const highlight = this._createHighlightDivs(clientRects, id);
    highlightsContainer.append(highlight);

    return 1;
  }

  private async _deleteHighlight(
    callback: Callback,
    rangeData: RangeData | string,
    options: IHighlightDeletionOptions,
  ): Promise<number> {
    const id = this._createHighlightId(rangeData);
    const el = document.getElementById(id);
    if (!el) {
      return -1;
    }

    // Get the child divs that are responsible for visibly showing the highlights
    const divs = el.getElementsByTagName('div');
    let timeout = 0;
    if (options && options.fadeOut) {
      for (let i = 0; i < divs.length; i += 1) {
        const child = divs.item(i)!;
        child.style.setProperty('opacity', '1');
        child.style.setProperty('transition', `opacity ${options.fadeOut}ms ease 0s`);
      }
      timeout = options.fadeOut || 0;
    }

    if (timeout) {
      for (let i = 0; i < divs.length; i += 1) {
        const child = divs.item(i)!;
        child.style.setProperty('opacity', '0');
      }
      divs[0].addEventListener('transitionend', () => {
        el.remove();
      });
    } else {
      el.remove();
    }

    return 1;
  }

  private _createHighlightId(rangeDataOrCFI: RangeData | string): string {
    let id = '';
    // Use the CFI as-is, if it's present
    if (typeof rangeDataOrCFI === 'string') {
      id = rangeDataOrCFI;
    } else {
      const startSelector = createSelectorFromStringArray(rangeDataOrCFI.startContainer);
      const endSelector = createSelectorFromStringArray(rangeDataOrCFI.endContainer);
      id = startSelector + rangeDataOrCFI.startOffset + endSelector + rangeDataOrCFI.endOffset;
      id = id.replace(/ /g, '');
    }

    return `highlight-${id}`;
  }

  private _createHighlightsContainer(): HTMLElement {
    const div = document.createElement('div');
    div.setAttribute('id', 'highlights');
    div.style.setProperty('pointer-events', 'none');
    document.body.append(div);

    return div;
  }

  private _createHighlightDivs(
    clientRects: ClientRectList | DOMRectList,
    id: string,
  ): HTMLDivElement {
    const divElements: HTMLDivElement[] = [];
    const container: HTMLDivElement = document.createElement('div');
    container.setAttribute('class', 'highlight');
    container.setAttribute('id', id);

    for (let i = 0; i < clientRects.length; i += 1) {
      const clientRect = clientRects[i];
      const divEl = this._createHighlightDiv(clientRect);
      divElements.push(divEl);
    }

    for (const el of divElements) {
      container.append(el);
    }
    return container;
  }

  private _createHighlightDiv(clientRect: ClientRect | DOMRect): HTMLDivElement {
    const docRect = document.body.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.style.setProperty('position', 'absolute');
    highlight.style.setProperty('background', 'rgba(220, 255, 15, 0.40)');
    highlight.style.setProperty('width', `${clientRect.width}px`);
    highlight.style.setProperty('height', `${clientRect.height}px`);
    highlight.style.setProperty('left', `${clientRect.left - docRect.left}px`);
    highlight.style.setProperty('top', `${clientRect.top - docRect.top}px`);
    highlight.style.setProperty('opacity', '1');

    return highlight;
  }

  private _getRangeFromCFI(cfi: string): Range | null {
    let range;
    // Highlight ranage
    if (EPUBcfi.Interpreter.isRangeCfi(cfi)) {
      const target = EPUBcfi.Interpreter.getRangeTargetElements(cfi, document);
      range = createRange(
        target.startElement,
        target.startOffset || 0,
        target.endElement,
        target.endOffset || 0,
      );
      // Highlight next word of cfi
    } else {
      const target = EPUBcfi.Interpreter.getTargetElement(cfi, document);
      const sentence = target[0].wholeText;
      // Get offset
      const match = cfi.match(/:(\d*)/);
      const targetOffset = match ? Number.parseInt(match[1], 10) : 0;
      let startOffset = targetOffset === 0 ? 0 : -1;
      let endOffset = -1;

      // Find first word after offset
      let charGroup = '';
      let finishWord = false;
      for (let i = 0; i < sentence.length; i += 1) {
        const char = sentence[i];
        if (i > targetOffset) {
          finishWord = true;
        }

        if (char === ' ') {
          if (finishWord && charGroup.length !== 0) {
            startOffset = i - charGroup.length;
            endOffset = i;
            break;
          }
          charGroup = '';
        } else {
          charGroup += char;
        }
      }

      range = createRange(target[0], startOffset, target[0], endOffset);
    }

    return range || null;
  }
}
