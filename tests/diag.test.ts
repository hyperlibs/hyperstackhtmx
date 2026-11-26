import { describe, it, expect, beforeEach } from "bun:test";
import { DiagnosticService, type LiveDiagEvent } from "../src/htmx-devtools";

describe("Hyperstack $diag Autonomous Diagnostics & Self-Healing Telemetry Suite", () => {
  let diag: DiagnosticService;

  beforeEach(() => {
    diag = new DiagnosticService();
    diag.clear();
  });

  it("1. Initializes with empty circular buffer and clean health stats", () => {
    expect(diag.getLogs().length).toBe(0);
    const stats = diag.getStats();
    expect(stats.total).toBe(0);
    expect(stats.errors).toBe(0);
    expect(stats.warnings).toBe(0);
    expect(stats.health).toBe("100%");
  });

  it("2. Records and categorizes CSS asset load failures with actionable fix hints", () => {
    const event = diag.record({
      code: "CSS_LOAD_FAILURE",
      category: "CSS_ASSET",
      severity: "ERROR",
      url: "/docs/components/text",
      culprit: "/css/missing-theme.css",
      target: '<link rel="stylesheet">',
      message: "CSS stylesheet failed to load: /css/missing-theme.css",
      fixHint: "Ensure file exists in public/ or dist/ and route is mapped in server.ts/server.go."
    });

    expect(event.id).toMatch(/^diag-/);
    expect(event.category).toBe("CSS_ASSET");
    expect(event.severity).toBe("ERROR");
    expect(diag.getLogs().length).toBe(1);

    const stats = diag.getStats();
    expect(stats.total).toBe(1);
    expect(stats.errors).toBe(1);
    expect(stats.cssAssets).toBe(1);
    expect(stats.health).toBe("95%");
  });

  it("3. Records and categorizes HTMX 404 partial swap errors", () => {
    diag.record({
      code: "HTMX_404_NOT_FOUND",
      category: "HTMX_SWAP",
      severity: "ERROR",
      status: 404,
      url: "/demo/tailadmin",
      culprit: "/api/ward/vitals",
      target: "#ward-stream",
      message: "HTMX request failed with HTTP 404 for /api/ward/vitals",
      fixHint: "Add endpoint route handler in server.ts and server.go for /api/ward/vitals"
    });

    const logs = diag.getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].code).toBe("HTMX_404_NOT_FOUND");
    expect(logs[0].status).toBe(404);

    const stats = diag.getStats();
    expect(stats.routes404).toBe(1);
    expect(stats.htmxSwaps).toBe(1);
  });

  it("4. Enforces circular buffer limit of 200 events", () => {
    for (let i = 0; i < 250; i++) {
      diag.record({
        code: `ERR_${i}`,
        category: "404_ROUTE",
        culprit: `/path/to/broken-${i}`,
        message: `Broken route ${i}`
      });
    }

    const logs = diag.getLogs();
    expect(logs.length).toBe(200);
    // Newest event should be at the front
    expect(logs[0].code).toBe("ERR_249");
  });

  it("5. Notifies registered subscribers in real-time when an event arrives", () => {
    let notifiedEvent: LiveDiagEvent | null = null;
    let totalCount = 0;

    const unsubscribe = diag.subscribe((event, all) => {
      notifiedEvent = event;
      totalCount = all.length;
    });

    diag.record({
      code: "JS_RUNTIME_ERROR",
      category: "RUNTIME_JS",
      severity: "CRITICAL",
      culprit: "bundle.js:42",
      message: "Uncaught TypeError: Cannot read property of undefined"
    });

    expect(notifiedEvent).not.toBeNull();
    expect(notifiedEvent!.code).toBe("JS_RUNTIME_ERROR");
    expect(totalCount).toBe(1);

    unsubscribe();

    diag.record({
      code: "WARNING_TEST",
      category: "INTERNAL",
      severity: "WARNING",
      culprit: "test",
      message: "Second event"
    });

    // Should not notify after unsubscribe
    expect(totalCount).toBe(1);
  });

  it("6. Generates machine-actionable Markdown prompt for AI coders to self-heal", () => {
    diag.record({
      code: "CSS_LOAD_FAILURE",
      category: "CSS_ASSET",
      severity: "ERROR",
      url: "/docs/components/text",
      culprit: "/css/theme.css",
      message: "CSS stylesheet failed to load: /css/theme.css",
      fixHint: "Build with bun run build:css or map in server.ts"
    });

    const prompt = diag.generateAIPrompt();
    expect(prompt).toContain("🤖 @diag Self-Healing AI Repair Task");
    expect(prompt).toContain("[@diag CSS_LOAD_FAILURE]");
    expect(prompt).toContain("Culprit: `/css/theme.css`");
    expect(prompt).toContain("Build with bun run build:css or map in server.ts");
  });

  it("7. Exports valid SARIF 2.1.0 output for CI/CD and security scanners", () => {
    diag.record({
      code: "HTMX_404_NOT_FOUND",
      category: "HTMX_SWAP",
      severity: "ERROR",
      url: "/demo/tailadmin",
      culprit: "/api/missing",
      message: "HTTP 404 on /api/missing",
      fixHint: "Register handler"
    });

    const sarifJson = diag.generateSARIF();
    const sarif = JSON.parse(sarifJson);
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs.length).toBe(1);
    expect(sarif.runs[0].results.length).toBe(1);
    expect(sarif.runs[0].results[0].ruleId).toBe("HTMX_404_NOT_FOUND");
    expect(sarif.runs[0].results[0].level).toBe("error");
  });

  it("8. Simulation helpers generate realistic telemetry entries", () => {
    const sim404 = diag.simulate("404");
    expect(sim404.code).toBe("CLIENT_404_NOT_FOUND");
    expect(sim404.category).toBe("404_ROUTE");

    const simCss = diag.simulate("css");
    expect(simCss.code).toBe("CSS_LOAD_FAILURE");
    expect(simCss.category).toBe("CSS_ASSET");

    const simSwap = diag.simulate("swap");
    expect(simSwap.code).toBe("HTMX_404_NOT_FOUND");
    expect(simSwap.category).toBe("HTMX_SWAP");

    const simJs = diag.simulate("js");
    expect(simJs.code).toBe("JS_RUNTIME_ERROR");
    expect(simJs.category).toBe("RUNTIME_JS");

    expect(diag.getLogs().length).toBe(4);
  });
});
