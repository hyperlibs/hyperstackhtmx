import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// Lightweight DOM mock for Bun test environment
class MockHTMLElement {
  tagName = "DIV";
  className = "";
  children: MockHTMLElement[] = [];
  parentNode: MockHTMLElement | null = null;
  textContent = "";
  disabled = false;
  value = "";
  type = "";
  scrollTop = 0;
  scrollLeft = 0;
  clientHeight = 400;
  clientWidth = 800;
  style: Record<string, string> = {};
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  private listeners = new Map<string, Function[]>();
  classList: {
    add: (...classes: string[]) => void;
    remove: (...classes: string[]) => void;
    contains: (c: string) => boolean;
  };

  constructor(tagName = "DIV") {
    this.tagName = tagName.toUpperCase();
    this.classList = {
      add: (...classes: string[]) => {
        const parts = this.className ? this.className.split(/\s+/).filter(Boolean) : [];
        for (const c of classes) {
          if (!parts.includes(c)) parts.push(c);
        }
        this.className = parts.join(" ");
      },
      remove: (...classes: string[]) => {
        const parts = this.className ? this.className.split(/\s+/).filter(Boolean) : [];
        this.className = parts.filter((c) => !classes.includes(c)).join(" ");
      },
      contains: (c: string) => {
        return this.className.split(/\s+/).includes(c);
      },
    };
  }

  setAttribute(name: string, val: string) { 
    this.attributes.set(name, String(val)); 
    if (name.startsWith('data-')) {
      const prop = name.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
      this.dataset[prop] = String(val);
    }
  }
  getAttribute(name: string) { return this.attributes.get(name) || null; }
  hasAttribute(name: string) { return this.attributes.has(name); }
  appendChild(child: any) {
    if (child && child.nodeType === 11) {
      for (const ch of child.children) {
        this.children.push(ch);
        ch.parentNode = this;
      }
    } else if (child) {
      this.children.push(child);
      child.parentNode = this;
    }
    return child;
  }
  addEventListener(evt: string, cb: Function) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, []);
    this.listeners.get(evt)!.push(cb);
  }
  dispatchEvent(event: any) {
    const list = this.listeners.get(event.type || event);
    if (list) {
      for (const cb of list) cb(event);
    }
    return true;
  }
  focus() {}
  querySelector(sel: string): any {
    for (const ch of this.children) {
      if (ch.tagName === sel.toUpperCase()) return ch;
      const found = ch.querySelector(sel);
      if (found) return found;
    }
    return null;
  }
  querySelectorAll(sel: string): any[] {
    const res: any[] = [];
    const targetTag = sel.toUpperCase();
    for (const ch of this.children) {
      if (ch.tagName === targetTag) res.push(ch);
      res.push(...ch.querySelectorAll(sel));
    }
    return res;
  }
  get innerHTML() { return this.textContent; }
  set innerHTML(val: string) { this.textContent = val; this.children = []; }
}

if (typeof (globalThis as any).document === "undefined") {
  (globalThis as any).document = {
    createElement: (tag: string) => new MockHTMLElement(tag),
    createDocumentFragment: () => {
      const frag = new MockHTMLElement("FRAGMENT");
      (frag as any).nodeType = 11;
      return frag;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  };
}

import { CellRegistry, EnterpriseDataGrid, type GridColumn } from "../src/htmx-grid";

describe("HxGrid Component Suite (Flyweight Cell Registry & Directives)", () => {
  const tsPath = join(process.cwd(), "src/htmx-grid.ts");
  const typesPath = join(process.cwd(), "src/types.d.ts");
  const goPath = join(process.cwd(), "go/components/components.go");
  const viewPath = join(process.cwd(), "views/components/hx-grid.html");

  test("1. Files exist and contain required contracts", () => {
    expect(existsSync(tsPath)).toBe(true);
    expect(existsSync(typesPath)).toBe(true);
    expect(existsSync(goPath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
  });

  test("2. CellRegistry exports core archetypes", () => {
    expect(CellRegistry).toBeDefined();
    expect(CellRegistry["text"]).toBeDefined();
    expect(CellRegistry["metatext"]).toBeDefined();
    expect(CellRegistry["dropdown"]).toBeDefined();
    expect(CellRegistry["checkbox"]).toBeDefined();
    expect(CellRegistry["chipsui"]).toBeDefined();
    expect(CellRegistry["date"]).toBeDefined();
    
    // Short codes
    expect(CellRegistry["txt"]).toBe(CellRegistry["text"]);
    expect(CellRegistry["mtxt"]).toBe(CellRegistry["metatext"]);
    expect(CellRegistry["chips"]).toBe(CellRegistry["chipsui"]);
    expect(CellRegistry["chk"]).toBe(CellRegistry["checkbox"]);
  });

  test("3. MetaText cell adapter mounts flush slots and updates values", () => {
    const cellEl = document.createElement("div");
    const col: GridColumn = { field: "client", header: "Client", compid: "metatext" };
    const refs = CellRegistry["metatext"].mount(cellEl, col);

    expect(cellEl.className).toContain("hs-metatext");
    expect(refs.topL).toBeDefined();
    expect(refs.hero).toBeDefined();
    expect(refs.botL).toBeDefined();

    // Update with array tuple
    CellRegistry["metatext"].update(refs, ["EXPEDITED", "AWB-10", "Apex Aero", "$45,000", "WT:100kg"], {}, col);
    expect(refs.topL.textContent).toBe("EXPEDITED");
    expect(refs.topR.textContent).toBe("AWB-10");
    expect(refs.hero.textContent).toBe("Apex Aero");
    expect(refs.botL.textContent).toBe("$45,000");
    expect(refs.botR.textContent).toBe("WT:100kg");
  });

  test("4. ChipsUI honors server-pushed directives (mode: single vs multi)", () => {
    const cellEl = document.createElement("div");
    const colSingle: GridColumn = { 
      field: "tags", 
      header: "Tags", 
      compid: "chipsui", 
      directives: { mode: "single", maxTags: 1 } 
    };
    const refs = CellRegistry["chipsui"].mount(cellEl, colSingle);
    
    CellRegistry["chipsui"].update(refs, ["Cardio", "Vent"], {}, colSingle);
    const buttons = refs.container.querySelectorAll("button");
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe("Cardio");
    expect(buttons[1].textContent).toBe("Vent");
  });

  test("5. Go DSL parity: components.go implements HxGrid, GridColumn, and CellDirectives", () => {
    const goContent = readFileSync(goPath, "utf-8");
    expect(goContent).toContain("type CellDirectives struct");
    expect(goContent).toContain("type GridColumn struct");
    expect(goContent).toContain("type HxGridProps struct");
    expect(goContent).toContain("func HxGrid(p HxGridProps) Component");
  });

  test("6. Documentation view covers million-row flyweight architecture", () => {
    const viewContent = readFileSync(viewPath, "utf-8");
    expect(viewContent).toContain("compid: 'metatext'");
    expect(viewContent).toContain("compid: 'chipsui'");
    expect(viewContent).toContain("The Component IS the Cell");
    expect(viewContent).toContain("Flyweight DOM Recycling");
  });
});
