import { describe, it, expect } from "bun:test";
import { readFileSync, existsSync } from "fs";

describe("Atomic Precision Architecture Documentation & Domain Specification Suite", () => {
  const filePath = "views/components/atomic-precision.html";

  it("1. views/components/atomic-precision.html exists and is properly structured", () => {
    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    expect(content.length).toBeGreaterThan(1000);
    expect(content).toContain("Atomic Precision &amp; Universal Addressing");
  });

  it("2. Explains the 4 Core Atomic Pillars", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("Deterministic Addressing");
    expect(content).toContain("Atomic Hot Patches");
    expect(content).toContain("Zero Virtual DOM");
    expect(content).toContain("Atomic $diag Telemetry");
  });

  it("3. Contains Domain 1: CMS & Visual Studio Builder with blockid & layer coordinates", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("Domain 1: CMS &amp; Visual Studio Builders");
    expect(content).toContain('blockid="hw-block-buybox"');
    expect(content).toContain('layer="3"');
    expect(content).toContain("translate3d(120px, 45px, 0)");
  });

  it("4. Contains Domain 2: E-Commerce Buy Box with SKU addressing and micro-deltas", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("Domain 2: E-Commerce Buy Box");
    expect(content).toContain('objid="buybox-kb-01"');
    expect(content).toContain("Tactile Brown");
    expect(content).toContain("Express Add to Cart");
  });

  it("5. Contains Domain 3: Enterprise DataGrid with rowid and cellid coordinates", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("Domain 3: Large Enterprise DataGrid &amp; ERP Ledger");
    expect(content).toContain('rowid="INV-10023"');
    expect(content).toContain('cellid="INV-10023:amount"');
    expect(content).toContain("Million-Cell 2D Sparse Matrix");
  });

  it("6. Contains Domain 4: Kinetic Game Simulators with 120Hz canvas loops", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("Domain 4: Games &amp; Kinetic Particle Simulators");
    expect(content).toContain('hx-sim="boids"');
    expect(content).toContain("120Hz");
    expect(content).toContain("HxBolt.ticker");
  });

  it("7. Contains Domain 5: Spatial Mobile OS with Photoshop-style 0..9 layers", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("Domain 5: Spatial Mobile OS &amp; Hardware Bridges");
    expect(content).toContain('&lt;app-layer level="0"');
    expect(content).toContain('&lt;app-layer level="1"');
    expect(content).toContain('&lt;app-bottom-sheet id="sheet-invite" level="9"');
  });

  it("8. Adheres strictly to light theme and light pastel/grey code blocks", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("bg-[#f8fafc]");
    // Ensure dark code blocks (#1e293b) are NOT used
    expect(content).not.toContain("bg-[#1e293b]");
  });

  it("9. Includes Anti-Hallucination Blueprint matrix for AI coders", () => {
    const content = readFileSync(filePath, "utf-8");
    expect(content).toContain("The Anti-Hallucination Blueprint");
    expect(content).toContain("Why AI Never Hallucinates");
    expect(content).toContain("Deterministic ID directly points to the node");
  });
});
