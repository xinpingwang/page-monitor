"use strict";

const fs = require("fs").promises;
const path = require("path");
const playwright = require("playwright");

const walk = require("../browser/walk");

/**
 * const monitor = new Monitor("https://www.baidu.com", options);
 * monitor.capture();
 */
class Monitor {
  DEFAULT_BROWSER = "chromium";

  constructor(url, options) {
    this.url = url;
    this.options = options;
  }

  /**
   * save capture
   * @param {import("playwright").Page} page
   * @param {string} url
   * @param {string|object} tree
   * @param {array} rect
   * @param {string|number} time
   * @returns {{time: number, dir: string, screenshot: string}}
   */
  async save(page, url, tree, rect, time) {
    time = time || Date.now();

    if (tree instanceof Object) {
      tree = JSON.stringify(tree);
    }

    const dir = path.join(".", `${time}`);

    await fs.mkdir(dir, { recursive: true }).catch((reason) => {
      console.log(reason);
    });

    await page.screenshot({ path: path.join(dir, "screenshot.png") });
    await fs.writeFile(path.join(dir, "tree"), tree);
    await fs.writeFile(path.join(dir, "info"), JSON.stringify({ time, url }));
    return { time, dir, screenshot: "screenshot.png" };
  }

  async capture() {
    const browser = await playwright[this.DEFAULT_BROWSER].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(this.url);
    const right = await page.evaluate(walk, [1, this.options.walk]);
    const rect = right.rect;
    const json = JSON.stringify(right);
    await this.save(page, this.url, json, rect);
    await page.close();
    await browser.close();
  }
}

module.exports = Monitor;
