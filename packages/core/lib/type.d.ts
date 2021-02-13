/**
 * position and size of element
 */
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * element info
 */
interface ElementSnapshot {
  name: string;
  text: string;
  rect?: Rect;
  attr?: object;
  style?: string;
  child?: ElementSnapshot[];
  matched?: boolean;
}

/**
 * time and url of a snapshot
 */
interface PageSnapshotInfo {
  time: number;
  url: string;
}

interface PageSnapshot {
  time: number;
  file: string;
  content: string;
}

/**
 * options from the screenshot
 */
interface RenderOption {
  format: "png" | "jpeg";
  quality: number;
}

/**
 * md5 function exposed from node to browser
 * @param content content to md5
 */
declare function md5(content: string): Promise<string>;
