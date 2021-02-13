/**
 * equal
 */
function equal(left: any, right: any): boolean {
  let type = typeof left;
  if (type === typeof right) {
    switch (type) {
      case "object":
        let lKeys = Object.keys(left);
        let rKeys = Object.keys(right);
        if (lKeys.length === rKeys.length) {
          for (let i = 0; i < lKeys.length; i++) {
            let key = lKeys[i];
            if (!right.hasOwnProperty(key) || left[key] !== right[key]) {
              return false;
            }
          }
          return true;
        } else {
          return false;
        }
      default:
        return left === right;
    }
  } else {
    return false;
  }
}

/**
 * is element match
 */
function isMatch(left: ElementSnapshot, right: ElementSnapshot): boolean {
  return left.name === right.name && equal(left.attr, right.attr);
}

/**
 * common logic of `LCSHeadFirst’ and `LCSTailFirst‘
 * @param {Object} old
 * @param {Object} cur
 * @param {Function} match
 * @param {Number} x
 * @param {Array} lastLine
 * @param {Array} currLine
 */
function LCSProc(
  old: ElementSnapshot,
  cur: ElementSnapshot,
  match: (left: ElementSnapshot, right: ElementSnapshot) => boolean,
  x: number,
  lastLine: { l: ElementSnapshot; r: ElementSnapshot }[][],
  currLine: { l: ElementSnapshot; r: ElementSnapshot }[][]
) {
  if (match(old, cur)) {
    let sequence = (lastLine[x - 1] || []).slice(0);
    sequence.push({ l: old, r: cur });
    currLine[x] = sequence;
  } else {
    let lSeq = currLine[x - 1];
    let tSeq = lastLine[x];
    if (lSeq && tSeq) {
      if (lSeq.length < tSeq.length) {
        currLine[x] = tSeq.slice(0);
      } else {
        currLine[x] = lSeq.slice(0);
      }
    } else if (lSeq) {
      currLine[x] = lSeq.slice(0);
    } else if (tSeq) {
      currLine[x] = tSeq.slice(0);
    }
  }
}

/**
 * Longest common subsequence (obverse)
 */
function LCSHeadFirst(
  left: ElementSnapshot[],
  right: ElementSnapshot[],
  match: (left: ElementSnapshot, right: ElementSnapshot) => boolean
): { l: ElementSnapshot; r: ElementSnapshot }[] {
  let lastLine = [];
  let currLine = [];
  let y = left.length;
  let len = right.length;
  while (y--) {
    let old = left[y];
    let i = len;
    while (i--) {
      let cur = right[i];
      let x = len - i - 1;
      LCSProc(old, cur, match, x, lastLine, currLine);
    }
    lastLine = currLine;
    currLine = [];
  }
  return lastLine.pop() || [];
}

/**
 * Longest common subsequence (reverse)
 */
function LCSTailFirst(
  left: ElementSnapshot[],
  right: ElementSnapshot[],
  match: (left: ElementSnapshot, right: ElementSnapshot) => boolean
): { l: ElementSnapshot; r: ElementSnapshot }[] {
  let lastLine = [];
  let currLine = [];
  left.forEach(function (old) {
    right.forEach(function (cur, x) {
      LCSProc(old, cur, match, x, lastLine, currLine);
    });
    lastLine = currLine;
    currLine = [];
  });
  return lastLine.pop() || [];
}

/**
 * diff change
 */
export function diff(
  left: ElementSnapshot,
  right: ElementSnapshot,
  opt: any
): { type: string; node: ElementSnapshot }[] {
  let ret = [];
  let change = {
    type: 0,
    node: right,
  };
  if (left.style !== right.style) {
    change.type |= opt.changeType.STYLE;
  }
  let LCS = opt.priority === "head" ? LCSHeadFirst : LCSTailFirst;
  LCS(left.child, right.child, isMatch).forEach(function (node) {
    let old = node.l;
    let cur = node.r;
    cur.matched = old.matched = true;
    if (cur.name === "#") {
      if (old.text !== cur.text) {
        // match node, but contents are different.
        change.type |= opt.changeType.TEXT;
      }
    } else {
      // recursive
      ret = ret.concat(diff(old, cur, opt));
    }
  });
  right.child.forEach(function (node) {
    if (!node.matched) {
      if (node.name === "#") {
        // add text, but count as text change
        change.type |= opt.changeType.TEXT;
      } else {
        // add element
        ret.push({
          type: opt.changeType.ADD,
          node: node,
        });
      }
    }
  });
  left.child.forEach(function (node) {
    if (!node.matched) {
      if (node.name === "#") {
        // remove text, but count as text change
        change.type |= opt.changeType.TEXT;
      } else {
        // removed element
        ret.push({
          type: opt.changeType.REMOVE,
          node: node,
        });
      }
    }
  });
  if (change.type) {
    ret.push(change);
  }
  return ret;
}
