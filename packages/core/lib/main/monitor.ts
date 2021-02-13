import * as crypto from "crypto";
import { promises as fs } from "fs";
import * as path from "path";
import { Browser, BrowserType, chromium, firefox, Page, webkit } from "playwright";

import { highlight } from "../browser/highlight";
import { walk } from "../browser/walk";
import { diff } from "./diff";
import { checkFileExists, getTimeString, isWindows } from "./util";

/**
 * const monitor = new Monitor(options);
 * monitor.capture("https://www.baidu.com");
 */
export class Monitor {
  DEFAULT_BROWSER = "chromium";
  LATEST_LOG_FILENAME = "latest.log";
  SCREENSHOT_FILENAME = "screenshot";
  INFO_FILENAME = "info.json";
  TREE_FILENAME = "tree.json";
  HIGHLIGHT_HTML_FILENAME = "highlight.html";
  FORMAT_MAP = {
    png: "png",
    jpeg: "jpeg",
    jpg: "jpeg",
  };

  browsers: { [key: string]: BrowserType<Browser> } = {
    chromium,
    firefox,
    webkit,
  };

  // root folder path to save captures
  root: string;
  // latest capture log file path
  latest: string;

  constructor(private options: any) {
    this.root = options.path.root;
    this.latest = path.join(this.root, this.LATEST_LOG_FILENAME);
  }

  /**
   * get info of the latest save
   */
  async getLatestTree(): Promise<PageSnapshot> {
    const latestLogFileExists = await checkFileExists(this.latest);
    if (!latestLogFileExists) {
      return null;
    }
    const time = await fs.readFile(this.latest).then((res) => Number(res.toString().trim()));
    if (time) {
      const treeFilePath = path.join(this.root, String(time), this.TREE_FILENAME);
      const treeFileExists = await checkFileExists(treeFilePath);
      if (treeFileExists) {
        const content = await fs.readFile(treeFilePath).then((res) => res.toString().trim());
        return {
          time,
          file: treeFilePath,
          content,
        };
      }
    }
    return null;
  }

  /**
   * get render option
   */
  getRenderOption(): RenderOption {
    const render = this.options.render || {};
    const f = String(render.format).toLowerCase();
    const format = this.FORMAT_MAP[f] || "jpeg";
    const quality = render.quality || 80;
    return {
      format,
      quality,
    };
  }

  /**
   * save capture
   */
  async save(
    page: Page,
    url: string,
    tree: string | object,
    time?: number
  ): Promise<{ time: number; dir: string; screenshot: string }> {
    time = time || Date.now();

    if (tree instanceof Object) {
      tree = JSON.stringify(tree);
    }

    const dir = path.join(this.root, `${time}`);

    await fs.mkdir(dir, { recursive: true }).catch((reason) => {
      console.log(reason);
    });

    await page.screenshot({ path: path.join(dir, "screenshot.png") });
    await fs.writeFile(path.join(dir, "tree.json"), tree);
    await fs.writeFile(path.join(dir, "info.json"), JSON.stringify({ time, url }));
    await fs.writeFile(this.latest, `${time}`);
    return { time, dir, screenshot: "screenshot.png" };
  }

  async highlight(left: number, right: number, diff, lOffset, rOffset, callback) {
    console.log(`diff [${left}] width [${right}] has [${diff.length}] changes`);
    const renderOption = this.getRenderOption();
    const protocol = "file://" + (isWindows() ? "/" : "");
    const lScreenshot =
      protocol + path.join(this.root, String(left), `${this.SCREENSHOT_FILENAME}.${renderOption.format}`);
    const rScreenshot =
      protocol + path.join(this.root, String(right), `${this.SCREENSHOT_FILENAME}.${renderOption.format}`);
    const dScreenshot = path.join(this.root, "diff", `${left}-${right}.${renderOption.format}`);
    let url = `${protocol}${path.join(__dirname, this.HIGHLIGHT_HTML_FILENAME)}?`;
    url += [lScreenshot, rScreenshot, getTimeString(left), getTimeString(right)].join("|");
    const browser = await this.browsers[this.DEFAULT_BROWSER].launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    await page.evaluate(highlight, [diff, lOffset, rOffset, this.options.diff]);
    await fs.mkdir(path.join(this.root, "diff"), { recursive: true }).catch((reason) => {
      console.log(reason);
    });
    await page.screenshot({
      path: dScreenshot,
      type: renderOption.format,
      fullPage: true,
    });
    await page.close();
    await browser.close();
  }

  async capture(url: string, needDiff: boolean = false) {
    const browser = await this.browsers[this.DEFAULT_BROWSER].launch();
    const context = await browser.newContext();
    await context.exposeFunction("md5", (text) => crypto.createHash("md5").update(text).digest("hex"));
    const page = await context.newPage();
    await page.goto(url);
    const right = await page.evaluate(walk, this.options.walk);
    const json = JSON.stringify(right);
    const latest = await this.getLatestTree();
    const saveResult = await this.save(page, url, json);
    await page.close();
    await browser.close();
    if (!needDiff || latest === null) {
      return;
    }
    const left = JSON.parse(latest.content);
    const rect = diff(left, right, this.options.diff);
    if (!rect.length) {
      console.log("no change");
      return;
    }
    const lOffset = { x: left.rect.x, y: left.rect.y };
    const rOffset = { x: right.rect.x, y: right.rect.y };
    this.highlight(latest.time, saveResult.time, rect, lOffset, rOffset, (diff) => {
      console.log(diff);
    });
  }

  /**
   * get tree object by time
   * @returns {object|undefined}
   */
  async getTree(time: number) {
    const file = path.join(this.root, String(time), this.TREE_FILENAME);
    if (await checkFileExists(file)) {
      return JSON.parse(String(await fs.readFile(file)));
    }
  }

  /**
   * page diff
   * @param {number} left
   * @param {number} right
   */
  async diff(left: number, right: number) {
    const diffOption = this.options.diff;
    const lTree = await this.getTree(left);
    const rTree = await this.getTree(right);
    if (lTree && rTree) {
      var ret = diff(lTree, rTree, diffOption);
      if (ret.length) {
        var lOffset = { x: lTree.rect[0], y: lTree.rect[1] };
        var rOffset = { x: rTree.rect[0], y: rTree.rect[1] };
        this.highlight(left, right, ret, lOffset, rOffset, function (diff) {
          var info = { diff: diff };
        });
      } else {
        console.log("no change");
      }
    } else if (lTree) {
      throw new Error("missing right record [" + right + "]");
    } else {
      throw new Error("missing left record [" + right + "]");
    }
  }
}
