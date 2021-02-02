import * as crypto from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
import { Browser, BrowserType, chromium, firefox, Page, webkit } from "playwright";

import { walk } from "../browser/walk";

/**
 * const monitor = new Monitor("https://www.baidu.com", options);
 * monitor.capture();
 */
export class Monitor {
  DEFAULT_BROWSER = "chromium";

  browsers: { [key: string]: BrowserType<Browser> } = {
    chromium,
    firefox,
    webkit,
  };

  constructor(private url: string, private options: any) {}

  /**
   * save capture
   * @param {import("playwright").Page} page
   * @param {string} url
   * @param {string|object} tree
   * @param {array} rect
   * @param {string|number} time
   * @returns {{time: number, dir: string, screenshot: string}}
   */
  async save(page: Page, url: string, tree: string | object, time?: number) {
    time = time || Date.now();

    if (tree instanceof Object) {
      tree = JSON.stringify(tree);
    }

    const dir = path.join(".", `${time}`);

    await fs.mkdir(dir, { recursive: true }).catch((reason) => {
      console.log(reason);
    });

    await page.screenshot({ path: path.join(dir, "screenshot.png") });
    await fs.writeFile(path.join(dir, "tree.json"), tree);
    await fs.writeFile(path.join(dir, "info.json"), JSON.stringify({ time, url }));
    return { time, dir, screenshot: "screenshot.png" };
  }

  async capture() {
    const browser = await this.browsers[this.DEFAULT_BROWSER].launch();
    const context = await browser.newContext();
    await context.exposeFunction("md5", (text) => crypto.createHash("md5").update(text).digest("hex"));
    const page = await context.newPage();
    await page.goto(this.url);
    const right = await page.evaluate(walk, this.options.walk);
    const json = JSON.stringify(right);
    await this.save(page, this.url, json);
    await page.close();
    await browser.close();
  }
}
