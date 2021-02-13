import { promises as fs } from "fs";
import * as os from "os";

/**
 * generate uuid
 */
export function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * check file exists
 */
export function checkFileExists(path: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const fileAccessError = await fs.access(path).catch((error) => error);
    resolve(!fileAccessError);
  });
}

/**
 * check if the operating system is windows
 */
export function isWindows(): boolean {
  return os.type().toLowerCase().includes("windows");
}

/**
 * convert millisecond into string like `2014-09-12 14:23:03`
 */
export function getTimeString(num: number): string {
  const date = new Date();
  date.setTime(num);
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join(":");
  return `${day} ${time}`;
}

export function base64(content: string) {
  let buff = Buffer.from(content);
  return buff.toString("base64");
}
