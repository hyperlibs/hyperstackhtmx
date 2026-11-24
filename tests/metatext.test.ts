import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("MetaText Component Suite (First Hyperstack Meta Component)", () => {
  const viewPath = join(process.cwd(), "views/components/metatext.html");
  const goPath = join(process.cwd(), "go/components/metatext.go");
  const goTestPath = join(process.cwd(), "go/components/metatext_test.go");

  test("1. views/components/metatext.html exists and is properly documented", () => {
    expect(existsSync(viewPath)).toBe(true);
    const content = readFileSync(viewPath, "utf-8");
    expect(content.length).toBeGreaterThan(500);
    expect(content).toContain("metatext.html");
    expect(content).toContain("2x2 Cap");
    expect(content).toContain("50% Typography Rule");
  });

  test("2. Go DSL parity: go/components/metatext.go implements MetaText and MetaTextField", () => {
    expect(existsSync(goPath)).toBe(true);
    const goContent = readFileSync(goPath, "utf-8");
    expect(goContent).toContain("type MetaTextProps struct");
    expect(goContent).toContain("type MetaCell struct");
    expect(goContent).toContain("func MetaText(p MetaTextProps) Component");
    expect(goContent).toContain("func MetaTextField(spec string, modifiers ...string) Component");
    expect(goContent).toContain("func ParseMetaTextSpec(spec string) MetaTextProps");
    expect(goContent).toContain("func (c Component) RenderTo(w io.Writer) error");
  });

  test("3. Go unit tests exist in go/components/metatext_test.go", () => {
    expect(existsSync(goTestPath)).toBe(true);
    const testContent = readFileSync(goTestPath, "utf-8");
    expect(testContent).toContain("TestMetaTextParsing");
    expect(testContent).toContain("TestMetaText2x2Guardrail");
    expect(testContent).toContain("TestMetaTextEditableMode");
  });

  test("4. View includes all 3 real-world previews (Badge, Form, Table, and Reactive)", () => {
    const content = readFileSync(viewPath, "utf-8");
    expect(content).toContain("1. Standalone MetaText Badge (Reference Display)");
    expect(content).toContain("2. In a Form: Editable MetaText with HTMX Auto-Save");
    expect(content).toContain("3. Inside a Table: High-Density Ward Roster");
    expect(content).toContain("4. Dynamic Client-Side Reactive State (HxBolt Signals)");
  });

  test("5. Exact user screenshot coordinates match in HTML", () => {
    const content = readFileSync(viewPath, "utf-8");
    expect(content).toContain("UHID");
    expect(content).toContain("1221");
    expect(content).toContain("Pt - David Jeba");
    expect(content).toContain("AGE");
    expect(content).toContain("45");
    expect(content).toContain("SEX");
    expect(content).toContain("Male");
  });

  test("6. Registered in server.ts and scripts/build-static.ts", () => {
    const serverContent = readFileSync(join(process.cwd(), "server.ts"), "utf-8");
    const buildStaticContent = readFileSync(join(process.cwd(), "scripts/build-static.ts"), "utf-8");
    expect(serverContent).toContain('"metatext"');
    expect(buildStaticContent).toContain('"metatext"');
  });

  test("7. Static documentation page was generated in dist/", () => {
    const distPath = join(process.cwd(), "dist/docs/components/metatext/index.html");
    expect(existsSync(distPath)).toBe(true);
    const distContent = readFileSync(distPath, "utf-8");
    expect(distContent).toContain("Pt - David Jeba");
  });
});
