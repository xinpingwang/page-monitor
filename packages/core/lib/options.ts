import * as path from "path";

import { base64 } from "./main/util";

export const options = {
  walk: {
    invisibleElements: [
      "applet",
      "area",
      "audio",
      "base",
      "basefont",
      "bdi",
      "bdo",
      "big",
      "br",
      "center",
      "colgroup",
      "datalist",
      "form",
      "frameset",
      "head",
      "link",
      "map",
      "meta",
      "noframes",
      "noscript",
      "optgroup",
      "option",
      "param",
      "rp",
      "rt",
      "ruby",
      "script",
      "source",
      "style",
      "title",
      "track",
      "xmp",
    ],
    ignoreChildrenElements: [
      "img",
      "canvas",
      "input",
      "textarea",
      "audio",
      "video",
      "hr",
      "embed",
      "object",
      "progress",
      "select",
      "table",
    ],
    styleFilters: [
      "margin-left",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "border-left-color",
      "border-left-style",
      "border-left-width",
      "border-top-color",
      "border-top-style",
      "border-top-width",
      "border-right-color",
      "border-right-style",
      "border-right-width",
      "border-bottom-color",
      "border-bottom-style",
      "border-bottom-width",
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-left-radius",
      "border-bottom-right-radius",
      "padding-left",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "background-color",
      "background-image",
      "background-repeat",
      "background-size",
      "background-position",
      "list-style-image",
      "list-style-position",
      "list-style-type",
      "outline-color",
      "outline-style",
      "outline-width",
      "font-size",
      "font-family",
      "font-weight",
      "font-style",
      "line-height",
      "box-shadow",
      "clear",
      "color",
      "display",
      "float",
      "opacity",
      "text-align",
      "text-decoration",
      "text-indent",
      "text-shadow",
      "vertical-align",
      "visibility",
      "position",
    ],
    // attributes to mark an element
    attributeFilters: ["id", "class"],
    excludeSelectors: [],
    removeSelectors: [], // remove elements before walk
    ignoreTextSelectors: [], // ignore content change of text node or image change
    ignoreStyleSelectors: [], // ignore style change
    ignoreChildrenSelectors: [], //
    root: "body",
  },
  render: {
    format: "png",
    quality: 80,
  },
  diff: {
    // LCS diff priority, `head` or `tail`
    priority: "head",
    changeType: {
      ADD: 1, // 0001
      REMOVE: 2, // 0010
      STYLE: 4, // 0100
      TEXT: 8, // 1000
    },
    // highlight mask styles
    highlight: {
      add: {
        title: "新增(Added)",
        backgroundColor: "rgba(127, 255, 127, 0.3)",
        borderColor: "#090",
        color: "#060",
        textShadow: "0 1px 1px rgba(0, 0, 0, 0.3)",
      },
      remove: {
        title: "删除(Removed)",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        borderColor: "#999",
        color: "#fff",
      },
      style: {
        title: "样式(Style)",
        backgroundColor: "rgba(255, 0, 0, 0.3)",
        borderColor: "#f00",
        color: "#f00",
      },
      text: {
        title: "文本(Text)",
        backgroundColor: "rgba(255, 255, 0, 0.3)",
        borderColor: "#f90",
        color: "#c30",
      },
    },
  },
  path: {
    root: path.join(process.cwd(), "capture"), // data and screenshot save path root

    // save path format, it can be a string
    // like this: '{hostname}/{port}/{pathname}/{query}{hash}'
    format: function (url, opt) {
      return [
        opt.hostname,
        opt.port ? "-" + opt.port : "",
        "/",
        base64(opt.path + (opt.hash || "")).replace(/\//g, "."),
      ].join("");
    },
  },
};
