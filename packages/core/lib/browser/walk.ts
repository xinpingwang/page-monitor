/**
 * walk function runs at browser, take snapshot for each element on the webpage
 */
export async function walk(data: any): Promise<ElementSnapshot> {
  // walk settings
  const INVISIBLE_ELEMENT = data.invisibleElements;
  const IGNORE_CHILDREN_ELEMENT = data.ignoreChildrenElements;
  const STYLE_FILTERS = data.styleFilters;
  const ATTR_FILTERS = data.attributeFilters;
  const INCLUDE_SELECTORS = normalizeSelectors(data.includeSelectors);
  const EXCLUDE_SELECTORS = normalizeSelectors(data.excludeSelectors);
  const IGNORE_CHILDREN_SELECTORS = normalizeSelectors(data.ignoreChildrenSelectors);
  const IGNORE_TEXT_SELECTORS = normalizeSelectors(data.ignoreTextSelectors);
  const IGNORE_STYLE_SELECTORS = normalizeSelectors(data.ignoreStyleSelectors);
  const ROOT = data.root || "body";

  // reg
  const invisibleElementReg = new RegExp("^(" + INVISIBLE_ELEMENT.join("|") + ")$", "i");
  const ignoreChildrenElementReg = new RegExp("^(" + IGNORE_CHILDREN_ELEMENT.join("|") + ")$", "i");

  /**
   * combo selectors
   */
  function normalizeSelectors(selectors: string[] | string): string {
    if (Array.isArray(selectors)) {
      return selectors.join(",");
    } else {
      return String(selectors || "");
    }
  }

  /**
   * invisible
   */
  function isInvisible(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    invisibleElementReg.lastIndex = 0;
    return (
      invisibleElementReg.test(tagName) || (tagName === "input" && (element as HTMLInputElement).type === "hidden")
    );
  }

  /**
   * ignore child
   */
  function igonreChildren(element: HTMLElement): boolean {
    ignoreChildrenElementReg.lastIndex = 0;
    return (
      ignoreChildrenElementReg.test(element.tagName) ||
      (IGNORE_CHILDREN_SELECTORS && element.webkitMatchesSelector(IGNORE_CHILDREN_SELECTORS))
    );
  }

  /**
   * get element bounding rect relative to top-left of window
   */
  function getRect(element: HTMLElement): Rect {
    const rect = element.getBoundingClientRect();
    const { defaultView: window, documentElement: html } = element.ownerDocument;
    const x = Math.floor(rect.left + window.pageXOffset - html.clientLeft);
    const y = Math.floor(rect.top + window.pageYOffset - html.clientTop);
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);
    return { x, y, width, height };
  }

  /**
   * get computed styles of element, and hash them
   */
  async function getStylesHash(elem: HTMLElement): Promise<string> {
    const ret = [];
    const filters = STYLE_FILTERS.slice(0);
    if (igonreChildren(elem)) {
      filters.width = true;
      filters.height = true;
    }
    const styles = elem.ownerDocument.defaultView.getComputedStyle(elem, null);
    const display = styles.getPropertyValue("display");
    const opacity = styles.getPropertyValue("opacity");
    const visibility = styles.getPropertyValue("visibility");
    if (display === "none" || opacity === "0" || visibility === "hidden") {
      return "";
    } else {
      const position = styles.getPropertyValue("position");
      if (position !== "static") {
        filters.push("top", "right", "bottom", "left");
      }
      filters.forEach(function (key) {
        ret.push(styles.getPropertyValue(key));
      });
    }
    return await md5(ret.join("~"));
  }

  /**
   * get attributes of element
   */
  function getAttr(element: HTMLElement): object {
    const ret = {};
    const filters = ATTR_FILTERS.slice(0);
    let hasAttr = false;
    if (element.tagName.toLowerCase() === "input") {
      filters.push("type");
    }
    filters.forEach(function (key) {
      const attr = element.getAttribute(key);
      if (attr !== null) {
        hasAttr = true;
        ret[key] = attr;
      }
    });
    return hasAttr ? ret : null;
  }

  /**
   * filter elements
   * @param {HTMLElement} elem
   * @param {HTMLElement} parent
   * @returns {boolean}
   */
  function filter(elem, parent) {
    let ret = true;
    switch (elem.nodeType) {
      case Node.ELEMENT_NODE:
        if (EXCLUDE_SELECTORS) {
          ret = ret && !elem.webkitMatchesSelector(EXCLUDE_SELECTORS);
        }
        if (INCLUDE_SELECTORS) {
          ret = ret && elem.webkitMatchesSelector(INCLUDE_SELECTORS);
        }
        break;
      case Node.TEXT_NODE:
        if (IGNORE_TEXT_SELECTORS) {
          ret = ret && !parent.webkitMatchesSelector(IGNORE_TEXT_SELECTORS);
        }
        break;
      default:
        ret = false;
        break;
    }
    return ret;
  }

  if (data.removeSelectors && data.removeSelectors.length) {
    data.removeSelectors.forEach(function (selector) {
      const elems = document.querySelectorAll(selector);
      for (let i = 0, len = elems.length; i < len; i++) {
        let elem = elems[i];
        elem.parentNode.removeChild(elem);
        elem = null;
      }
    });
  }

  /**
   * walk dom tree
   */
  async function walkDom(element: HTMLElement): Promise<ElementSnapshot> {
    const node: ElementSnapshot = {
      name: "",
      text: "",
      child: [],
    };
    if (element.nodeType === Node.ELEMENT_NODE) {
      // element
      node.name = element.tagName.toLowerCase();
      if (!isInvisible(element)) {
        node.rect = getRect(element);
        const attr = getAttr(element);
        if (attr) {
          node.attr = attr;
        }
        if (IGNORE_STYLE_SELECTORS && element.webkitMatchesSelector(IGNORE_STYLE_SELECTORS)) {
          node.style = "";
        } else {
          node.style = await getStylesHash(element);
        }
        node.child = [];
        if (node.name === "img") {
          if (!(IGNORE_TEXT_SELECTORS && element.webkitMatchesSelector(IGNORE_TEXT_SELECTORS))) {
            element.setAttribute("crossOrigin", "anonymous");
            const canvas = document.createElement("canvas");
            canvas.width = element.offsetWidth;
            canvas.height = element.offsetHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(element as HTMLImageElement, 0, 0);
            // not ignore text
            node.child.push({
              name: "#",
              text: await md5(canvas.toDataURL()),
            });
          }
        } else if (igonreChildren(element)) {
          // ignore children
          if (!(IGNORE_TEXT_SELECTORS && element.webkitMatchesSelector(IGNORE_TEXT_SELECTORS))) {
            // not ignore text
            node.child.push({
              name: "#",
              text: await md5(element.innerText.replace(/\s+/g, " ")),
            });
          }
        } else {
          for (let i = 0, len = element.childNodes.length; i < len; i++) {
            const child = element.childNodes[i];
            if (filter(child, element)) {
              // recursion
              const vdom: any = await walkDom(child as HTMLElement); //
              if (typeof vdom !== "undefined" && vdom.style !== false) {
                node.child.push(vdom);
              }
            }
          }
        }
        return node;
      }
    } else if (element.nodeType === Node.TEXT_NODE) {
      // text node
      const text = element.nodeValue.trim();
      if (text) {
        node.name = "#";
        node.text = await md5(text);
        return node;
      }
    }
  }

  return await walkDom(document.querySelector(ROOT));
}
