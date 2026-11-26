import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { CellRegistry, MetaGridController, parseFxConfig } from "../src/htmx-grid";

describe("MetaGrid Component Suite (Second Hyperstack Meta Component)", () => {
  const viewPath = join(process.cwd(), "views/components/metagrid.html");
  const goPath = join(process.cwd(), "go/components/metagrid.go");
  const goTestPath = join(process.cwd(), "go/components/metagrid_test.go");

  test("1. Files exist across HTML views, Go DSL, and Go tests", () => {
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(goPath)).toBe(true);
    expect(existsSync(goTestPath)).toBe(true);
  });

  test("2. View includes both metagrid and metagrid-ext modes", () => {
    const html = readFileSync(viewPath, "utf-8");
    expect(html).toContain('mode="metagrid"');
    expect(html).toContain('mode="metagrid-ext"');
    expect(html).toContain("[metagrid]");
    expect(html).toContain("[metagrid-ext]");
    expect(html).toContain("data-meta-browser");
    expect(html).toContain("data-meta-formula");
    expect(html).toContain("data-cell-skip");
  });

  test("3. CellRegistry includes MetaGrid accounting & master cell types", () => {
    expect(CellRegistry["mono-text"]).toBeDefined();
    expect(CellRegistry["currency"]).toBeDefined();
    expect(CellRegistry["status-badge"]).toBeDefined();
    expect(CellRegistry["select"]).toBe(CellRegistry["dropdown"]);
  });

  test("4. parseFxConfig parses .fx flags and defaults", () => {
    const fakeEl: any = {
      getAttribute: (name: string) => (name === "mode" ? "metagrid-ext" : '{"features":{"keyboard":false,"editable":false,"formulaBar":false}}'),
      querySelector: () => null,
    };
    fakeEl.getAttribute = (name: string) => {
      if (name === "mode") return "metagrid-ext";
      if (name === "hx-fx") return '{"features":{"keyboard":false,"editable":false,"formulaBar":false},"pane1":{"pagination":"numbers","pageSize":25}}';
      return null;
    };
    const cfg = parseFxConfig(fakeEl);
    expect(cfg.mode).toBe("metagrid-ext");
    expect(cfg.features?.keyboard).toBe(false);
    expect(cfg.features?.editable).toBe(false);
    expect(cfg.features?.formulaBar).toBe(false);
    expect(cfg.pane1?.pagination).toBe("numbers");
    expect(cfg.pane1?.pageSize).toBe(25);
  });

  test("5. Simple table degradation attaches zero keyboard listeners when disabled in .fx", () => {
    let keydownAttached = false;
    const fakeRoot: any = {
      getAttribute: () => null,
      hasAttribute: () => false,
      setAttribute: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: (evt: string) => {
        if (evt === "keydown") keydownAttached = true;
      },
    };
    new MetaGridController(fakeRoot, {
      mode: "metagrid",
      features: { keyboard: false, editable: false, formulaBar: false },
    });
    expect(keydownAttached).toBe(false);
  });

  test("6. Registered in server.ts and scripts/build-static.ts", () => {
    const srv = readFileSync(join(process.cwd(), "server.ts"), "utf-8");
    const bld = readFileSync(join(process.cwd(), "scripts/build-static.ts"), "utf-8");
    expect(srv).toContain('"metagrid"');
    expect(bld).toContain('"metagrid"');
  });
});
