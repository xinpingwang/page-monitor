export function highlight([diff, lOffset, rOffset, opt]) {
  /**
   * get px string
   */
  function px(val: number): string {
    return val + "px";
  }

  const CHANGE_TYPE = opt.changeType;
  const CHANGE_STYLE = {
    ADD: opt.highlight.add,
    REMOVE: opt.highlight.remove,
    TEXT: opt.highlight.text,
    STYLE: opt.highlight.style,
  };
  const lContainer = document.getElementById("left");
  const rContainer = document.getElementById("right");

  /**
   *
   * @param {Object} options
   * @param {HTMLElement} container
   * @param {Boolean} useTitle
   * @param {Number} offsetX
   * @param {Number} offsetY
   */
  function highlightElement(
    rect: Rect,
    options: any,
    container: HTMLElement,
    offsetX: number,
    offsetY: number,
    useTitle: boolean = false
  ): HTMLElement {
    offsetX = parseInt(`${offsetX}` || "0");
    offsetY = parseInt(`${offsetY}` || "0");
    const div = document.createElement("x-diff-div");
    div.style.position = "absolute";
    div.style.display = "block";
    div.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    div.style.border = "1px dashed #333";
    div.style.fontSize = "12px";
    div.style.fontWeight = "normal";
    div.style.overflow = "hidden";
    div.style.color = "#fff";
    div.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.4)";
    if (useTitle && options.title) {
      const span = document.createElement("x-diff-span");
      span.innerHTML = options.title;
      div.appendChild(span);
    }
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        div.style[key] = options[key];
      }
    }
    div.style.left = px(rect[0] - offsetX);
    div.style.top = px(rect[1] - offsetY);
    div.style.width = px(rect[2]);
    div.style.height = px(rect[3]);
    container.appendChild(div);
    return div;
  }

  // add lenged
  const lenged = document.getElementById("legend");
  for (let key in CHANGE_STYLE) {
    if (CHANGE_STYLE.hasOwnProperty(key)) {
      const div = highlightElement({ x: 0, y: 0, width: 120, height: 18 }, CHANGE_STYLE[key], lenged, 0, 0, true);
      div.setAttribute("id", "s-" + key);
      div.style.position = "static";
      div.style.margin = "5px 8px";
      div.style.display = "inline-block";
      div.style.lineHeight = "18px";
      div.style.textAlign = "center";
      div.style.fontWeight = "bold";
    }
  }

  const count = {
    add: 0,
    remove: 0,
    style: 0,
    text: 0,
  };
  // highlight diffs
  diff.forEach(function (item) {
    const node = item.node;
    const type = item.type;
    switch (type) {
      case CHANGE_TYPE.ADD:
        count.add++;
        highlightElement(node.rect, CHANGE_STYLE.ADD, rContainer, rOffset.x, rOffset.y);
        break;
      case CHANGE_TYPE.REMOVE:
        count.remove++;
        highlightElement(node.rect, CHANGE_STYLE.REMOVE, lContainer, lOffset.x, lOffset.y);
        break;
      case CHANGE_TYPE.TEXT:
        count.text++;
        highlightElement(node.rect, CHANGE_STYLE.TEXT, rContainer, rOffset.x, rOffset.y);
        break;
      default:
        if (type & CHANGE_TYPE.STYLE) {
          count.style++;
        }
        if (type & CHANGE_TYPE.TEXT) {
          count.text++;
        }
        highlightElement(node.rect, CHANGE_STYLE.STYLE, rContainer, rOffset.x, rOffset.y);
        break;
    }
  });

  for (let key in CHANGE_STYLE) {
    if (CHANGE_STYLE.hasOwnProperty(key)) {
      const div = document.getElementById("s-" + key);
      const span = document.createElement("x-span");
      span.innerHTML = count[key.toLowerCase()] || 0;
      span.style.float = "right";
      span.style.backgroundColor = "rgba(0,0,0,0.8)";
      span.style.paddingLeft = "5px";
      span.style.paddingRight = "5px";
      span.style.height = "18px";
      span.style.lineHeight = "18px";
      span.style.color = "#fff";
      div.appendChild(span);
    }
  }

  return count;
}
