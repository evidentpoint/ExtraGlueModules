
export function createSelectorFromStringArray(array: string[]): string {
  let selector: string = '';

  let value = '';
  for (let i = array.length - 1; i >= 0; i -= 1) {
    value = array[i];
    // Ignore custom selectors, such as @window and @document
    if (value.includes('@')) continue;
    if (value.includes('>')) {
      value = value.split('>')[1];
    }

    if (selector.length !== 0) selector += ' ';
    selector += value;
  }

  return selector;
}

export function getTextSelector(text: Text): string {
  const parent = text.parentElement;
  let selector = '@text';
  if (!parent) {
    return selector;
  }
  const children = parent.childNodes;
  let textIndex = 0;
  for (let i = 0; i < children.length; i += 1) {
    const child = children.item(i);

    if (child.nodeType === Node.TEXT_NODE) {
      if (child === text) {
        break;
      }
      textIndex += 1;
    }
  }

  if (textIndex > 0) {
    selector += `:nth-child(${textIndex})`;
  }

  return selector;
}

export function getElementPath(element: any, elements?: any[]): any[] {
  let els = elements;
  if (!els) {
    els = [];
  }
  els.push(element);

  const parentEl = element.parentElement;
  // If a parent element exists, run this method again with that parent element
  // Otherwise, return the elements with document and window appended to it
  return parentEl ? getElementPath(parentEl, els) : els.reverse();
}

export function getElementFromStringArray(elements: string[]): Text | Element | null {
  const customSelectors = pluckCustomSelectors(elements);
  const textSelector = customSelectors.find((selector: string) => {
    return selector.includes('@text');
  });

  if (elements.indexOf('html') === elements.length - 1) {
    elements.reverse();
  }
  const nativeSelector = elements.join(' ');
  const element = document.querySelector(nativeSelector);
  if (!element) {
    return null;
  }
  if (!textSelector) {
    return element;
  }

  const index = getTextNodeSelectorIndex(textSelector);
  return getTextNode(element, index);
}

/**
 * Returns an array with all DOM elements affected by an event.
 * The function serves as a polyfill for
 * [`Event.composedPath()`](https://dom.spec.whatwg.org/#dom-event-composedpath).
 *
 * (Sourced from [here](https://gist.github.com/leofavre/d029cdda0338d878889ba73c88319295))
 *
 * @category Event
 * @param {Event} evt The triggered event.
 * @return {Array.<HTMLElement>} The DOM elements affected by the event.
 *
 * @example
 * let domChild = document.createElement("div"),
 * 	domParent = document.createElement("div"),
 * 	domGrandparent = document.createElement("div"),
 * 	body = document.body,
 * 	html = document.querySelector("html");
 *
 * domParent.appendChild(domChild);
 * domGrandparent.appendChild(domParent);
 * body.appendChild(domGrandparent);
 *
 * domChild.addEventListener("click", dealWithClick);
 * const dealWithClick = evt => getEventPath(evt);
 *
 * // when domChild is clicked:
 * // => [domChild, domParent, domGrandparent, body, html, document, window]
 */
export function eventPath(evt: any): any[] {
  let path = (evt.composedPath && evt.composedPath()) || evt.path;
  const target = evt.target;

  if (path != null) {
    // Safari doesn't include Window, and it should.
    path = path.indexOf(window) < 0 ? path.concat([window]) : path;
    return path;
  }

  if (target === window) {
    return [window];
  }

  function getParents(node: any, memo: any[] = []): any {
    const parentNode = node.parentNode;

    if (!parentNode) {
      return memo;
    }
    return getParents(parentNode, memo.concat([parentNode]));
  }

  return [target].concat(getParents(target)).concat([window]);
}

function pluckCustomSelectors(selectors: string[]): string[] {
  let customSelectors: string[] = [];
  selectors.forEach((selector: string, index: number) => {
    if (selector.includes('@')) {
      customSelectors = customSelectors.concat(selectors.splice(index, 1));
    }
  });

  return customSelectors;
}

function getTextNodeSelectorIndex(selector: string): number {
  let index = 0;
  if (selector.includes('@text:nth-child')) {
    const match = selector.match(/@text:nth-child\((\d*)\)/);
    if (match && match[1]) {
      index = Number.parseInt(match[1], 10) || 0;
    }
  }

  return index;
}

function getTextNode(element: Element, index: number = 0): Text | null {
  const nodes: NodeListOf<ChildNode> = element.childNodes;

  let textNode: Text | null = null;
  let textNodeIndex = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    const node: Node = nodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      if (textNodeIndex === index) {
        textNode = <Text>node;
        break;
      }
      textNodeIndex += 1;
    }
  }

  return textNode;
}
