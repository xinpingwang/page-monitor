interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ElementSnapshot {
  name: string;
  text: string;
  rect?: Rect;
  attr?: object;
  style?: string;
  child?: ElementSnapshot[];
}

declare function md5(content: string): Promise<string>;
