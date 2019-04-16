import {
  getElementPath,
  getElementFromStringArray,
} from './helpers';

export interface RangeData {
  startOffset: number;
  startContainer: any[];
  endOffset: number;
  endContainer: any[];
  collapsed: boolean;
}

export function createRangeData(range: Range): RangeData {
  const startContainerPath = getElementPath(range.startContainer);
  const endContainerPath = getElementPath(range.endContainer);

  const rangeData: RangeData = {
    startOffset: range.startOffset,
    startContainer: startContainerPath,
    endOffset: range.endOffset,
    endContainer: endContainerPath,
    collapsed: range.collapsed,
  };

  return rangeData;
}

export function createRangeFromRangeData(rangeData: RangeData): Range {
  const startElement = getElementFromStringArray(rangeData.startContainer);
  const endElement = getElementFromStringArray(rangeData.endContainer);

  if (!startElement || !endElement) {
    console.error('Element was not successfully retrieved from rangeData');

    return new Range();
  }

  return createRange(startElement, rangeData.startOffset, endElement, rangeData.endOffset);
}

export function createRange(
  startContainer: Node,
  startOffset: number,
  endContainer: Node,
  endOffset: number,
): Range {
  const range = new Range();

  const position = startContainer.compareDocumentPosition(endContainer);
  let isBackwards = false;
  if (position === 0) {
    isBackwards = startOffset > endOffset;
  }
  if (position === startContainer.DOCUMENT_POSITION_PRECEDING) {
    isBackwards = true;
  }

  const sc = isBackwards ? endContainer : startContainer;
  const so = isBackwards ? endOffset : startOffset;
  const ec = isBackwards ? startContainer : endContainer;
  const eo = isBackwards ? startOffset : endOffset;

  range.setStart(sc, so);
  range.setEnd(ec, eo);

  return range;
}
