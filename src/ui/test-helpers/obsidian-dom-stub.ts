/**
 * ObsidianのDOMヘルパー(グローバルのcreateDiv/createSpanや
 * document.createDocumentFragmentなど)をテスト用に再現するスタブ。
 *
 * jest(node環境)にはDOMが無いため、suggestion-factoryが利用する
 * DOM APIだけを最小限のフェイクで実装している。テストの先頭で
 * `installObsidianDomStubs()` を呼び出して使う。
 */

export type StubDomElementInfo = {
  cls?: string | string[];
  text?: string;
  attr?: Record<string, string | number | boolean | null>;
  title?: string;
};

/** テキストノード */
export class StubTextNode {
  constructor(public readonly text: string) {}
}

/** insertAdjacentHTMLで挿入されたHTML断片(アイコンSVGなど)のマーカー */
export class StubHtmlNode {
  constructor(public readonly html: string) {}
}

export type StubChild = StubElement | StubTextNode | StubHtmlNode;

/** DocumentFragment相当。appendChildされると中身が移動する */
export class StubFragment {
  children: StubChild[] = [];

  appendChild(node: StubChild | StubFragment): unknown {
    appendNode(this.children, undefined, node);
    return node;
  }
}

export class StubElement {
  children: StubChild[] = [];
  classes: string[] = [];
  attrs: Record<string, string> = {};
  parent?: StubElement;

  constructor(
    public readonly tag: string,
    o?: StubDomElementInfo,
  ) {
    if (o?.cls) {
      const classes = Array.isArray(o.cls) ? o.cls : [o.cls];
      this.classes = classes.filter((x) => x !== "");
    }
    if (o?.text) {
      this.children.push(new StubTextNode(o.text));
    }
    if (o?.title != null) {
      this.attrs.title = o.title;
    }
    if (o?.attr) {
      for (const [key, value] of Object.entries(o.attr)) {
        this.attrs[key] = String(value);
      }
    }
  }

  appendChild(node: StubChild | StubFragment): unknown {
    appendNode(this.children, this, node);
    return node;
  }

  insertAdjacentHTML(_position: "beforeend", html: string): void {
    this.children.push(new StubHtmlNode(html));
  }

  appendText(text: string): void {
    this.children.push(new StubTextNode(text));
  }

  createSpan(o?: StubDomElementInfo): StubElement {
    const el = new StubElement("span", o);
    this.appendChild(el);
    return el;
  }

  createDiv(o?: StubDomElementInfo): StubElement {
    const el = new StubElement("div", o);
    this.appendChild(el);
    return el;
  }

  hasClass(cls: string): boolean {
    return this.classes.includes(cls);
  }

  /** テキストノードのみを連結したテキスト(HTML断片は含まない) */
  get textContent(): string {
    return this.children
      .map((child) => {
        if (child instanceof StubTextNode) {
          return child.text;
        }
        if (child instanceof StubElement) {
          return child.textContent;
        }
        return "";
      })
      .join("");
  }
}

/**
 * 実DOMのappendChildと同じく、既に親を持つ要素は元の親から取り除いて移動し、
 * fragmentは中身だけを移す
 */
function appendNode(
  children: StubChild[],
  newParent: StubElement | undefined,
  node: StubChild | StubFragment,
): void {
  if (node instanceof StubFragment) {
    for (const child of node.children) {
      appendNode(children, newParent, child);
    }
    node.children = [];
    return;
  }

  if (node instanceof StubElement) {
    if (node.parent) {
      const siblings = node.parent.children;
      const index = siblings.indexOf(node);
      if (index >= 0) {
        siblings.splice(index, 1);
      }
    }
    node.parent = newParent;
  }

  children.push(node);
}

/** 子孫からclassを持つ要素をすべて探す(rootは含まない) */
export function findAllByClass(root: StubElement, cls: string): StubElement[] {
  const found: StubElement[] = [];
  for (const child of root.children) {
    if (!(child instanceof StubElement)) {
      continue;
    }
    if (child.hasClass(cls)) {
      found.push(child);
    }
    found.push(...findAllByClass(child, cls));
  }
  return found;
}

/** 子孫からclassを持つ最初の要素を探す(rootは含まない) */
export function findByClass(
  root: StubElement,
  cls: string,
): StubElement | null {
  return findAllByClass(root, cls)[0] ?? null;
}

/** 直下の子のうちHTML断片(アイコンなど)を返す */
export function htmlNodesOf(el: StubElement): StubHtmlNode[] {
  return el.children.filter((x) => x instanceof StubHtmlNode);
}

/**
 * suggestion-factoryが参照するObsidianのグローバルDOMヘルパーを
 * スタブに差し替えます
 */
export function installObsidianDomStubs(): void {
  const g = globalThis as any;
  g.createDiv = (o?: StubDomElementInfo) => new StubElement("div", o);
  g.createSpan = (o?: StubDomElementInfo) => new StubElement("span", o);
  // momentは提供しない(parseFrontMatterDateはDate.parseへフォールバックする)
  g.activeWindow = {};
  g.document = {
    createDocumentFragment: () => new StubFragment(),
    createTextNode: (text: string) => new StubTextNode(text),
  };
}
